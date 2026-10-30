export type UserRole = 'admin' | 'manager' | 'consultant';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  disabled: boolean;
  createdAt: string;
  password?: string;
  department?: string;
  tutorialCompleted?: boolean;
  googleLinked?: boolean;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  rememberMe: boolean;
  loginTime: number;
  expiresAt: number;
}

export type LeadStatus =
  | 'New / Contacted'
  | 'Interested / Follow-up'
  | 'Proposal sent / Negotiation'
  | 'Won'
  | 'Lost';

export type ManagerReviewStatus = 'Pending' | 'Approved' | 'Needs changes';

export type MeetingType = 'Call' | 'Visit' | 'Video meeting';

export interface MeetingNote {
  id: string;
  leadId: string;
  meetingDateTime: string;
  type: MeetingType;
  attendees: string;
  minutes: string;
  nextAction?: string;
  addedById: string;
  addedByName: string;
  createdAt: string;
  editHistory?: Array<{ editedAt: string; editedBy: string }>;
}

export interface LeadAttachment {
  id: string;
  name: string;
  size: string;
  url: string;
  type: string;
  uploadedAt: string;
}

export interface TaskItem {
  id: string;
  leadId?: string;
  leadBusinessName?: string;
  consultantId: string;
  title: string;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface Lead {
  id: string;
  projectId: string;
  projectName?: string;
  contactPerson: string;
  phone: string;
  businessName: string;
  location: string;
  status: LeadStatus;
  followUpDate: string;
  leadSource: string;
  notes: string;
  consultantId: string;
  consultantName: string;
  managerReview: ManagerReviewStatus;
  managerComment?: string;
  finalDealAmount?: number | null;
  expectedCloseDate?: string;
  startDate?: string;
  lostReason?: string;
  tags: string[];
  attachments: LeadAttachment[];
  meetings?: MeetingNote[];
  tasks?: TaskItem[];
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface Project {
  id: string;
  name: string;
  clientOrCampaign: string;
  description: string;
  assignedConsultantIds: string[];
  createdById: string;
  status: 'active' | 'completed' | 'on_hold';
  createdAt: string;
}

export interface StandardScopeModule {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultPrice: number;
}

export interface PriceListItem {
  id: string;
  name: string;
  category: string;
  rate: number;
  unit: string;
  description: string;
}

export interface QuotationLineItem {
  id: string;
  moduleOrItem: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export type DocumentType = 'quotation' | 'proposal';
export type DocumentStatus = 'Draft' | 'Needs Approval' | 'Sent' | 'Accepted' | 'Rejected';

export interface GeneratedDocument {
  id: string;
  type: DocumentType;
  docNumber: string; // e.g. IFL-Q-2026-0001 or IFL-P-2026-0001
  leadId: string;
  businessName: string;
  contactPerson: string;
  phone: string;
  location: string;
  consultantId: string;
  consultantName: string;
  version: number;
  date: string;
  validUntilDate: string;
  projectSummary: string;
  selectedModules: string[];
  lineItems: QuotationLineItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentTerms: string;
  timeline: string;
  termsAndConditions: string;
  executiveSummary?: string;
  understandingOfNeeds?: string;
  proposedSolution?: string;
  assumptionsAndExclusions?: string;
  supportAndMaintenance?: string;
  status: DocumentStatus;
  requiresManagerApproval: boolean;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface AIProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  priority: number;
  enabled: boolean;
  hasKey?: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'Lead' | 'Project' | 'User' | 'Quotation' | 'Settings' | 'Meeting';
  entityId: string;
  entityName: string;
  details: string;
}

export interface EmailConfig {
  provider: 'hostinger_smtp' | 'elasticemail' | 'brevo' | 'resend' | 'custom_smtp' | 'native_mail';
  apiKey: string;
  senderEmail: string;
  senderName: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  enabled: boolean;
}

export interface EmailLogEntry {
  id: string;
  recipient: string;
  subject: string;
  type: 'test' | 'quotation' | 'lead_notification' | 'task_alert' | 'general';
  provider: string;
  status: 'sent' | 'failed';
  error?: string;
  sentAt: string;
}

export interface CompanySettings {
  name: string;
  tagline: string;
  address: string;
  cityState: string;
  phone: string;
  email: string;
  website: string;
  quotationApprovalThreshold: number; // e.g. 100000
  horizontalLogoUrl: string;
  iconLogoUrl: string;
  lightLogoUrl?: string;
  darkLogoUrl?: string;
  emailConfig?: EmailConfig;
}

export interface CRMTheme {
  id: string;
  name: string;
  primaryColor: string;
  primaryHover: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardBackground: string;
  textColor: string;
  borderRadius: string;
  isDark: boolean;
}

export type DatabaseType = 'json' | 'mysql';

export interface DatabaseConfig {
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  passwordMasked?: string;
  charset?: string;
  ssl?: boolean;
  connected?: boolean;
  lastTested?: string;
}

export interface TableRecordCount {
  table: string;
  count: number;
}

export interface BackupSnapshot {
  fileName: string;
  size: number;
  createdAt: string;
  type: 'json' | 'sql';
}

export interface DatabaseStatus {
  activeDriver: DatabaseType;
  status: 'connected' | 'disconnected' | 'error';
  config: DatabaseConfig;
  storagePath: string;
  fileSizeBytes: number;
  lastModified: string;
  tables: TableRecordCount[];
  backups: BackupSnapshot[];
  latencyMs?: number;
  message?: string;
  error?: string;
}

export interface GitCommitItem {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
  isCurrent?: boolean;
}

export interface HostingerServerInfo {
  host: string;
  port: number;
  subdomain: string;
  deployTarget: string;
  engine: string;
  phpVersion: string;
  webServer: string;
  diskFree?: string;
  diskTotal?: string;
  memoryUsage?: string;
}

export interface DeploymentStatus {
  status: 'healthy' | 'deploying' | 'degraded' | 'offline';
  environment: 'production' | 'staging' | 'local';
  deployedAt: string;
  commitHash: string;
  shortHash: string;
  branch: string;
  commitMessage: string;
  commitAuthor: string;
  commitDate: string;
  buildVersion: string;
  server: HostingerServerInfo;
  recentCommits: GitCommitItem[];
  livePing?: {
    status: number;
    latencyMs: number;
    ssl: boolean;
    timestamp: string;
  };
}


