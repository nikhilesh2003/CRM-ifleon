import { GeneratedDocument, Lead, CompanySettings } from './types';
import * as XLSX from 'xlsx';

// Generates an Excel workbook for leads and returns a blob/buffer
export function exportLeadsToExcel(leads: Lead[], filename = 'iFleon_CRM_Leads.xlsx') {
  const exportData = leads.map((lead) => ({
    'Lead ID': lead.id,
    'Business Name': lead.businessName,
    'Contact Person': lead.contactPerson,
    'Phone Number': lead.phone,
    'Location': lead.location,
    'Status': lead.status,
    'Lead Source': lead.leadSource,
    'Follow-up Date': lead.followUpDate,
    'Consultant': lead.consultantName,
    'Manager Review': lead.managerReview,
    'Manager Feedback': lead.managerComment || '',
    'Final Deal Amount': lead.finalDealAmount || '',
    'Expected Close Date': lead.expectedCloseDate || '',
    'Start Date': lead.startDate || '',
    'Lost Reason': lead.lostReason || '',
    'Tags': lead.tags?.join(', ') || '',
    'Notes': lead.notes,
    'Created At': lead.createdAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

  // Generate file download in browser
  if (typeof window !== 'undefined') {
    XLSX.writeFile(workbook, filename);
  }
  return workbook;
}

// Parses an uploaded Excel or CSV file into lead records
export async function parseLeadsFromExcel(file: File): Promise<Partial<Lead>[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const json: any[] = XLSX.utils.sheet_to_json(worksheet);

  return json.map((row) => ({
    businessName: row['Business Name'] || row['businessName'] || row['Company'] || 'Unknown Business',
    contactPerson: row['Contact Person'] || row['contactPerson'] || row['Contact'] || 'Key Contact',
    phone: String(row['Phone Number'] || row['phone'] || row['Mobile'] || ''),
    location: row['Location'] || row['location'] || row['City'] || 'Nellore',
    status: (row['Status'] || row['status'] || 'New / Contacted') as any,
    leadSource: row['Lead Source'] || row['leadSource'] || 'Inbound Web',
    notes: row['Notes'] || row['notes'] || 'Imported from Excel',
    followUpDate: row['Follow-up Date'] || row['followUpDate'] || new Date().toISOString().slice(0, 10),
  }));
}

// Generates PowerPoint Quotation presentation matching exact specification in document
export async function generatePowerPointQuotation(doc: GeneratedDocument, settings: CompanySettings) {
  // Dynamically import pptxgenjs to support client-side bundling
  const pptxgen = (await import('pptxgenjs')).default;
  const pptx = new pptxgen();

  pptx.layout = 'LAYOUT_16x9';
  pptx.title = `Quotation ${doc.docNumber} - ${doc.businessName}`;
  pptx.author = 'iFleon Technologies';
  pptx.subject = 'Commercial Quotation';

  // Branding Colors
  const COLOR_NAVY = '0F172A';
  const COLOR_BLUE = '1E40AF';
  const COLOR_ACCENT = '2563EB';
  const COLOR_LIGHT = 'F8FAFC';
  const COLOR_GRAY = '64748B';

  const footerText = `${settings.name} • ${settings.tagline} • ${settings.email} • ${settings.phone} • ${settings.website}`;

  // Helper for consistent header/footer
  function addHeaderFooter(slide: any, title: string) {
    // Header banner line
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: COLOR_ACCENT } });
    
    // Top right branding text
    slide.addText('iFleon | Intelligent Frameworks', {
      x: 8.0,
      y: 0.3,
      w: 4.8,
      h: 0.4,
      fontSize: 10,
      color: COLOR_GRAY,
      align: 'right',
      bold: true,
    });

    // Slide Title
    slide.addText(title, {
      x: 0.8,
      y: 0.6,
      w: 8.5,
      h: 0.6,
      fontSize: 22,
      bold: true,
      color: COLOR_NAVY,
    });

    // Sub divider
    slide.addShape(pptx.ShapeType.line, {
      x: 0.8,
      y: 1.25,
      w: 11.7,
      h: 0,
      line: { color: 'CBD5E1', width: 1 },
    });

    // Footer
    slide.addShape(pptx.ShapeType.line, {
      x: 0.8,
      y: 7.0,
      w: 11.7,
      h: 0,
      line: { color: 'E2E8F0', width: 0.75 },
    });
    slide.addText(footerText, {
      x: 0.8,
      y: 7.05,
      w: 11.7,
      h: 0.35,
      fontSize: 8.5,
      color: COLOR_GRAY,
      align: 'center',
    });
  }

  // SLIDE 1: COVER
  const slide1 = pptx.addSlide();
  slide1.background = { color: COLOR_NAVY };

  // Decorative accent bar
  slide1.addShape(pptx.ShapeType.rect, { x: 0.8, y: 0.8, w: 0.2, h: 5.5, fill: { color: COLOR_ACCENT } });

  slide1.addText('IFLEON', {
    x: 1.3,
    y: 1.2,
    w: 5.0,
    h: 0.7,
    fontSize: 36,
    bold: true,
    color: 'FFFFFF',
  });

  slide1.addText(settings.tagline, {
    x: 1.3,
    y: 1.9,
    w: 7.5,
    h: 0.4,
    fontSize: 14,
    color: '93C5FD',
  });

  slide1.addText('COMMERCIAL QUOTATION', {
    x: 1.3,
    y: 3.0,
    w: 9.0,
    h: 0.8,
    fontSize: 28,
    bold: true,
    color: '38BDF8',
  });

  slide1.addText(`Prepared for: ${doc.businessName}`, {
    x: 1.3,
    y: 3.9,
    w: 9.0,
    h: 0.5,
    fontSize: 18,
    bold: true,
    color: 'FFFFFF',
  });

  slide1.addText(
    `Quotation Ref: ${doc.docNumber}\nDate of Issue: ${doc.date}\nValid Until: ${doc.validUntilDate}\nPrepared by: ${doc.consultantName}`,
    {
      x: 1.3,
      y: 4.6,
      w: 6.5,
      h: 1.4,
      fontSize: 11,
      color: 'CBD5E1',
      lineSpacing: 18,
    }
  );

  // SLIDE 2: CUSTOMER DETAILS
  const slide2 = pptx.addSlide();
  addHeaderFooter(slide2, '1. Client Profile & Point of Contact');

  const clientInfoRows = [
    [{ text: 'Field', options: { bold: true, fill: { color: 'F1F5F9' } } }, { text: 'Client Details', options: { bold: true, fill: { color: 'F1F5F9' } } }],
    ['Business Name', doc.businessName],
    ['Primary Contact', doc.contactPerson],
    ['Phone / WhatsApp', doc.phone],
    ['Location / Showroom', doc.location],
    ['Assigned Consultant', doc.consultantName],
    ['Reference Number', doc.docNumber],
  ];
  slide2.addTable(clientInfoRows as any, {
    x: 1.2,
    y: 1.8,
    w: 10.5,
    colW: [3.5, 7.0],
    fontSize: 12,
    border: { pt: 0.5, color: 'CBD5E1' },
    margin: 8,
  });

  // SLIDE 3: PROJECT SUMMARY
  const slide3 = pptx.addSlide();
  addHeaderFooter(slide3, '2. Executive Project Summary');

  slide3.addShape(pptx.ShapeType.roundRect, {
    x: 1.2,
    y: 1.8,
    w: 10.8,
    h: 4.5,
    fill: { color: 'F8FAFC' },
    line: { color: 'E2E8F0', width: 1 },
  });

  slide3.addText('Strategic Objective', {
    x: 1.6,
    y: 2.1,
    w: 10.0,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: COLOR_NAVY,
  });

  slide3.addText(doc.projectSummary, {
    x: 1.6,
    y: 2.6,
    w: 10.0,
    h: 1.8,
    fontSize: 13,
    color: '334155',
    lineSpacing: 22,
  });

  slide3.addText('Key Business Outcomes:\n• Instant digital catalog for pre-owned stock with high-resolution imagery\n• Frictionless WhatsApp lead routing directly connecting buyers to sales team\n• Embedded EMI calculators enabling faster on-the-spot vehicle financing decisions', {
    x: 1.6,
    y: 4.4,
    w: 10.0,
    h: 1.6,
    fontSize: 12,
    color: COLOR_BLUE,
    lineSpacing: 20,
  });

  // SLIDE 4: SCOPE & DELIVERABLES
  const slide4 = pptx.addSlide();
  addHeaderFooter(slide4, '3. Scope of Modules & Deliverables');

  const scopeRows: any[] = [
    [{ text: 'Selected Module', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } }, { text: 'Functional Scope', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } }],
  ];

  doc.selectedModules.forEach((mod) => {
    scopeRows.push([mod, 'Fully integrated, responsive, mobile-optimized and branded module']);
  });

  slide4.addTable(scopeRows as any, {
    x: 1.0,
    y: 1.6,
    w: 11.2,
    colW: [3.8, 7.4],
    fontSize: 10.5,
    border: { pt: 0.5, color: 'E2E8F0' },
    margin: 6,
  });

  // SLIDE 5: PRICING TABLE
  const slide5 = pptx.addSlide();
  addHeaderFooter(slide5, '4. Investment & Commercial Terms');

  const priceRows: any[] = [
    [
      { text: 'Item / Module', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } },
      { text: 'Description', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } },
      { text: 'Qty', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF', align: 'center' } },
      { text: 'Rate (₹)', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF', align: 'right' } },
      { text: 'Amount (₹)', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF', align: 'right' } },
    ],
  ];

  doc.lineItems.forEach((li) => {
    priceRows.push([
      li.moduleOrItem,
      li.description,
      { text: String(li.qty), options: { align: 'center' } },
      { text: `₹${li.rate.toLocaleString()}`, options: { align: 'right' } },
      { text: `₹${li.amount.toLocaleString()}`, options: { align: 'right', bold: true } },
    ]);
  });

  // Subtotal & Total rows
  priceRows.push(
    ['', '', '', { text: 'Subtotal:', options: { bold: true, align: 'right' } }, { text: `₹${doc.subtotal.toLocaleString()}`, options: { bold: true, align: 'right' } }],
    ['', '', '', { text: 'Special Discount:', options: { bold: true, align: 'right', color: 'DC2626' } }, { text: `-₹${doc.discount.toLocaleString()}`, options: { bold: true, align: 'right', color: 'DC2626' } }],
    ['', '', '', { text: 'Final Total:', options: { bold: true, align: 'right', fill: { color: 'DBEAFE' }, color: COLOR_BLUE } }, { text: `₹${doc.total.toLocaleString()}`, options: { bold: true, align: 'right', fill: { color: 'DBEAFE' }, color: COLOR_BLUE } }]
  );

  slide5.addTable(priceRows as any, {
    x: 0.8,
    y: 1.6,
    w: 11.6,
    colW: [3.2, 4.4, 0.8, 1.6, 1.6],
    fontSize: 10,
    border: { pt: 0.5, color: 'CBD5E1' },
    margin: 5,
  });

  // SLIDE 6: PAYMENT TERMS & TIMELINE
  const slide6 = pptx.addSlide();
  addHeaderFooter(slide6, '5. Payment Terms & Project Timeline');

  slide6.addShape(pptx.ShapeType.roundRect, {
    x: 1.2,
    y: 1.8,
    w: 5.2,
    h: 4.8,
    fill: { color: 'F8FAFC' },
    line: { color: 'CBD5E1', width: 1 },
  });
  slide6.addText('Payment Schedule', { x: 1.5, y: 2.1, w: 4.5, h: 0.4, fontSize: 15, bold: true, color: COLOR_NAVY });
  slide6.addText(doc.paymentTerms, { x: 1.5, y: 2.6, w: 4.5, h: 3.5, fontSize: 12, color: '334155', lineSpacing: 22 });

  slide6.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.8,
    w: 5.2,
    h: 4.8,
    fill: { color: 'F8FAFC' },
    line: { color: 'CBD5E1', width: 1 },
  });
  slide6.addText('Delivery Milestones', { x: 7.1, y: 2.1, w: 4.5, h: 0.4, fontSize: 15, bold: true, color: COLOR_NAVY });
  slide6.addText(doc.timeline, { x: 7.1, y: 2.6, w: 4.5, h: 3.5, fontSize: 12, color: '334155', lineSpacing: 22 });

  // SLIDE 7: TERMS AND ACCEPTANCE
  const slide7 = pptx.addSlide();
  addHeaderFooter(slide7, '6. Terms, Conditions & Acceptance');

  slide7.addText('Standard Commercial Terms:', { x: 1.0, y: 1.6, w: 10.5, h: 0.35, fontSize: 13, bold: true, color: COLOR_NAVY });
  slide7.addText(doc.termsAndConditions, { x: 1.0, y: 2.0, w: 10.5, h: 1.5, fontSize: 11, color: '475569', lineSpacing: 18 });

  // Acceptance signature box
  slide7.addShape(pptx.ShapeType.rect, { x: 1.0, y: 3.8, w: 5.2, h: 2.6, fill: { color: 'FFFFFF' }, line: { color: '94A3B8', width: 1 } });
  slide7.addText('For iFleon Technologies', { x: 1.2, y: 4.0, w: 4.8, h: 0.35, fontSize: 12, bold: true, color: COLOR_NAVY });
  slide7.addText(`Consultant: ${doc.consultantName}\nPhone: ${settings.phone}\nEmail: ${settings.email}`, { x: 1.2, y: 4.5, w: 4.8, h: 1.0, fontSize: 11, color: COLOR_GRAY });
  slide7.addText('Authorized Signatory ___________________', { x: 1.2, y: 5.8, w: 4.8, h: 0.35, fontSize: 10.5, color: COLOR_NAVY });

  slide7.addShape(pptx.ShapeType.rect, { x: 6.8, y: 3.8, w: 5.4, h: 2.6, fill: { color: 'FFFFFF' }, line: { color: '94A3B8', width: 1 } });
  slide7.addText(`Accepted & Confirmed for ${doc.businessName}`, { x: 7.0, y: 4.0, w: 5.0, h: 0.35, fontSize: 12, bold: true, color: COLOR_NAVY });
  slide7.addText(`Client Name: ${doc.contactPerson}\nDesignation: _____________________\nDate: ___________________________`, { x: 7.0, y: 4.5, w: 5.0, h: 1.0, fontSize: 11, color: COLOR_GRAY });
  slide7.addText('Client Signature ________________________', { x: 7.0, y: 5.8, w: 5.0, h: 0.35, fontSize: 10.5, color: COLOR_NAVY });

  // Save the PPTX presentation
  await pptx.writeFile({ fileName: `${doc.docNumber}_Quotation_${doc.businessName.replace(/\s+/g, '_')}.pptx` });
}
