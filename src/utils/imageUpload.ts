type UploadedImagePayload = {
  dataBase64: string;
  width: number;
  height: number;
};

/**
 * Reads image file to base64 and returns dimensions.
 */
export const readImageFile = async (file: File): Promise<UploadedImagePayload> => {
  const dataBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = reader.result;
      if (typeof value !== "string") {
        reject(new Error("Gagal membaca file"));
        return;
      }
      resolve(value);
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });

  const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = () => reject(new Error("Gagal membaca dimensi gambar"));
    image.src = dataBase64;
  });

  return { dataBase64, width, height };
};

/**
 * Checks whether image ratio is within allowed ratio values.
 */
export const isImageRatioAllowed = (
  width: number,
  height: number,
  allowedRatios: readonly number[],
  tolerance: number,
) => {
  const ratio = width / height;
  return allowedRatios.some((allowedRatio) => Math.abs(ratio - allowedRatio) <= tolerance);
};
