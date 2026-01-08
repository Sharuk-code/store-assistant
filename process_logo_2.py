from PIL import Image, ImageChops

def process_logo_2():
    img = Image.open('static/icons/logo-source-2.png')
    
    # 1. Attempt to find bbox
    bg = Image.new(img.mode, img.size, img.getpixel((0,0)))
    diff = ImageChops.difference(img, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    
    if bbox:
        print(f"Cropping content to: {bbox}")
        img = img.crop(bbox)
    else:
        print("No distinct content found, using full image.")
    
    # Save Full Logo
    img.save('static/icons/logo-full.png')
    
    # Save Icon (Resized)
    icon = img.resize((256, 256), Image.Resampling.LANCZOS)
    icon.save('static/icons/logo.png')
    
    print("Saved logo-full.png and logo.png")

if __name__ == "__main__":
    process_logo_2()
