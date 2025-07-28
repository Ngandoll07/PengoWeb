# ai/blip_image.py
import sys
import json
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration

image_path = sys.argv[1]

processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

raw_image = Image.open(image_path).convert("RGB")
inputs = processor(raw_image, return_tensors="pt")

out = model.generate(**inputs)
caption = processor.decode(out[0], skip_special_tokens=True)

print(json.dumps({ "description": caption }, ensure_ascii=False))
