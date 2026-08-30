const MAX_AVATAR_BYTES = 100 * 1024;
const MAX_DIMENSION = 720;

interface ImageSize {
  width: number;
  height: number;
}

function calculateSize(
  width: number,
  height: number,
  maxDimension: number,
): ImageSize {
  const longestSide = Math.max(width, height);

  if (longestSide <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / longestSide;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("头像压缩失败"));
          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });
}

async function loadImage(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(file);

    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();

    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("无法读取图片"));
    element.src = objectUrl;
  });

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(objectUrl),
  };
}

export async function compressAvatar(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("请选择图片文件");
  }

  const image = await loadImage(file);

  try {
    let size = calculateSize(image.width, image.height, MAX_DIMENSION);
    let quality = 0.8;
    let result = new Blob();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("当前浏览器不支持图片处理");
      }

      context.clearRect(0, 0, size.width, size.height);
      context.drawImage(
        image.source,
        0,
        0,
        image.width,
        image.height,
        0,
        0,
        size.width,
        size.height,
      );

      result = await canvasToBlob(canvas, "image/jpeg", quality);

      if (result.size <= MAX_AVATAR_BYTES) {
        return result;
      }

      if (quality > 0.6) {
        quality -= 0.1;
      } else {
        size = calculateSize(
          size.width,
          size.height,
          Math.max(512, Math.round(Math.max(size.width, size.height) * 0.75)),
        );
      }
    }

    return result;
  } finally {
    image.cleanup();
  }
}
