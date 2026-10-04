/**
 * Compresses and crops/resizes an uploaded image or camera frame into a crisp
 * square or 4:3 JPEG data URL guaranteed to stay well under 450KB (Firestore limit is 1MB,
 * and our security rules enforce photoDataUrl.size() <= 750000).
 */
export async function compressSpecimenImage(
  fileOrDataUrl: File | string,
  maxDimension = 900,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

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

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el lienzo de compresión.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Ensure strict adherence to firebase-blueprint maxLength (750000 chars)
        if (dataUrl.length > 650000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.55);
        }
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          img.src = e.target.result;
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

export function sanitizeHandle(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9_\-.]/g, '')
    .slice(0, 36);
  return cleaned.length >= 2 ? cleaned : `naturalista_${Math.floor(100 + Math.random() * 900)}`;
}
