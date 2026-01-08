# Icon Sprite Sheet Generation Prompt

## For Banana AI or similar image generators

### Horizontal Layout (Recommended)
```
Create a horizontal sprite sheet with 6 icons for a store management app. 
Layout: Single row, 6 equal cells (64x64px each), total image size 384x64px.
Style: Minimal line-art icons, 2px stroke, dark gray (#3d5a80), transparent background, rounded corners on container icons.

Icons left to right:
1. DASHBOARD - Analytics card with bar chart and pie chart
2. POINT OF SALE - Shopping cart with receipt paper
3. REPAIRS - Two crossed wrenches/spanners
4. INVENTORY - Three stacked boxes/packages in a container
5. PURCHASES - Wallet with dollar bills behind it  
6. SETTINGS - Gear cog with vertical equalizer sliders

Consistent style: Modern, clean, professional, same line weight throughout, same visual weight per icon.
```

### Vertical Layout (Alternative)
```
Layout: Single column, 6 rows (64x64px each), total image size 64x384px.
```

---

## After Generation

1. Save as `icons-sprite.png` in `static/icons/`
2. Let me know and I'll update the CSS to use sprite positioning
