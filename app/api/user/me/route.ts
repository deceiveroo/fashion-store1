import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server-auth';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      firstName: session.user.name?.split(' ')[0] || '',
      lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
      phone: '',
      image: session.user.image,
      role: session.user.role,
      orders: [], // Orders will be loaded separately
    });
  } catch (error) {
    console.error('[user/me] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
