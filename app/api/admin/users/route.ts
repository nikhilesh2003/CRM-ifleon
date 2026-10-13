import { NextResponse } from 'next/server';
import { getDb, saveDb, logAudit } from '@/lib/store';
import { User } from '@/lib/types';

export async function GET() {
  const db = getDb();
  return NextResponse.json({ users: db.users });
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = getDb();
  const currentUser = body.currentUser || db.users[0];

  if (currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Only Admins can create or invite users.' }, { status: 403 });
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name: body.name,
    email: body.email,
    role: body.role || 'consultant',
    phone: body.phone || '',
    avatar: body.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(body.name)}`,
    disabled: false,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDb(db);

  logAudit(
    currentUser,
    'Created User',
    'User',
    newUser.id,
    newUser.name,
    `New user created with role '${newUser.role}' and email ${newUser.email}.`
  );

  return NextResponse.json({ success: true, user: newUser });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const db = getDb();
  const currentUser = body.currentUser || db.users[0];

  if (currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Only Admins can modify user accounts.' }, { status: 403 });
  }

  const index = db.users.findIndex((u) => u.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const user = db.users[index];

  if (typeof body.disabled === 'boolean') {
    user.disabled = body.disabled;
    logAudit(
      currentUser,
      user.disabled ? 'Disabled User' : 'Enabled User',
      'User',
      user.id,
      user.name,
      `User status toggled to ${user.disabled ? 'Disabled' : 'Active'}.`
    );
  }

  if (body.role) {
    const oldRole = user.role;
    user.role = body.role;
    logAudit(
      currentUser,
      'Changed User Role',
      'User',
      user.id,
      user.name,
      `Role changed from '${oldRole}' to '${body.role}'.`
    );
  }

  if (body.action === 'reset_password') {
    logAudit(
      currentUser,
      'Password Reset Sent',
      'User',
      user.id,
      user.name,
      `Password reset instructions dispatched to ${user.email}.`
    );
  }

  saveDb(db);

  return NextResponse.json({ success: true, user });
}
