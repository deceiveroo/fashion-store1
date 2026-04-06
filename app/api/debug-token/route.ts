import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  const cookies = req.cookies.getAll().map(c => c.name);
  
  return NextResponse.json({
    token: token ? { id: token.sub, role: token.role, email: token.email } : null,
    cookies,
    nextauth_secret_set: !!process.env.NEXTAUTH_SECRET,
    nextauth_url: process.env.NEXTAUTH_URL,
  });
}
