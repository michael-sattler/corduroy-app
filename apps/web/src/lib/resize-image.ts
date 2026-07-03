export const AVATAR_MAX_HEIGHT = 512;

export async function resizeImageToMaxHeight(
  file: File,
  maxHeight: number = AVATAR_MAX_HEIGHT,
): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const targetHeight =
    bitmap.height > maxHeight ? maxHeight : bitmap.height;
  const targetWidth = Math.round((bitmap.width * targetHeight) / bitmap.height);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Could not process image.");
  }

  context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Could not process image."));
        }
      },
      "image/jpeg",
      0.9,
    );
  });

  const baseName = file.name.replace(/\.[^.]+$/, "") || "avatar";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
