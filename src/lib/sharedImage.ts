const MAX_EDGE = 1280;
const MAX_BYTES = 180_000;

/** Creates a compact JPEG data URL that can travel with a JSON-backed Waypost. */
export const createSharedImage = async (file: File): Promise<string> => {
  const source = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(source.width, source.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();

  let quality = 0.82;
  let output = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not prepare photo.')), 'image/jpeg', quality));
  while (output.size > MAX_BYTES && quality > 0.4) {
    quality -= 0.1;
    output = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not prepare photo.')), 'image/jpeg', quality));
  }
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not prepare photo.'));
    reader.onerror = () => reject(new Error('Could not prepare photo.'));
    reader.readAsDataURL(output);
  });
};
