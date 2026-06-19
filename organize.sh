#!/bin/bash

# Define target directories
IMG_DIR="Images"
DOC_DIR="Documents"
VID_DIR="Videos"

# Create directories if they don't exist
mkdir -p "$IMG_DIR" "$DOC_DIR" "$VID_DIR"

echo "Organizing files in the current directory..."

# Counter variables
img_count=0
doc_count=0
vid_count=0

# Move images (.jpg, .jpeg, .gif)
for ext in jpg jpeg gif PNG png; do
  # Check if files exist to avoid error messages
  if ls *.$ext >/dev/null 2>&1; then
    count=$(ls -1 *.$ext 2>/dev/null | wc -l)
    mv *.$ext "$IMG_DIR"/ 2>/dev/null
    img_count=$((img_count + count))
  fi
done

# Move documents (.txt, .pdf)
for ext in txt pdf docx doc; do
  if ls *.$ext >/dev/null 2>&1; then
    count=$(ls -1 *.$ext 2>/dev/null | wc -l)
    mv *.$ext "$DOC_DIR"/ 2>/dev/null
    doc_count=$((doc_count + count))
  fi
done

# Move videos (.mp4, .mov, .avi)
for ext in mp4 mov avi mkv; do
  if ls *.$ext >/dev/null 2>&1; then
    count=$(ls -1 *.$ext 2>/dev/null | wc -l)
    mv *.$ext "$VID_DIR"/ 2>/dev/null
    vid_count=$((vid_count + count))
  fi
done

echo "Organization complete:"
echo " - $img_count image files moved to $IMG_DIR/"
echo " - $doc_count document files moved to $DOC_DIR/"
echo " - $vid_count video files moved to $VID_DIR/"
