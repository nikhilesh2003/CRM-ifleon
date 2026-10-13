import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/store';
import { TaskItem } from '@/lib/types';

export async function GET(request: Request) {
  const db = getDb();
  const url = new URL(request.url);
  const consultantId = url.searchParams.get('consultantId');
  const leadId = url.searchParams.get('leadId');
  const dueToday = url.searchParams.get('dueToday') === 'true';

  let tasks = db.tasks;
  if (consultantId) {
    tasks = tasks.filter((t) => t.consultantId === consultantId);
  }
  if (leadId) {
    tasks = tasks.filter((t) => t.leadId === leadId);
  }
  if (dueToday) {
    const todayStr = new Date().toISOString().slice(0, 10);
    tasks = tasks.filter((t) => t.dueDate === todayStr && !t.completed);
  }

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = getDb();

  const user = body.currentUser || db.users[0];
  const lead = body.leadId ? db.leads.find((l) => l.id === body.leadId) : undefined;

  const newTask: TaskItem = {
    id: `task-${Date.now()}`,
    leadId: body.leadId,
    leadBusinessName: lead ? lead.businessName : body.leadBusinessName,
    consultantId: body.consultantId || user.id,
    title: body.title,
    dueDate: body.dueDate || new Date().toISOString().slice(0, 10),
    completed: false,
    priority: body.priority || 'medium',
    createdAt: new Date().toISOString(),
  };

  db.tasks.unshift(newTask);
  saveDb(db);

  return NextResponse.json({ success: true, task: newTask });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const db = getDb();

  const index = db.tasks.findIndex((t) => t.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  db.tasks[index].completed = body.completed ?? !db.tasks[index].completed;
  saveDb(db);

  return NextResponse.json({ success: true, task: db.tasks[index] });
}
