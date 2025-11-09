"""
Script để generate base64 string từ một ảnh thật
Sử dụng để tạo test events với ảnh hợp lệ
"""

import base64
import sys

def image_to_base64(image_path):
    """Convert image file to base64 data URL"""
    try:
        with open(image_path, 'rb') as image_file:
            image_data = image_file.read()
            base64_string = base64.b64encode(image_data).decode('utf-8')
            
            # Determine image type
            if image_path.lower().endswith('.png'):
                mime_type = 'image/png'
            elif image_path.lower().endswith('.jpg') or image_path.lower().endswith('.jpeg'):
                mime_type = 'image/jpeg'
            elif image_path.lower().endswith('.webp'):
                mime_type = 'image/webp'
            else:
                mime_type = 'image/jpeg'
            
            data_url = f"data:{mime_type};base64,{base64_string}"
            return data_url
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python generate_test_image_base64.py <image_path>")
        print("Example: python generate_test_image_base64.py test.jpg")
        sys.exit(1)
    
    image_path = sys.argv[1]
    base64_data = image_to_base64(image_path)
    
    if base64_data:
        print("\n✅ Base64 data URL:")
        print(base64_data)
        print(f"\n📏 Length: {len(base64_data)} characters")
        print(f"📦 Size: ~{len(base64_data) * 3 // 4} bytes (decoded)")
    else:
        print("❌ Failed to convert image to base64")

