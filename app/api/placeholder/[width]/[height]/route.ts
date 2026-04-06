// app/api/placeholder/[width]/[height]/route.ts
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ width: string; height: string }> }
) {
  const awaitedParams = await params;
  const width = parseInt(awaitedParams.width) || 300;
  const height = parseInt(awaitedParams.height) || 300;
  
  // Создаем SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" dy=".3em" fill="#9ca3af">${width} x ${height}</text>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}