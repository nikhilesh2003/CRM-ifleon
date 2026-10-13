import { NextResponse } from 'next/server';
import { getDb, saveDb, logAudit } from '@/lib/store';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const lead = db.leads.find((l) => l.id === params.id);
  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const meetings = db.meetings.filter((m) => m.leadId === lead.id);
  const tasks = db.tasks.filter((t) => t.leadId === lead.id);
  const documents = db.documents.filter((d) => d.leadId === lead.id);

  return NextResponse.json({
    lead: {
      ...lead,
      meetings,
      tasks,
      documents,
    },
  });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const db = getDb();
  const index = db.leads.findIndex((l) => l.id === params.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const existing = db.leads[index];
  const currentUser = body.currentUser || db.users[0];

  // Consultant edit permission check
  if (currentUser.role === 'consultant' && existing.consultantId !== currentUser.id) {
    return NextResponse.json(
      { error: 'Consultants can only edit their own assigned leads.' },
      { status: 403 }
    );
  }

  // Validate Won status constraints
  if (body.status === 'Won') {
    if (!body.finalDealAmount && !existing.finalDealAmount) {
      return NextResponse.json(
        { error: 'Final deal amount is required when status is Won.' },
        { status: 400 }
      );
    }
    if (!body.startDate && !existing.startDate) {
      return NextResponse.json(
        { error: 'Start date is required when status is Won.' },
        { status: 400 }
      );
    }
  }

  // Validate Lost status constraints
  if (body.status === 'Lost') {
    if (!body.lostReason && !existing.lostReason) {
      return NextResponse.json(
        { error: 'Lost reason is required when status is Lost.' },
        { status: 400 }
      );
    }
  }

  // Check if status changed to Won or Lost -> resets managerReview to Pending if not approved by manager
  let managerReview = body.managerReview ?? existing.managerReview;
  if (
    (body.status === 'Won' || body.status === 'Lost') &&
    existing.status !== body.status &&
    currentUser.role === 'consultant'
  ) {
    managerReview = 'Pending';
  }

  // Consultant reassignment check
  let consultantName = existing.consultantName;
  if (body.consultantId && body.consultantId !== existing.consultantId) {
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return NextResponse.json(
        { error: 'Only Managers and Admins can reassign leads.' },
        { status: 403 }
      );
    }
    const targetConsultant = db.users.find((u) => u.id === body.consultantId);
    if (targetConsultant) {
      consultantName = targetConsultant.name;
      logAudit(
        currentUser,
        'Reassigned Lead',
        'Lead',
        existing.id,
        existing.businessName,
        `Reassigned from ${existing.consultantName} to ${targetConsultant.name}.`
      );
    }
  }

  // Track status changes in audit log
  if (body.status && body.status !== existing.status) {
    logAudit(
      currentUser,
      'Changed Lead Status',
      'Lead',
      existing.id,
      existing.businessName,
      `Status changed from '${existing.status}' to '${body.status}'.`
    );
  }

  // Track manager reviews
  if (body.managerReview && body.managerReview !== existing.managerReview) {
    logAudit(
      currentUser,
      `Manager Review: ${body.managerReview}`,
      'Lead',
      existing.id,
      existing.businessName,
      `Manager feedback: ${body.managerComment || 'No comments'}`
    );
  }

  const updatedLead = {
    ...existing,
    ...body,
    consultantName,
    managerReview,
    updatedAt: new Date().toISOString(),
    updatedBy: `${currentUser.name} (${currentUser.role})`,
  };

  db.leads[index] = updatedLead;
  saveDb(db);

  return NextResponse.json({ success: true, lead: updatedLead });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const index = db.leads.findIndex((l) => l.id === params.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const lead = db.leads[index];
  db.leads.splice(index, 1);
  saveDb(db);

  return NextResponse.json({ success: true });
}
