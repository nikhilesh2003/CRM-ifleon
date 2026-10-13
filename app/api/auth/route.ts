import { NextResponse } from 'next/server';
import { getDb, saveDb, logAudit } from '@/lib/store';
import { User, AuthSession } from '@/lib/types';

export async function GET(request: Request) {
  const db = getDb();
  const url = new URL(request.url);
  const requestedUserId = url.searchParams.get('userId');

  // Strip passwords from public list
  const sanitizedUsers = db.users.map((u) => {
    const { password, ...rest } = u;
    return rest;
  });

  if (requestedUserId) {
    const found = db.users.find((u) => u.id === requestedUserId);
    if (found) {
      const { password, ...safeUser } = found;
      return NextResponse.json({ user: safeUser, allUsers: sanitizedUsers });
    }
  }

  // Fallback to first user
  const defaultUser = db.users[0];
  const { password, ...safeDefault } = defaultUser;
  return NextResponse.json({ user: safeDefault, allUsers: sanitizedUsers });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();
    const action = body.action || (body.userId ? 'switch' : 'login');

    // 1. Action: LOGIN
    if (action === 'login') {
      const email = (body.email || '').trim().toLowerCase();
      const inputPassword = (body.password || '').trim();
      const rememberMe = Boolean(body.rememberMe);

      if (!email || !inputPassword) {
        return NextResponse.json(
          { error: 'Email and password are required.' },
          { status: 400 }
        );
      }

      const user = db.users.find((u) => u.email.toLowerCase() === email);
      if (!user) {
        return NextResponse.json(
          { error: 'No account found with this email address.' },
          { status: 401 }
        );
      }

      if (user.disabled) {
        return NextResponse.json(
          { error: 'This account has been disabled. Please contact your CRM Administrator.' },
          { status: 403 }
        );
      }

      // Check password (allow default matching or standard fallback)
      if (user.password && user.password !== inputPassword) {
        return NextResponse.json(
          { error: 'Incorrect password. Please try again.' },
          { status: 401 }
        );
      }

      const now = Date.now();
      // If remember me is checked: 30 days; otherwise 1 day
      const durationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const session: AuthSession = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        rememberMe,
        loginTime: now,
        expiresAt: now + durationMs,
      };

      const { password: _, ...safeUser } = user;
      return NextResponse.json({ success: true, user: safeUser, session });
    }

    // 2. Action: GOOGLE SSO SIGN-IN
    if (action === 'google') {
      const email = (body.email || 'rajesh.kumar@ifleon.com').trim().toLowerCase();
      const name = body.name || 'Enterprise Google User';
      const rememberMe = Boolean(body.rememberMe ?? true);

      let user = db.users.find((u) => u.email.toLowerCase() === email);
      if (!user) {
        // Create new consultant user linked to Google
        const newId = `user-g-${Date.now().toString(36)}`;
        user = {
          id: newId,
          name,
          email,
          role: 'consultant',
          phone: '+91 94900 00000',
          department: 'Corporate Outreach',
          disabled: false,
          googleLinked: true,
          tutorialCompleted: false,
          createdAt: new Date().toISOString(),
        };
        db.users.push(user);
        saveDb(db);
        logAudit(
          { id: user.id, name: user.name, role: user.role },
          'Google SSO Account Created',
          'User',
          user.id,
          user.name,
          `New user registered via Google SSO: ${email}`
        );
      }

      const now = Date.now();
      const durationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const session: AuthSession = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        rememberMe,
        loginTime: now,
        expiresAt: now + durationMs,
      };

      const { password: _, ...safeUser } = user;
      return NextResponse.json({ success: true, user: safeUser, session });
    }

    // 3. Action: REGISTER
    if (action === 'register') {
      const name = (body.name || '').trim();
      const email = (body.email || '').trim().toLowerCase();
      const phone = (body.phone || '').trim();
      const role = body.role || 'consultant';
      const department = (body.department || 'Dealership Sales').trim();
      const password = (body.password || '').trim();
      const rememberMe = Boolean(body.rememberMe);

      if (!name || !email || !password) {
        return NextResponse.json(
          { error: 'Name, email, and password are required.' },
          { status: 400 }
        );
      }

      if (db.users.some((u) => u.email.toLowerCase() === email)) {
        return NextResponse.json(
          { error: 'An account with this email address already exists.' },
          { status: 409 }
        );
      }

      const newId = `user-${Date.now().toString(36)}`;
      const newUser: User = {
        id: newId,
        name,
        email,
        phone: phone || '+91 98480 00000',
        role: role as any,
        department,
        password,
        disabled: false,
        tutorialCompleted: false,
        createdAt: new Date().toISOString(),
      };

      db.users.push(newUser);
      saveDb(db);

      logAudit(
        { id: newUser.id, name: newUser.name, role: newUser.role },
        'User Registered',
        'User',
        newUser.id,
        newUser.name,
        `New ${newUser.role} registered with department ${department}.`
      );

      const now = Date.now();
      const durationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const session: AuthSession = {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        rememberMe,
        loginTime: now,
        expiresAt: now + durationMs,
      };

      const { password: _, ...safeUser } = newUser;
      return NextResponse.json({ success: true, user: safeUser, session });
    }

    // 4. Action: TUTORIAL COMPLETE
    if (action === 'tutorial_complete') {
      const userId = body.userId;
      const user = db.users.find((u) => u.id === userId);
      if (user) {
        user.tutorialCompleted = true;
        saveDb(db);
        const { password: _, ...safeUser } = user;
        return NextResponse.json({ success: true, user: safeUser });
      }
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 5. Action: LOGOUT
    if (action === 'logout') {
      return NextResponse.json({ success: true });
    }

    // 6. Action: LEGACY SWITCH USER (for development/testing)
    if (action === 'switch' && body.userId) {
      const user = db.users.find((u) => u.id === body.userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const { password: _, ...safeUser } = user;
      return NextResponse.json({ success: true, user: safeUser });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
