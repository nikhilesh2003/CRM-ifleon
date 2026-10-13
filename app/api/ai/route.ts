import { NextResponse } from 'next/server';
import { getDb } from '@/lib/store';
import {
  generateAITheme,
  suggestFollowUpMessage,
  summarizeLeadBrief,
  tidyMeetingMinutes,
  checkDuplicateLeads,
  draftProposalWording,
} from '@/lib/ai-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    const db = getDb();

    if (action === 'generate-theme') {
      const prompt = body.prompt || 'clean and professional, deep blue, rounded cards';
      const theme = await generateAITheme(prompt);
      return NextResponse.json({ success: true, theme });
    }

    if (action === 'suggest-follow-up') {
      const lead = db.leads.find((l) => l.id === body.leadId);
      if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      const meetings = db.meetings.filter((m) => m.leadId === lead.id);
      const latestMeeting = meetings[0];
      const message = await suggestFollowUpMessage(lead, latestMeeting);
      return NextResponse.json({ success: true, message });
    }

    if (action === 'summarize-lead') {
      const lead = db.leads.find((l) => l.id === body.leadId);
      if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      const meetings = db.meetings.filter((m) => m.leadId === lead.id);
      const summary = await summarizeLeadBrief(lead, meetings);
      return NextResponse.json({ success: true, summary });
    }

    if (action === 'tidy-minutes') {
      const raw = body.minutes || '';
      const tidied = await tidyMeetingMinutes(raw);
      return NextResponse.json({ success: true, tidied });
    }

    if (action === 'check-duplicates') {
      const candidate = body.lead || {};
      const result = checkDuplicateLeads(candidate, db.leads);
      return NextResponse.json({ success: true, result });
    }

    if (action === 'draft-proposal') {
      const lead = db.leads.find((l) => l.id === body.leadId);
      if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      const meetings = db.meetings.filter((m) => m.leadId === lead.id);
      const selectedModules = body.selectedModules || [];
      const drafts = await draftProposalWording(lead, meetings, selectedModules);
      return NextResponse.json({ success: true, drafts });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('AI route error:', err);
    return NextResponse.json({ error: err.message || 'AI request failed' }, { status: 500 });
  }
}
