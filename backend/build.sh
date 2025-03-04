#!/usr/bin/env bash
echo "Starting build process..."

# Check if requirements.txt exists in current directory
if [ -f "requirements.txt" ]; then
    echo "Found requirements.txt in current directory"
    pip install -r requirements.txt
elif [ -f "../requirements.txt" ]; then
    echo "Found requirements.txt in parent directory"
    pip install -r ../requirements.txt
else
    echo "No requirements.txt found"
    exit 1
fi

# Create fonts directory and run download script
echo "Running font download script..."
python download_fonts.py

echo "Build process completed" 