"""
EcoTrade — GAN satellite image generation using GeoSynth (ControlNet + SD2.1)

원본 위성사진의 edge를 추출하고,
"dense forest vegetation" 프롬프트로 ControlNet이 산림 복원 이미지를 생성합니다.
"""

import torch
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, UniPCMultistepScheduler
from diffusers.utils import load_image
import cv2
import requests
import io
import os
from math import floor, log, tan, pi, cos

OUT_DIR = os.path.join(os.path.dirname(__file__), 'public', 'satellite')
os.makedirs(OUT_DIR, exist_ok=True)

def download_satellite(lat=36.9305, lon=127.5890, zoom=15, size=512):
    """Download satellite tiles"""
    n = 2 ** zoom
    x_tile = int(floor((lon + 180) / 360 * n))
    y_tile = int(floor((1 - log(tan(lat * pi / 180) + 1 / cos(lat * pi / 180)) / pi) / 2 * n))

    result = Image.new('RGB', (512, 512))
    for dy in range(2):
        for dx in range(2):
            url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{zoom}/{y_tile+dy}/{x_tile+dx}"
            try:
                resp = requests.get(url, timeout=15)
                if resp.status_code == 200 and len(resp.content) > 3000:
                    tile = Image.open(io.BytesIO(resp.content)).convert('RGB')
                    result.paste(tile, (dx*256, dy*256))
                    print(f"  Tile OK: {zoom}/{y_tile+dy}/{x_tile+dx}")
            except Exception as e:
                print(f"  Tile error: {e}")
    return result


def extract_canny(image: Image.Image, low=50, high=150) -> Image.Image:
    """Extract Canny edges for ControlNet conditioning"""
    img_np = np.array(image)
    edges = cv2.Canny(img_np, low, high)
    edges = np.stack([edges]*3, axis=-1)
    return Image.fromarray(edges)


def generate_with_controlnet(canny_image: Image.Image, prompt: str) -> Image.Image:
    """Run ControlNet + SD2.1 to generate forest-restored satellite image"""
    print("  Loading ControlNet model (canny)...")

    controlnet = ControlNetModel.from_pretrained(
        "lllyasviel/sd-controlnet-canny",
        torch_dtype=torch.float32,
    )

    print("  Loading Stable Diffusion v1.5 base...")
    pipe = StableDiffusionControlNetPipeline.from_pretrained(
        "sd-legacy/stable-diffusion-v1-5",
        controlnet=controlnet,
        torch_dtype=torch.float32,
        safety_checker=None,
    )
    pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config)

    # Use CPU (MPS has issues with some ops)
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    pipe = pipe.to(device)
    pipe.enable_attention_slicing()

    print(f"  Generating on {device}...")
    print(f"  Prompt: '{prompt}'")

    # Resize canny to 512x512
    canny_resized = canny_image.resize((512, 512))

    result = pipe(
        prompt=prompt,
        image=canny_resized,
        num_inference_steps=20,
        guidance_scale=7.5,
        generator=torch.Generator(device=device).manual_seed(42),
    ).images[0]

    return result


def compute_saliency(original: Image.Image, generated: Image.Image) -> Image.Image:
    """HiGAN-style saliency: purple/magenta on black background"""
    from scipy.ndimage import gaussian_filter

    orig_np = np.array(original.resize((512,512))).astype(np.float32)
    gen_np = np.array(generated.resize((512,512))).astype(np.float32)

    diff = np.abs(gen_np - orig_np)
    saliency = diff[:,:,1]*0.5 + diff[:,:,0]*0.25 + diff[:,:,2]*0.25
    saliency = saliency / (saliency.max() + 1e-6)
    saliency = np.power(saliency, 0.6)
    saliency = np.where(saliency > 0.15, saliency, saliency * 0.05)
    saliency = gaussian_filter(saliency, sigma=1.5)

    h, w = saliency.shape
    result = np.zeros((h, w, 3), dtype=np.float32)
    result[:,:,0] = saliency * 0.65
    result[:,:,1] = saliency * 0.03
    result[:,:,2] = saliency * 0.85

    strong = (saliency > 0.45).astype(np.float32)
    result[:,:,0] += strong * 0.25
    result[:,:,2] += strong * 0.1

    result = np.clip(result, 0, 1)
    return Image.fromarray((result * 255).astype(np.uint8))


def create_overlay(original: Image.Image, saliency: Image.Image) -> Image.Image:
    """Dark original + saliency glow"""
    dark = ImageEnhance.Brightness(original.resize((512,512))).enhance(0.4)
    dark = ImageEnhance.Color(dark).enhance(0.5)

    dark_np = np.array(dark).astype(np.float32) / 255
    sal_np = np.array(saliency.resize((512,512))).astype(np.float32) / 255

    overlay = dark_np + sal_np * 1.0
    overlay = np.clip(overlay, 0, 1)
    return Image.fromarray((overlay * 255).astype(np.uint8))


if __name__ == '__main__':
    print("=== EcoTrade GAN Generation (GeoSynth/ControlNet) ===\n")

    # 1. Download original
    print("[1/5] Downloading satellite image...")
    original = download_satellite()
    original.save(os.path.join(OUT_DIR, 'original.png'), quality=95)
    print(f"  Saved original.png\n")

    # 2. Extract canny edges
    print("[2/5] Extracting Canny edges...")
    canny = extract_canny(original)
    canny.save(os.path.join(OUT_DIR, 'canny.png'))
    print(f"  Saved canny.png\n")

    # 3. Generate with ControlNet
    print("[3/5] Running ControlNet + SD2.1 (this takes a few minutes on CPU/MPS)...")
    prompt = "aerial satellite photograph of dense green forest with trees, lush vegetation covering hills and valleys, natural landscape, high resolution satellite imagery, nadir view"
    generated = generate_with_controlnet(canny, prompt)
    generated.save(os.path.join(OUT_DIR, 'gan_generated.png'), quality=95)
    print(f"  Saved gan_generated.png\n")

    # 4. Saliency
    print("[4/5] Computing saliency...")
    saliency = compute_saliency(original, generated)
    saliency.save(os.path.join(OUT_DIR, 'residual.png'), quality=95)
    print(f"  Saved residual.png\n")

    # 5. Overlay
    print("[5/5] Creating overlay...")
    overlay = create_overlay(original, saliency)
    overlay.save(os.path.join(OUT_DIR, 'overlay.png'), quality=95)
    print(f"  Saved overlay.png\n")

    print("Done! All images in public/satellite/")
