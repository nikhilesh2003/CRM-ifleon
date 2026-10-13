import { NextResponse } from 'next/server';
import { getDb, saveDb, logAudit } from '@/lib/store';
import { Lead } from '@/lib/types';

export async function GET(request: Request) {
  const db = getDb();
  const url = new URL(request.url);
  const search = url.searchParams.get('search')?.toLowerCase() || '';
  const status = url.searchParams.get('status') || '';
  const consultantId = url.searchParams.get('consultantId') || '';
  const tag = url.searchParams.get('tag') || '';
  const reviewStatus = url.searchParams.get('reviewStatus') || '';

  let leads = db.leads.map((lead) => {
    const leadMeetings = db.meetings.filter((m) => m.leadId === lead.id);
    const leadTasks = db.tasks.filter((t) => t.leadId === lead.id);
    return {
      ...lead,
      meetings: leadMeetings,
      tasks: leadTasks,
    };
  });

  if (search) {
    leads = leads.filter(
      (l) =>
        l.businessName.toLowerCase().includes(search) ||
        l.contactPerson.toLowerCase().includes(search) ||
        l.phone.toLowerCase().includes(search) ||
        l.location.toLowerCase().includes(search)
    );
  }

  if (status) {
    leads = leads.filter((l) => l.status === status);
  }

  if (consultantId) {
    leads = leads.filter((l) => l.consultantId === consultantId);
  }

  if (tag) {
    leads = leads.filter((l) => l.tags && l.tags.includes(tag));
  }

  if (reviewStatus) {
    leads = leads.filter((l) => l.managerReview === reviewStatus);
  }

  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = getDb();

  const user = db.users.find((u) => u.id === body.consultantId) || db.users[0];
  const project = db.projects.find((p) => p.id === body.projectId) || db.projects[0];

  const newLead: Lead = {
    id: `lead-${Date.now()}`,
    projectId: body.projectId || project.id,
    projectName: project.name,
    contactPerson: body.contactPerson,
    phone: body.phone,
    businessName: body.businessName,
    location: body.location || '',
    status: body.status || 'New / Contacted',
    followUpDate: body.followUpDate || new Date().toISOString().slice(0, 10),
    leadSource: body.leadSource || 'Inbound Web',
    notes: body.notes || '',
    consultantId: body.consultantId || user.id,
    consultantName: body.consultantName || user.name,
    managerReview: (body.status === 'Won' || body.status === 'Lost') ? 'Pending' : 'Pending',
    managerComment: '',
    finalDealAmount: body.finalDealAmount ? Number(body.finalDealAmount) : null,
    expectedCloseDate: body.expectedCloseDate || '',
    startDate: body.startDate || '',
    lostReason: body.lostReason || '',
    tags: Array.isArray(body.tags) ? body.tags : [],
    attachments: body.attachments || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: `${user.name} (${user.role})`,
  };

  db.leads.unshift(newLead);
  saveDb(db);

  logAudit(
    user,
    'Created Lead',
    'Lead',
    newLead.id,
    newLead.businessName,
    `New lead added in ${newLead.location} with status ${newLead.status}.`
  );

  return NextResponse.json({ success: true, lead: newLead });
}
