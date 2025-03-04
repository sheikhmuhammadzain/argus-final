import os
import requests

def download_font(url, filename):
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f"Successfully downloaded {filename}")
        return True
    except Exception as e:
        print(f"Error downloading {filename}: {str(e)}")
        return False

def main():
    # Create fonts directory if it doesn't exist
    if not os.path.exists('fonts'):
        os.makedirs('fonts')

    # Font URLs
    fonts = {
        'fonts/Poppins-Regular.ttf': 'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf',
        'fonts/Poppins-Bold.ttf': 'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf'
    }

    # Download each font if it doesn't exist
    for filename, url in fonts.items():
        if not os.path.exists(filename):
            if download_font(url, filename):
                print(f"Downloaded {filename}")
            else:
                print(f"Failed to download {filename}")
        else:
            print(f"{filename} already exists")

if __name__ == "__main__":
    main() 