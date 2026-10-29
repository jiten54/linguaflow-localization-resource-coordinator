export type UserRole = 'RESOURCE_COORDINATOR' | 'PROJECT_MANAGER' | 'LINGUISTIC_RESOURCE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatarUrl?: string;
  department: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export type ProjectStatus =
  | 'REQUEST_RECEIVED'
  | 'FILE_PREPARATION'
  | 'RESOURCE_ASSIGNMENT'
  | 'TRANSLATION'
  | 'LINGUISTIC_REVIEW'
  | 'QUALITY_ASSURANCE'
  | 'DELIVERY'
  | 'COMPLETED'
  | 'ON_HOLD';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type RiskLevel = 'ON_TRACK' | 'LOW_RISK' | 'AT_RISK' | 'CRITICAL_OVERDUE' | 'HOLD';

export interface LanguagePair {
  source: string;
  target: string;
}

export type DomainExpertise =
  | 'MEDICAL'
  | 'LEGAL'
  | 'SOFTWARE_LOCALIZATION'
  | 'MARKETING'
  | 'FINANCE'
  | 'ENGINEERING'
  | 'GAMING'
  | 'GENERAL';

export interface Client {
  id: string;
  name: string;
  industry: string;
  tier: 'ENTERPRISE' | 'STRATEGIC' | 'STANDARD';
  primaryContact: string;
  email: string;
  slaHours: number;
  activeProjectsCount: number;
}

export interface LinguisticResource {
  id: string;
  displayName: string;
  email: string;
  resourceType: 'TRANSLATOR' | 'REVIEWER' | 'LEAD_LINGUIST';
  nativeLanguages: string[];
  languagePairs: LanguagePair[];
  proficiencies: Record<string, 'Native' | 'C2' | 'C1' | 'B2'>;
  specialties: DomainExpertise[];
  qualificationStatus: 'VERIFIED' | 'PENDING' | 'EXPIRED';
  availabilityStatus: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
  workingHours: string;
  timeZone: string;
  dailyCapacityWords: number;
  currentWorkloadWords: number;
  qualityScore: number; // 0 - 100
  onTimeDeliveryRate: number; // 0 - 100
  completedProjectsCount: number;
  hourlyRateEur: number;
  wordsPerHourAvg: number;
  contactPhone: string;
  internalNotes: string;
  location: string;
}

export interface FileAnalysisReport {
  id: string;
  projectId: string;
  fileName: string;
  fileSizeFormatted: string;
  format: 'TXT' | 'CSV' | 'JSON' | 'XLIFF';
  uploadedAt: string;
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  lineCount: number;
  encoding: string;
  isUtf8Valid: boolean;
  isEmpty: boolean;
  duplicateSegmentsFound: number;
  readinessStatus: 'PENDING_REVIEW' | 'PREPARED_READY' | 'REJECTED';
  samplePreview: string;
  checklist: {
    filesReceived: boolean;
    readable: boolean;
    languageVerified: boolean;
    referencesIdentified: boolean;
    instructionsPrepared: boolean;
    glossaryDocumented: boolean;
    wordCountReviewed: boolean;
    deliveryRequirementsRecorded: boolean;
  };
}

export interface ProjectActivity {
  id: string;
  timestamp: string;
  fromStatus?: ProjectStatus;
  toStatus?: ProjectStatus;
  action: string;
  userId: string;
  userName: string;
  notes?: string;
}

export interface DeliveryChecklist {
  filesReceived: boolean;
  filePrepComplete: boolean;
  tmApplied: boolean;
  glossaryChecked: boolean;
  translationComplete: boolean;
  reviewComplete: boolean;
  qaIssuesResolved: boolean;
  clientSignOff: boolean;
}

export interface TranslationProject {
  id: string;
  reference: string;
  name: string;
  clientId: string;
  clientName: string;
  coordinatorId: string;
  coordinatorName: string;
  description: string;
  sourceLanguage: string;
  targetLanguages: string[];
  domain: DomainExpertise;
  wordCount: number;
  fileCount: number;
  priority: Priority;
  createdAt: string;
  requestedStartDate: string;
  deliveryDeadline: string;
  assignedTranslatorId?: string;
  assignedTranslatorName?: string;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  tmRequirement: string;
  glossaryRequirement: string;
  customerInstructions: string;
  status: ProjectStatus;
  previousStatusBeforeHold?: ProjectStatus;
  holdReason?: string;
  riskStatus: RiskLevel;
  riskReason?: string;
  estimatedEffortHours: number;
  internalNotes: string;
  progressPercent: number;
  deliveryChecklist: DeliveryChecklist;
  activityHistory: ProjectActivity[];
  actualDeliveredAt?: string;
}

