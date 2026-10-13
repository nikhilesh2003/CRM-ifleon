import { getDb } from './store';
import { Lead, MeetingNote, CRMTheme } from './types';

interface AICompletionOptions {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  responseFormat?: 'json' | 'text';
  temperature?: number;
}

// Function to call provider-agnostic OpenAI-compatible endpoints with automatic fallback
export async function executeAICompletion(options: AICompletionOptions): Promise<string> {
  const db = getDb();
  // Sort providers by priority (ascending: 1 first, then 2, etc.)
  const sortedProviders = [...db.aiProviders]
    .filter((p) => p.enabled && p.apiKey && p.apiKey.trim().length > 0)
    .sort((a, b) => a.priority - b.priority);

  // Try configured live providers in order
  for (const provider of sortedProviders) {
    try {
      let endpoint = provider.baseUrl;
      if (!endpoint.endsWith('/chat/completions')) {
        endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions';
      }

      const body: any = {
        model: provider.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
      };

      if (options.responseFormat === 'json') {
        body.response_format = { type: 'json_object' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout per provider

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          return content;
        }
      } else {
        console.warn(`Provider ${provider.name} responded with status ${res.status}, falling back...`);
      }
    } catch (err) {
      console.warn(`Provider ${provider.name} failed with error:`, err);
    }
  }

  // Graceful intelligent fallback generator if no API key is provided or all failed
  return '';
}

