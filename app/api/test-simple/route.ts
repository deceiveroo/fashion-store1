// app/api/test-simple/route.ts
import { NextResponse } from 'next/server';

export async function DELETE() {
  return NextResponse.json({
    message: 'Тестовый DELETE работает!',
    success: true,
    timestamp: new Date().toISOString()
  });
}