export interface Assignment {
  id: string;
  reference: string;
  projectId: string;
  projectReference: string;
  projectName: string;
  resourceId: string;
  resourceName: string;
  role: 'TRANSLATOR' | 'REVIEWER';
  languagePair: string;
  assignedWordCount: number;
  estimatedEffortHours: number;
  assignedDate: string;
  expectedStartDate: string;
  expectedCompletionDate: string;
  status: 'OFFERED' | 'ACCEPTED' | 'IN_PROGRESS' | 'DELIVERED' | 'APPROVED' | 'CANCELLED';
  progressPercent: number;
  deadlineRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  conflictWarning?: string;
  notes?: string;
}

export type QualityIssueSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';
export type QualityIssueCategory =
  | 'TERMINOLOGY'
  | 'MISTRANSLATION'
  | 'OMISSION'
  | 'GRAMMAR_STYLE'
  | 'FORMATTING'
  | 'GLOSSARY_NON_COMPLIANCE';
export type QualityIssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED_WITH_JUSTIFICATION';

export interface QualityIssue {
  id: string;
  reference: string;
  projectId: string;
  projectReference: string;
  projectName: string;
  category: QualityIssueCategory;
  severity: QualityIssueSeverity;
  description: string;
  sourceSegment?: string;
  targetSegment?: string;
  suggestedCorrection?: string;
  reporterId: string;
  reporterName: string;
  assignedOwnerId: string;
  assignedOwnerName: string;
  status: QualityIssueStatus;
  correctiveAction?: string;
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface QualityReviewChecklist {
  id: string;
  projectId: string;
  reviewerId: string;
  reviewerName: string;
  completedAt?: string;
  items: {
    requiredDeliverablesPresent: boolean;
    correctTargetLanguage: boolean;
    glossaryComplianceConfirmed: boolean;
    terminologyConsistencyReviewed: boolean;
    reviewerCommentsResolved: boolean;
    formattingAndIntegrityChecked: boolean;
    deliveryMetadataComplete: boolean;
    requiredApprovalRecorded: boolean;
  };
  overallVerdict: 'PASSED' | 'PASSED_WITH_CONDITIONS' | 'FAILED' | 'PENDING';
  linguisticScore: number; // 0 - 100
  notes?: string;
}

export interface CommunicationDraft {
  id: string;
  projectId: string;
  projectReference: string;
  projectName: string;
  templateType:
    | 'NEW_TRANSLATOR_ASSIGNMENT'
    | 'ASSIGNMENT_CONFIRMATION'
    | 'PROJECT_CLARIFICATION'
    | 'DEADLINE_REMINDER'
    | 'FILE_PREPARATION_REQUEST'
    | 'PROJECT_STATUS_UPDATE'
    | 'QUALITY_ISSUE_NOTIFICATION'
    | 'DELIVERY_CONFIRMATION';
  recipientRole: 'TRANSLATOR' | 'REVIEWER' | 'CLIENT' | 'COORDINATOR';
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  createdAt: string;
  status: 'DRAFT' | 'SIMULATED_SENT';
  sentAt?: string;
}

export interface CandidateMatchScore {
  resource: LinguisticResource;
  isEligible: boolean;
  disqualificationReasons: string[];
  totalScore: number; // 0 - 100
  breakdown: {
    languagePairScore: number; // max 25
    domainExpertiseScore: number; // max 25
    capacityScore: number; // max 25
    qualityMetricScore: number; // max 25
  };
  explanations: string[];
}

export interface OperationalSettings {
  wordsPerHourTranslation: number;
  wordsPerHourReview: number;
  urgentDeadlineThresholdHours: number;
  highRiskThresholdHours: number;
  weights: {
    languagePair: number;
    specialty: number;
    capacity: number;
    quality: number;
  };
}

export interface DashboardMetrics {
  totalActiveProjects: number;
  awaitingFilePrep: number;
  awaitingResourceAssignment: number;
  inTranslation: number;
  awaitingLinguisticReview: number;
  approachingDeadlines: number;
  overdueProjects: number;
  deliveredOnTimeCount: number;
  onTimeDeliveryRate: number;
  availableResourcesCount: number;
  openQualityIssuesCount: number;
  avgTurnaroundDays: number;
  avgAssignmentTurnaroundHours: number;
}
