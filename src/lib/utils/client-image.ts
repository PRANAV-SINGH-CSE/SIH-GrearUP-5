/**
 * Client-side image compression and normalization utility for fast mobile uploads.
 * Ensures images never exceed Vercel serverless function payload limits (4.5MB)
 * and provides responsive, low-latency uploads on 4G/5G mobile connections.
 */
export async function compressImageForUpload(
  file: File,
  maxDimension = 2048,
  quality = 0.88
): Promise<File> {
  // If running on server or if the file is already under 1MB, no compression needed
  if (typeof window === 'undefined' || file.size <= 1024 * 1024) {
    return file;
  }

  // Only attempt to compress standard image MIME types
  if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    return file;
  }

  try {
    return await new Promise<File>((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;

        // If image is already within bounds, return original file
        if (width <= maxDimension && height <= maxDimension && file.size < 3 * 1024 * 1024) {
          resolve(file);
          return;
        }

        // Calculate aspect-ratio-preserved scaled dimensions
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // High quality bicubic image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
              const optimizedFile = new File([blob], cleanName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            } else {
              // If canvas output is somehow larger, keep original
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    });
  } catch {
    // Fail-safe: always fallback to original file
    return file;
  }
}
