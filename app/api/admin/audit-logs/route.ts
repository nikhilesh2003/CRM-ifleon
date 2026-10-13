import { NextResponse } from 'next/server';
import { getDb } from '@/lib/store';

export async function GET(request: Request) {
  const db = getDb();
  const url = new URL(request.url);
  const entityType = url.searchParams.get('entityType');
  const userId = url.searchParams.get('userId');

  let logs = db.auditLogs;
  if (entityType) {
    logs = logs.filter((l) => l.entityType === entityType);
  }
  if (userId) {
    logs = logs.filter((l) => l.userId === userId);
  }

  return NextResponse.json({ auditLogs: logs });
}
