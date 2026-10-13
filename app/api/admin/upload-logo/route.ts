import { NextResponse } from 'next/server';
import { getDb, saveDb, logAudit } from '@/lib/store';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileData, fileName = 'logo.png', slot = 'logo', currentUser } = body;

    if (!fileData) {
      return NextResponse.json({ error: 'No image data provided.' }, { status: 400 });
    }

    let ext = 'png';
    let base64Content = fileData;

    const matches = fileData.match(/^data:image\/([a-zA-Z0-9-+.]+);base64,(.+)$/);
    if (matches) {
      ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      base64Content = matches[2];
    }

    const buffer = Buffer.from(base64Content, 'base64');
    const safeSlot = slot.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeFileName = `logo-${safeSlot}-${Date.now()}.${ext}`;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, safeFileName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeFileName}`;
    const db = getDb();

    if (slot === 'light') {
      db.settings.lightLogoUrl = publicUrl;
      db.settings.horizontalLogoUrl = publicUrl;
    } else if (slot === 'dark') {
      db.settings.darkLogoUrl = publicUrl;
    } else if (slot === 'icon') {
      db.settings.iconLogoUrl = publicUrl;
    }

    saveDb(db);

    if (currentUser) {
      logAudit(
        currentUser,
        'Updated Brand Logo',
        'Settings',
        'settings-logo',
        'Brand Assets',
        `Admin uploaded new ${slot} logo: ${publicUrl}`
      );
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      settings: db.settings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to upload logo' }, { status: 500 });
  }
}
