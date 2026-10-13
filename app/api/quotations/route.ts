import { NextResponse } from 'next/server';
import { getDb, saveDb, logAudit } from '@/lib/store';
import { GeneratedDocument } from '@/lib/types';

export async function GET(request: Request) {
  const db = getDb();
  const url = new URL(request.url);
  const leadId = url.searchParams.get('leadId');
  const type = url.searchParams.get('type');
  const status = url.searchParams.get('status');

  let docs = db.documents;
  if (leadId) docs = docs.filter((d) => d.leadId === leadId);
  if (type) docs = docs.filter((d) => d.type === type);
  if (status) docs = docs.filter((d) => d.status === status);

  return NextResponse.json({ documents: docs, approvalThreshold: db.settings.quotationApprovalThreshold });
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = getDb();
  const currentUser = body.currentUser || db.users[0];

  const type = body.type || 'quotation';
  const year = new Date().getFullYear();
  const prefix = type === 'quotation' ? 'IFL-Q' : 'IFL-P';
  const seq = String(db.documents.length + 1).padStart(4, '0');
  const docNumber = `${prefix}-${year}-${seq}`;

  const threshold = db.settings.quotationApprovalThreshold || 0;
  const requiresApproval = threshold > 0 && Number(body.total) >= threshold;

  const newDoc: GeneratedDocument = {
    id: `doc-${Date.now()}`,
    type,
    docNumber,
    leadId: body.leadId,
    businessName: body.businessName,
    contactPerson: body.contactPerson,
    phone: body.phone,
    location: body.location,
    consultantId: body.consultantId || currentUser.id,
    consultantName: body.consultantName || currentUser.name,
    version: 1,
    date: body.date || new Date().toISOString().slice(0, 10),
    validUntilDate: body.validUntilDate || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    projectSummary: body.projectSummary || '',
    selectedModules: Array.isArray(body.selectedModules) ? body.selectedModules : [],
    lineItems: Array.isArray(body.lineItems) ? body.lineItems : [],
    subtotal: Number(body.subtotal) || 0,
    discount: Number(body.discount) || 0,
    total: Number(body.total) || 0,
    paymentTerms: body.paymentTerms || '50% advance on sign-off, 30% on staging delivery, 20% on final launch.',
    timeline: body.timeline || '3-4 weeks delivery from design approval.',
    termsAndConditions: body.termsAndConditions || 'Validity: 15 days. Includes 2 design revisions and 30 days warranty.',
    executiveSummary: body.executiveSummary || '',
    understandingOfNeeds: body.understandingOfNeeds || '',
    proposedSolution: body.proposedSolution || '',
    assumptionsAndExclusions: body.assumptionsAndExclusions || 'Client provides car vehicle inventory images and dealer credentials.',
    supportAndMaintenance: body.supportAndMaintenance || '30 days hypercare included. Annual maintenance contracts available.',
    status: requiresApproval ? 'Needs Approval' : (body.status || 'Draft'),
    requiresManagerApproval: requiresApproval,
    createdAt: new Date().toISOString(),
  };

  db.documents.unshift(newDoc);
  saveDb(db);

  logAudit(
    currentUser,
    `Created ${type === 'quotation' ? 'Quotation' : 'Proposal'}`,
    'Quotation',
    newDoc.id,
    `${docNumber} (${newDoc.businessName})`,
    `Generated document with total ₹${newDoc.total.toLocaleString()}. Status: ${newDoc.status}.`
  );

  return NextResponse.json({ success: true, document: newDoc });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const db = getDb();
  const currentUser = body.currentUser || db.users[0];

  const index = db.documents.findIndex((d) => d.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const existing = db.documents[index];

  // If changing status to 'Sent', verify manager approval if required
  if (body.status === 'Sent' && existing.requiresManagerApproval && !existing.approvedBy) {
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return NextResponse.json(
        { error: `This quotation total exceeds ₹${db.settings.quotationApprovalThreshold.toLocaleString()} and requires Manager approval before being marked Sent.` },
        { status: 403 }
      );
    }
  }

  // Manager approving document
  if (body.action === 'approve') {
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return NextResponse.json({ error: 'Only Managers and Admins can approve documents.' }, { status: 403 });
    }
    existing.approvedBy = `${currentUser.name} (${currentUser.role})`;
    existing.status = 'Draft'; // Now ready to be sent!
  } else if (body.status) {
    existing.status = body.status;
  }

  // If document was rejected, update lead lost reason if applicable
  if (body.status === 'Rejected' && body.lostReason) {
    const lead = db.leads.find((l) => l.id === existing.leadId);
    if (lead) {
      lead.status = 'Lost';
      lead.lostReason = body.lostReason;
      lead.managerReview = 'Pending';
      lead.updatedAt = new Date().toISOString();
      lead.updatedBy = `${currentUser.name} (${currentUser.role})`;
    }
  }

  saveDb(db);

  logAudit(
    currentUser,
    `Updated Document Status`,
    'Quotation',
    existing.id,
    existing.docNumber,
    `Document updated to status: ${existing.status}.`
  );

  return NextResponse.json({ success: true, document: existing });
}
