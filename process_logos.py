from PIL import Image

def remove_bg(path, color_to_remove, tolerance=10):
    print(f"Processing {path}...")
    img = Image.open(path)
    img = img.convert("RGBA")
    data = img.getdata()
    
    newData = []
    r_target, g_target, b_target = color_to_remove
    
    for item in data:
        r, g, b, a = item
        # Check if color is close to target
        if abs(r - r_target) < tolerance and abs(g - g_target) < tolerance and abs(b - b_target) < tolerance:
            newData.append((255, 255, 255, 0)) # Transparent
        else:
            newData.append(item)
            
    img.putdata(newData)
    
    # Auto-crop content
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(path)
    print(f"Saved {path}")

if __name__ == "__main__":
    # Light logo has WHITE background
    remove_bg('static/icons/logo-light.png', (255, 255, 255))
    
    # Dark logo has BLACK background
    remove_bg('static/icons/logo-dark.png', (0, 0, 0))
