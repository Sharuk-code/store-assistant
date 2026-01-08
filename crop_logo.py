from PIL import Image

def extract_logo():
    img = Image.open('static/icons/logo-full.png')
    print(f"Format: {img.format}, Size: {img.size}, Mode: {img.mode}")
    
    # Check top-left pixel
    tl = img.getpixel((0, 0))
    print(f"Top-left pixel: {tl}")
    
    # If standard white background (255, 255, 255, 255)
    # We want to find the first colored blob.
    # Let's convert to simple BW mask of "not white"
    
    # Threshold for "white"
    thresh = 240
    
    def is_content(p):
        # If RGBA
        if len(p) == 4:
            r, g, b, a = p
            if a < 10: return False # Transparent
            if r > thresh and g > thresh and b > thresh: return False # White
            return True
        # If RGB
        r, g, b = p
        if r > thresh and g > thresh and b > thresh: return False
        return True

    # Scan for content bbox
    w, h = img.size
    left, top, right, bottom = w, h, 0, 0
    found = False
    
    # Heuristic: Scan a grid to find content clusters
    # We expect the main logo to be in the top-left or top-center
    
    # Let's just crop to the "GV" Gear Icon.
    # Based on standard logo sheets, it's likely the icon is on the left or top.
    # I'll crop the first distinct blob I find.
    
    # Let's try to find bounds of all content
    # This might be slow in python loop for 1024x682, but okay for once.
    
    # efficient approach: use getbbox if transparent
    bbox = img.getbbox()
    if bbox:
        # Check if bbox is full image (likely white background)
        if bbox == (0, 0, w, h):
            # It's full, so probably white background.
            # Convert to grayscale and invert?
            print("Full bbox, assuming white background...")
            
            # Simple approach: Find first non-white pixel for top/left
            # Scan diagonal?
            pass
        else:
            print(f"Transparent bbox found: {bbox}")
            # This might be the whole sheet content.
            pass

    # Let's try to just crop the top-left area (likely where the main icon is)
    # 200x200 to 450x450? 
    # I will rely on a simpler method: The user provided a "sprite sheet".
    # I will just create a "logo-icon.png" that is a crop of the Logo.
    # For now, I'll guess coordinates based on typical layout or just ask user? 
    # No, I should try to solve it.
    
    # Let's try to find distinct separate objects (blobs)
    # But for now, let's just make the background transparent and save.
    
    # New Plan: Convert white to transparent, then crop the main icon.
    
    data = img.getdata()
    newData = []
    
    for item in data:
        # Change all white (also shades of whites)
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    
    # Now get bbox
    bbox = img.getbbox()
    if bbox:
        print(f"Content bbox: {bbox}")
        # Crop to content
        content = img.crop(bbox)
        # content.save('static/icons/logo-content.png')
        
        # Now we likely have the whole sheet (text + icon + variants)
        # We want just the icon.
        # Assuming icon is on the left?
        # Let's crop the left square of the bbox.
        
        # approximate:
        # The sheet usually has "Icon" "Logo Text"
        # So left part is icon?
        w_c, h_c = content.size
        
        # Let's guess the icon is the leftmost square
        # icon_w = min(w_c, h_c) # rough guess
        # icon = content.crop((0, 0, icon_w, h_c))
        
        # Actually, let's save the whole content-cropped image as 'logo-clean.png'
        # And user can see it? No.
        
        # Let's try to be smart. 
        # Left 1/3 is likely icon?
        
        # Let's just save the "logo.png" as the crop of (180, 20, 396, 236) ? 
        # I'll try to find the "GV" Gear.
        # It's likely the largest blob.
        
        content.save('static/icons/logo-transparent.png')
        
        # Let's try to crop the left-most heavy object.
        # I'll just crop the left 30% of the content bbox?
        # Or maybe the logo is Centered?
        
        # Let's simple crop:
        # If the image is the one I saw in preview:
        # Top: Large Logo (Icon + Text)
        # Bottom: Small icons
        
        # So I want the Icon from the top part.
        # I'll take the top-left part of the content.
        
        # Let's define a splice.
        # I will save "logo-icon.png" as top-left 300x300 of the content.
        
        icon = content.crop((0, 0, 300, 300)) # Guessing 300x300 is enough for the icon
        icon.save('static/icons/logo.png')
        print("Saved static/icons/logo.png")
        
extract_logo()
