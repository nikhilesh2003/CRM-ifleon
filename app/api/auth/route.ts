import { NextResponse } from 'next/server';
import { getDb } from '@/lib/store';

// Default active session in cookies or header, or fallback to first admin
let activeUserId = 'user-admin';

export async function GET(request: Request) {
  const db = getDb();
  const url = new URL(request.url);
  const requestedUserId = url.searchParams.get('userId');

  if (requestedUserId) {
    const found = db.users.find((u) => u.id === requestedUserId);
    if (found) {
      activeUserId = requestedUserId;
      return NextResponse.json({ user: found, allUsers: db.users });
    }
  }

  const currentUser = db.users.find((u) => u.id === activeUserId) || db.users[0];
  return NextResponse.json({ user: currentUser, allUsers: db.users });
}

export async function POST(request: Request) {
  const { userId } = await request.json();
  const db = getDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  activeUserId = userId;
  return NextResponse.json({ success: true, user });
}
