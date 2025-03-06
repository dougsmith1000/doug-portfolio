#!/bin/bash

# Create optimized directory if it doesn't exist
mkdir -p public/videos/optimized

# Function to optimize a video
optimize_video() {
    input_file=$1
    output_file="public/videos/optimized/$(basename "$input_file" .mp4)-optimized.mp4"
    
    echo "Optimizing $input_file..."
    
    ffmpeg -i "$input_file" \
        -c:v libx264 \
        -crf 23 \
        -preset medium \
        -movflags +faststart \
        -vf "scale=1280:-2" \
        -c:a aac \
        -b:a 128k \
        "$output_file"
    
    # Get file sizes
    original_size=$(stat -f%z "$input_file")
    optimized_size=$(stat -f%z "$output_file")
    
    echo "Original size: $(($original_size/1024/1024))MB"
    echo "Optimized size: $(($optimized_size/1024/1024))MB"
    echo "Saved: $((($original_size-$optimized_size)/1024/1024))MB"
    echo "---"
}

# Optimize each video
optimize_video "public/videos/rh-trim.mp4"
optimize_video "public/videos/dko-trim.mp4"
optimize_video "public/videos/smite2-complressed.mp4" 