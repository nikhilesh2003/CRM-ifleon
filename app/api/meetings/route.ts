import { NextResponse } from 'next/server';
import { getDb, saveDb, logAudit } from '@/lib/store';
import { MeetingNote } from '@/lib/types';

export async function GET(request: Request) {
  const db = getDb();
  const url = new URL(request.url);
  const leadId = url.searchParams.get('leadId');

  let meetings = db.meetings;
  if (leadId) {
    meetings = meetings.filter((m) => m.leadId === leadId);
  }

  // Sort newest first
  meetings = [...meetings].sort(
    (a, b) => new Date(b.meetingDateTime).getTime() - new Date(a.meetingDateTime).getTime()
  );

  return NextResponse.json({ meetings });
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = getDb();

  const user = body.currentUser || db.users[0];
  const lead = db.leads.find((l) => l.id === body.leadId);

  const newMeeting: MeetingNote = {
    id: `meet-${Date.now()}`,
    leadId: body.leadId,
    meetingDateTime: body.meetingDateTime || new Date().toISOString(),
    type: body.type || 'Call',
    attendees: body.attendees || 'Client Contact',
    minutes: body.minutes || '',
    nextAction: body.nextAction || '',
    addedById: user.id,
    addedByName: user.name,
    createdAt: new Date().toISOString(),
    editHistory: [{ editedAt: new Date().toISOString(), editedBy: user.name }],
  };

  db.meetings.unshift(newMeeting);

  // If nextAction sets follow-up date, update lead follow-up date directly!
  if (body.updateFollowUpDate && body.newFollowUpDate && lead) {
    lead.followUpDate = body.newFollowUpDate;
    lead.updatedAt = new Date().toISOString();
    lead.updatedBy = `${user.name} (${user.role})`;
  }

  saveDb(db);

  if (lead) {
    logAudit(
      user,
      'Logged Meeting Note',
      'Meeting',
      newMeeting.id,
      lead.businessName,
      `${newMeeting.type} meeting logged with attendees: ${newMeeting.attendees}.`
    );
  }

  return NextResponse.json({ success: true, meeting: newMeeting });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const db = getDb();
  const user = body.currentUser || db.users[0];

  const index = db.meetings.findIndex((m) => m.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  const existing = db.meetings[index];
  const editHistory = existing.editHistory || [];
  editHistory.push({ editedAt: new Date().toISOString(), editedBy: user.name });

  const updated: MeetingNote = {
    ...existing,
    meetingDateTime: body.meetingDateTime || existing.meetingDateTime,
    type: body.type || existing.type,
    attendees: body.attendees || existing.attendees,
    minutes: body.minutes || existing.minutes,
    nextAction: body.nextAction || existing.nextAction,
    editHistory,
  };

  db.meetings[index] = updated;
  saveDb(db);

  return NextResponse.json({ success: true, meeting: updated });
}
