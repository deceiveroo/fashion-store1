// app/api/test-simple/route.ts
import { NextResponse } from 'next/server';
import { debugRouteGuard } from '@/lib/debug-guard';

export async function DELETE() {
  const blocked = await debugRouteGuard();
  if (blocked) return blocked;
  return NextResponse.json({
    message: 'Тестовый DELETE работает!',
    success: true,
    timestamp: new Date().toISOString()
  });
}