import React from 'react';
import LeadDetailClient from './LeadDetailClient';

export async function generateStaticParams() {
  return [
    { id: 'lead-1' },
    { id: 'lead-2' },
    { id: 'lead-3' },
    { id: 'lead-4' },
    { id: 'lead-5' },
    { id: 'preview' },
  ];
}

export default function LeadDetailPage() {
  return <LeadDetailClient />;
}
