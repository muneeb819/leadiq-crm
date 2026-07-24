export const PIPELINE_STAGES = [
  { id: 'discovery', label: 'Discovery', color: '#6366f1' },
  { id: 'qualified', label: 'Qualified', color: '#f59e0b' },
  { id: 'proposal', label: 'Proposal', color: '#3b82f6' },
  { id: 'negotiation', label: 'Negotiation', color: '#8b5cf6' },
  { id: 'won', label: 'Won', color: '#10b981' },
  { id: 'lost', label: 'Lost', color: '#ef4444' },
];

export const LEAD_STATUSES = ['NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST','NURTURING'];
export const LEAD_SOURCES = ['MANUAL','GITHUB','PRODUCT_HUNT','LINKEDIN','SERP','REFERRAL','WEBSITE','OTHER'];
