from PIL import Image, ImageDraw

# Create a simple VIB3 icon
def create_icon(size):
    # Create a square image with a gradient background
    img = Image.new('RGB', (size, size), color='#1a1a1a')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple "V3" text
    # Create a purple circle background
    circle_margin = size // 8
    draw.ellipse([circle_margin, circle_margin, size-circle_margin, size-circle_margin], 
                fill='#8B5CF6', outline='#A855F7', width=2)
    
    return img

# Create icons for different densities
sizes = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192
}

base_path = 'vib3_flutter/android/app/src/main/res/'

for density, size in sizes.items():
    icon = create_icon(size)
    icon.save(f'{base_path}mipmap-{density}/ic_launcher.png')
    print(f'Created icon for {density}: {size}x{size}')

print('All icons created successfully!')