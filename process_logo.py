from PIL import Image

def process_logo():
    img = Image.open('static/icons/logo-source.png')
    
    # 1. Convert White to Transparent
    data = img.getdata()
    newData = []
    for item in data:
        # Threshold for white background
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    img.putdata(newData)
    
    # 2. Get Bounding Box of Content
    bbox = img.getbbox()
    if not bbox:
        print("No content found!")
        return
        
    print(f"Content BBox: {bbox}")
    full_logo = img.crop(bbox)
    full_logo.save('static/icons/logo-full.png')
    print("Saved logo-full.png")
    
    # 3. Extract Icon (Left part)
    # Assuming Icon is roughly square and on the left.
    w, h = full_logo.size
    
    # Heuristic: The icon is likely the height of the image (or close to it).
    # And it is on the left.
    # Let's crop a square from the left.
    icon_size = h
    
    # Ensure we don't go out of bounds (unlikely unless text is vertical)
    if icon_size > w:
        icon_size = w
        
    icon = full_logo.crop((0, 0, icon_size, h))
    icon.save('static/icons/logo.png')
    print(f"Saved logo.png (Size: {icon.size})")

if __name__ == "__main__":
    process_logo()
