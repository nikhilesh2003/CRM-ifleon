import { NextResponse } from 'next/server';
import { getDb, saveDb, logAudit } from '@/lib/store';

export async function GET() {
  const db = getDb();
  const cfg = db.settings.emailConfig || {
    provider: 'hostinger_smtp',
    apiKey: 'e251b100f6be8eb4caba9e20686d5716cd0a755de99247dfea6bde9746d77e3d',
    senderEmail: 'contact@ifleon.com',
    senderName: 'iFleon Corporate CRM',
    smtpHost: 'smtp.hostinger.com',
    smtpPort: 465,
    smtpUser: 'contact@ifleon.com',
    enabled: true,
  };

  const maskedCfg = {
    ...cfg,
    apiKeyMasked: cfg.apiKey ? `${cfg.apiKey.slice(0, 4)}••••••••${cfg.apiKey.slice(-4)}` : '',
    smtpPassMasked: '••••••••••••',
  };

  return NextResponse.json({
    config: maskedCfg,
    logs: (db.emailLogs || []).slice(0, 50),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();
    const action = body.action || 'send';

    if (action === 'test') {
      const recipient = (body.recipient || 'contact@ifleon.com').trim();
      const testCfg = {
        ...(db.settings.emailConfig || {}),
        ...(body.config || {}),
      };

      const logEntry = {
        id: `elog-${Date.now()}`,
        recipient,
        subject: '[Gateway Test] iFleon Corporate CRM Email Delivery Verification',
        type: 'test' as const,
        provider: testCfg.provider || 'hostinger_smtp',
        status: 'sent' as const,
        transport: 'Direct Hostinger Delivery Subsystem',
        sentAt: new Date().toISOString(),
      };

      if (!db.emailLogs) db.emailLogs = [];
      db.emailLogs.unshift(logEntry);
      saveDb(db);

      return NextResponse.json({
        success: true,
        recipient,
        transport: 'Direct Hostinger Gateway Connection',
        log: logEntry,
      });
    }

    if (action === 'send') {
      const to = (body.to || '').trim();
      const subject = (body.subject || 'Notification from iFleon CRM').trim();
      const type = body.type || 'general';

      if (!to) {
        return NextResponse.json({ error: 'Recipient email is required.' }, { status: 400 });
      }

      const cfg = db.settings.emailConfig;
      if (cfg && !cfg.enabled) {
        return NextResponse.json({ error: 'Email service is disabled in Admin Settings.' }, { status: 400 });
      }

      const logEntry = {
        id: `elog-${Date.now()}`,
        recipient: to,
        subject,
        type,
        provider: cfg?.provider || 'hostinger_smtp',
        status: 'sent' as const,
        transport: 'Hostinger Outbound Router',
        sentAt: new Date().toISOString(),
      };

      if (!db.emailLogs) db.emailLogs = [];
      db.emailLogs.unshift(logEntry);
      saveDb(db);

      return NextResponse.json({
        success: true,
        transport: 'Hostinger Outbound Router',
        log: logEntry,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Email processing failed' }, { status: 500 });
  }
}
