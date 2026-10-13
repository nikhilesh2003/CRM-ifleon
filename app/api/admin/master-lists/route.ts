import { NextResponse } from 'next/server';
import { getDb, saveDb, logAudit } from '@/lib/store';

export async function GET() {
  const db = getDb();
  return NextResponse.json({
    scopeModules: db.scopeModules,
    priceList: db.priceList,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = getDb();
  const currentUser = body.currentUser || db.users[0];

  if (currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Only Admins can modify master lists.' }, { status: 403 });
  }

  if (body.type === 'scopeModule') {
    if (body.action === 'delete') {
      db.scopeModules = db.scopeModules.filter((m) => m.id !== body.id);
    } else if (body.item) {
      const existingIdx = db.scopeModules.findIndex((m) => m.id === body.item.id);
      if (existingIdx >= 0) {
        db.scopeModules[existingIdx] = body.item;
      } else {
        db.scopeModules.push({ ...body.item, id: `mod-${Date.now()}` });
      }
    }
  }

  if (body.type === 'priceListItem') {
    if (body.action === 'delete') {
      db.priceList = db.priceList.filter((p) => p.id !== body.id);
    } else if (body.item) {
      const existingIdx = db.priceList.findIndex((p) => p.id === body.item.id);
      if (existingIdx >= 0) {
        db.priceList[existingIdx] = body.item;
      } else {
        db.priceList.push({ ...body.item, id: `pl-${Date.now()}` });
      }
    }
  }

  saveDb(db);

  logAudit(
    currentUser,
    'Updated Master List',
    'Settings',
    body.type,
    body.type,
    `Admin updated ${body.type} items.`
  );

  return NextResponse.json({
    success: true,
    scopeModules: db.scopeModules,
    priceList: db.priceList,
  });
}
