/**
 * Универсальная blur-заглушка для next/image (placeholder="blur").
 *
 * Мы не храним blurDataURL по каждому фото, поэтому используем нейтральный
 * серый: при загрузке фото плавно проявляется поверх него вместо резкого
 * «серого квадрата». Цвет уместен и в светлой, и в тёмной теме (маскируется
 * фоном рамки). Это крошечный SVG 8×10 — next/image сам растянет и размоет.
 *
 * Константа предвычислена (без Buffer), чтобы работать и в client-компонентах.
 */
export const BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjEwIj48cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2Q0ZDRkNCIvPjwvc3ZnPg==';