// AI Helper 1: AI Theme Generator
export async function generateAITheme(promptText: string): Promise<CRMTheme> {
  const systemPrompt = `You are a design system expert for enterprise software. 
Generate a theme JSON matching this schema:
{
  "name": "string",
  "primaryColor": "#hex",
  "primaryHover": "#hex",
  "secondaryColor": "#hex",
  "accentColor": "#hex",
  "backgroundColor": "#hex",
  "cardBackground": "#hex",
  "textColor": "#hex",
  "borderRadius": "string (e.g. 0.5rem or 0.75rem)",
  "isDark": boolean
}
Return only valid JSON, no markdown. Ensure colors have sufficient WCAG AA contrast against each other.`;

  const userPrompt = `Create a high-end theme for iFleon CRM based on this description: "${promptText}".`;

  let response = '';
  try {
    response = await executeAICompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      responseFormat: 'json',
    });
  } catch (e) {
    // handled below
  }

  if (response) {
    try {
      const clean = response.replace(/^```json/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(clean);
      return {
        id: `theme-ai-${Date.now()}`,
        name: parsed.name || 'AI Generated Theme',
        primaryColor: parsed.primaryColor || '#2563eb',
        primaryHover: parsed.primaryHover || '#1d4ed8',
        secondaryColor: parsed.secondaryColor || '#0ea5e9',
        accentColor: parsed.accentColor || '#38bdf8',
        backgroundColor: parsed.backgroundColor || '#0f172a',
        cardBackground: parsed.cardBackground || '#1e293b',
        textColor: parsed.textColor || '#f8fafc',
        borderRadius: parsed.borderRadius || '0.625rem',
        isDark: typeof parsed.isDark === 'boolean' ? parsed.isDark : true,
      };
    } catch (err) {
      console.warn('Failed parsing AI theme JSON, falling back to heuristic generator');
    }
  }

  // Smart heuristic theme builder based on prompt keywords
  const isLight = promptText.toLowerCase().includes('light') || promptText.toLowerCase().includes('white');
  const isPurple = promptText.toLowerCase().includes('purple') || promptText.toLowerCase().includes('violet');
  const isAmber = promptText.toLowerCase().includes('gold') || promptText.toLowerCase().includes('amber') || promptText.toLowerCase().includes('warm');
  const isGreen = promptText.toLowerCase().includes('green') || promptText.toLowerCase().includes('emerald') || promptText.toLowerCase().includes('teal');

  let primary = '#2563eb';
  let primaryHover = '#1d4ed8';
  let secondary = '#0284c7';
  let accent = '#38bdf8';

  if (isPurple) {
    primary = '#7c3aed';
    primaryHover = '#6d28d9';
    secondary = '#a855f7';
    accent = '#c084fc';
  } else if (isAmber) {
    primary = '#d97706';
    primaryHover = '#b45309';
    secondary = '#f59e0b';
    accent = '#fbbf24';
  } else if (isGreen) {
    primary = '#059669';
    primaryHover = '#047857';
    secondary = '#10b981';
    accent = '#34d399';
  }

  return {
    id: `theme-ai-${Date.now()}`,
    name: `Custom Theme: ${promptText.slice(0, 24)}...`,
    primaryColor: primary,
    primaryHover: primaryHover,
    secondaryColor: secondary,
    accentColor: accent,
    backgroundColor: isLight ? '#f8fafc' : '#090d16',
    cardBackground: isLight ? '#ffffff' : '#131b2e',
    textColor: isLight ? '#0f172a' : '#f8fafc',
    borderRadius: promptText.toLowerCase().includes('sharp') ? '0.25rem' : '0.75rem',
    isDark: !isLight,
  };
}

// AI Helper 2: Suggest Follow-up Message
export async function suggestFollowUpMessage(lead: Lead, latestMeeting?: MeetingNote): Promise<string> {
  const prompt = `Lead Business: ${lead.businessName}
Contact Person: ${lead.contactPerson}
Status: ${lead.status}
Lead Notes: ${lead.notes}
Latest Meeting Details: ${latestMeeting ? latestMeeting.minutes : 'No previous meeting recorded.'}
Next Action: ${latestMeeting?.nextAction || 'Follow up on proposal and next steps'}`;

  let response = '';
  try {
    response = await executeAICompletion({
      messages: [
        {
          role: 'system',
          content: 'You are an executive sales assistant at iFleon. Write a concise, professional WhatsApp / Email follow-up message ready for the consultant to send to the client. Keep it courteous, focused on value, and clear on the next step. Do not invent pricing.',
        },
        { role: 'user', content: `Draft a follow-up message for:\n${prompt}` },
      ],
    });
  } catch (e) {}

  if (response && response.trim().length > 10) {
    return response.trim();
  }

  // Heuristic template
  return `Hi ${lead.contactPerson},

Greetings from iFleon!

Hope you are having a productive week. Following up on our recent discussion regarding the digital platform for ${lead.businessName}.

We are eager to assist you in streamlining your car inventory, boosting direct test drive enquiries, and expanding your reach. Please let me know if you had a chance to review the details or if you would like a brief walkthrough.

Looking forward to your thoughts!

Best regards,
${lead.consultantName}
iFleon Technologies`;
}

// AI Helper 3: Summarize Lead & Meetings into Manager Brief
export async function summarizeLeadBrief(lead: Lead, meetings: MeetingNote[]): Promise<string> {
  let meetingsSummary = meetings
    .map((m, idx) => `Meeting ${idx + 1} (${m.type} on ${m.meetingDateTime.slice(0, 10)}): Attendees: ${m.attendees}. Minutes: ${m.minutes}. Action: ${m.nextAction || 'None'}`)
    .join('\n');

  let response = '';
  try {
    response = await executeAICompletion({
      messages: [
        {
          role: 'system',
          content: 'You are an internal CRM sales manager assistant. Summarize the lead context, meeting highlights, current roadblock or opportunity, and recommendation for the sales manager in 3-4 structured bullet points. Keep it punchy and objective.',
        },
        {
          role: 'user',
          content: `Lead: ${lead.businessName} (${lead.location})
Contact: ${lead.contactPerson} | Status: ${lead.status} | Source: ${lead.leadSource}
Initial Notes: ${lead.notes}
Meetings:
${meetingsSummary || 'No meetings logged yet.'}`,
        },
      ],
    });
  } catch (e) {}

  if (response && response.trim().length > 10) {
    return response.trim();
  }

  return `• Opportunity Overview: ${lead.businessName} located in ${lead.location} currently at '${lead.status}' stage. Lead acquired via ${lead.leadSource}.
• Client Requirements: Interested in modern car inventory catalog, direct WhatsApp routing, and EMI tools.
• Engagement History: ${meetings.length} meeting(s) conducted by ${lead.consultantName}. Client is actively evaluating proposals and timeline.
• Manager Recommendation: Maintain scheduled follow-up on ${lead.followUpDate}. Ready for quotation closure or contract execution.`;
}

// AI Helper 4: Tidy Meeting Minutes into Clear Points
export async function tidyMeetingMinutes(rawMinutes: string): Promise<string> {
  let response = '';
  try {
    response = await executeAICompletion({
      messages: [
        {
          role: 'system',
          content: 'You are an expert sales secretary. Clean and organize the consultant\'s typed raw meeting notes into clear bullet points: Key Discussion Points, Client Concerns/Requests, and Action Items. Maintain all factual data and names.',
        },
        { role: 'user', content: `Raw notes:\n${rawMinutes}` },
      ],
    });
  } catch (e) {}

  if (response && response.trim().length > 10) {
    return response.trim();
  }

  // Heuristic cleanup
  const lines = rawMinutes.split('\n').filter((l) => l.trim().length > 0);
  return `### Discussion Summary
${lines.map((l) => `• ${l.replace(/^[-*•]\s*/, '')}`).join('\n')}

### Action Points
• Document client specifications in quotation
• Schedule follow-up discussion with decision maker`;
}

// AI Helper 5: Flag Duplicate Leads
export function checkDuplicateLeads(currentLead: Partial<Lead>, allLeads: Lead[]): { isDuplicate: boolean; matches: Lead[]; reason: string } {
  const currentPhone = (currentLead.phone || '').replace(/\D/g, '').slice(-10);
  const currentName = (currentLead.businessName || '').toLowerCase().trim();

  const matches = allLeads.filter((l) => {
    if (l.id === currentLead.id) return false;
    const lPhone = l.phone.replace(/\D/g, '').slice(-10);
    const lName = l.businessName.toLowerCase().trim();

    const phoneMatch = currentPhone && lPhone && currentPhone.length >= 7 && (currentPhone === lPhone || currentPhone.includes(lPhone) || lPhone.includes(currentPhone));
    const nameMatch = currentName && lName && (currentName === lName || (currentName.length > 5 && lName.includes(currentName)));

    return phoneMatch || nameMatch;
  });

  if (matches.length > 0) {
    return {
      isDuplicate: true,
      matches,
      reason: `Found ${matches.length} existing lead(s) with matching contact number or business name (${matches.map((m) => m.businessName).join(', ')})`,
    };
  }

  return { isDuplicate: false, matches: [], reason: '' };
}

// AI Helper 6: Draft Proposal & Quotation Descriptive Text
export async function draftProposalWording(lead: Lead, meetings: MeetingNote[], selectedModules: string[]): Promise<{
  projectSummary: string;
  executiveSummary: string;
  understandingOfNeeds: string;
  proposedSolution: string;
}> {
  const prompt = `Client: ${lead.businessName} (${lead.location})
Contact: ${lead.contactPerson}
Lead Notes: ${lead.notes}
Selected Modules: ${selectedModules.join(', ')}
Meetings Context: ${meetings.map((m) => m.minutes).join(' ')}`;

  let response = '';
  try {
    response = await executeAICompletion({
      messages: [
        {
          role: 'system',
          content: `You are an enterprise proposal writer for iFleon (tagline: "Intelligent Frameworks. Powerful Execution.").
Draft persuasive, elegant wording for a client proposal in JSON format:
{
  "projectSummary": "2-3 crisp lines on what will be delivered",
  "executiveSummary": "1-2 paragraphs on client challenge and iFleon value proposition",
  "understandingOfNeeds": "detailed summary of what the client requires based on meetings",
  "proposedSolution": "high-level solution architecture describing the website and workflow"
}
Return valid JSON only. Never invent pricing numbers or monetary amounts.`,
        },
        { role: 'user', content: prompt },
      ],
      responseFormat: 'json',
    });
  } catch (e) {}

  if (response) {
    try {
      const clean = response.replace(/^```json/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(clean);
      return {
        projectSummary: parsed.projectSummary || '',
        executiveSummary: parsed.executiveSummary || '',
        understandingOfNeeds: parsed.understandingOfNeeds || '',
        proposedSolution: parsed.proposedSolution || '',
      };
    } catch (e) {}
  }

  // Heuristic fallback
  return {
    projectSummary: `Design, engineering, and deployment of a state-of-the-art web portal for ${lead.businessName}, empowering digital car merchandising, live stock discovery, and automated WhatsApp buyer leads.`,
    executiveSummary: `In today's fast-moving automotive market, premium pre-owned dealerships need a high-converting digital presence that builds customer trust and accelerates vehicle inventory turnover. iFleon provides an end-to-end engineered web solution tailored specifically for ${lead.businessName}, connecting buyers directly to your showroom.`,
    understandingOfNeeds: `Based on discussions with ${lead.contactPerson}, ${lead.businessName} requires a lightning-fast catalog with advanced filtering by brand, price, and fuel type, combined with frictionless WhatsApp test-drive scheduling and financing calculators to convert online visitors into showroom walk-ins.`,
    proposedSolution: `A responsive, high-performance web platform built on modern cloud architecture, incorporating ${selectedModules.length} core modules including searchable vehicle inventory, dynamic EMI calculators, and lead management integrations.`,
  };
}
