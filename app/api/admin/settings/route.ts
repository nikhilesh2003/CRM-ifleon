import { NextResponse } from 'next/server';
import { getDb, saveDb, logAudit } from '@/lib/store';

export async function GET() {
  const db = getDb();
  // Strip actual secret keys when sending to client if needed, or mask them
  const safeProviders = db.aiProviders.map((p) => ({
    ...p,
    apiKey: p.apiKey ? `${p.apiKey.slice(0, 4)}••••••••${p.apiKey.slice(-4)}` : '',
    hasKey: Boolean(p.apiKey && p.apiKey.length > 0),
  }));

  return NextResponse.json({
    settings: db.settings,
    themes: db.themes,
    activeThemeId: db.activeThemeId,
    aiProviders: safeProviders,
    scopeModules: db.scopeModules,
    priceList: db.priceList,
    users: db.users,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = getDb();
  const currentUser = body.currentUser || db.users[0];

  if (currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Only Admins can update system settings.' }, { status: 403 });
  }

  if (body.settings) {
    db.settings = { ...db.settings, ...body.settings };
  }

  if (body.activeThemeId) {
    db.activeThemeId = body.activeThemeId;
  }

  if (body.newTheme) {
    db.themes.push(body.newTheme);
    db.activeThemeId = body.newTheme.id;
  }

  if (body.aiProviders && Array.isArray(body.aiProviders)) {
    // Preserve existing real keys if masked string was sent back
    body.aiProviders.forEach((incoming: any) => {
      const existing = db.aiProviders.find((p) => p.id === incoming.id);
      if (existing) {
        existing.name = incoming.name || existing.name;
        existing.baseUrl = incoming.baseUrl || existing.baseUrl;
        existing.model = incoming.model || existing.model;
        existing.priority = Number(incoming.priority) || existing.priority;
        existing.enabled = typeof incoming.enabled === 'boolean' ? incoming.enabled : existing.enabled;
        if (incoming.apiKey && !incoming.apiKey.includes('••••')) {
          existing.apiKey = incoming.apiKey;
        }
      } else if (incoming.id) {
        db.aiProviders.push(incoming);
      }
    });
  }

  saveDb(db);

  logAudit(
    currentUser,
    'Updated System Settings',
    'Settings',
    'settings-core',
    'Company & AI Configuration',
    'Admin updated company profile, theme, or AI provider priorities.'
  );

  return NextResponse.json({ success: true, settings: db.settings, activeThemeId: db.activeThemeId });
}
