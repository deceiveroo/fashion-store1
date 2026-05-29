import sharp from 'sharp';

export interface ProcessedImage {
  buffer: Buffer;
  contentType: string;
  ext: string;
}

// Большая сторона фото после обработки. next/image потом сам ужмёт под экран,
// но исходник 2000px даёт запас под зум и retina.
const MAX_DIM = 2000;
const WEBP_QUALITY = 90;

/**
 * Нормализует загружаемое фото товара:
 *  - авто-поворот по EXIF (фото с телефона больше не лягут боком);
 *  - ресайз до 2000px по большей стороне (маленькие НЕ растягиваем);
 *  - перекодирование в WebP q90 — резко и при этом легче оригинального JPEG/PNG.
 *
 * Анимированные GIF обрабатываем с сохранением кадров.
 * При любой ошибке sharp бросает исключение — вызывающий код должен
 * откатиться на исходный буфер, чтобы загрузка не падала из-за редкого формата.
 */
export async function processProductImage(
  input: Buffer | ArrayBuffer,
  mimeType: string
): Promise<ProcessedImage> {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const animated = mimeType === 'image/gif';

  const pipeline = sharp(buf, { failOn: 'none', animated });

  // rotate() без аргументов = авто-ориентация по EXIF.
  if (!animated) pipeline.rotate();

  const output = await pipeline
    .resize({
      width: MAX_DIM,
      height: MAX_DIM,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();

  return { buffer: output, contentType: 'image/webp', ext: '.webp' };
}
