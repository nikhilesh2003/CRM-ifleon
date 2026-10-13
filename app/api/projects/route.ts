import { NextResponse } from 'next/server';
import { getDb, saveDb, logAudit } from '@/lib/store';
import { Project } from '@/lib/types';

export async function GET() {
  const db = getDb();
  return NextResponse.json({ projects: db.projects });
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = getDb();
  const currentUser = body.currentUser || db.users[0];

  if (currentUser.role === 'consultant') {
    return NextResponse.json(
      { error: 'Consultants cannot create or assign projects.' },
      { status: 403 }
    );
  }

  const newProject: Project = {
    id: `proj-${Date.now()}`,
    name: body.name,
    clientOrCampaign: body.clientOrCampaign || 'Campaign Outreach',
    description: body.description || '',
    assignedConsultantIds: Array.isArray(body.assignedConsultantIds) ? body.assignedConsultantIds : [],
    createdById: currentUser.id,
    status: body.status || 'active',
    createdAt: new Date().toISOString(),
  };

  db.projects.push(newProject);
  saveDb(db);

  logAudit(
    currentUser,
    'Created Project',
    'Project',
    newProject.id,
    newProject.name,
    `Campaign project created and assigned to ${newProject.assignedConsultantIds.length} consultant(s).`
  );

  return NextResponse.json({ success: true, project: newProject });
}
