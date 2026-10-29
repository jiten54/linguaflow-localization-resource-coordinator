import { TranslationProject, LinguisticResource, CommunicationDraft } from '../types';

export interface TemplateDefinition {
  type: CommunicationDraft['templateType'];
  label: string;
  defaultRole: CommunicationDraft['recipientRole'];
  subjectTemplate: string;
  bodyTemplate: string;
}

export const COMMUNICATION_TEMPLATES: TemplateDefinition[] = [
  {
    type: 'NEW_TRANSLATOR_ASSIGNMENT',
    label: 'New Translator Assignment Invitation',
    defaultRole: 'TRANSLATOR',
    subjectTemplate: '[LinguaFlow] New Assignment Offer: {{projectReference}} - {{projectName}}',
    bodyTemplate: `Dear {{recipientName}},

We would like to offer you the following translation assignment for {{clientName}}:

Project Details:
- Project Reference: {{projectReference}}
- Project Name: {{projectName}}
- Domain: {{domain}}
- Language Pair: {{sourceLanguage}} -> {{targetLanguages}}
- Total Volume: {{wordCount}} words
- Delivery Deadline: {{deliveryDeadline}}
- Translation Memory: {{tmRequirement}}
- Termbase / Glossary: {{glossaryRequirement}}

Client Instructions:
"{{customerInstructions}}"

Please review the scope and reply to confirm your acceptance within 4 business hours. If you foresee any scheduling or capacity constraints, please let us know immediately so we can adjust resource allocation.

Kind regards,
{{coordinatorName}}
Associate Resource Coordinator, LinguaFlow`,
  },
  {
    type: 'ASSIGNMENT_CONFIRMATION',
    label: 'Assignment Confirmation Request',
    defaultRole: 'TRANSLATOR',
    subjectTemplate: '[LinguaFlow] Action Required: Confirm Acceptance for {{projectReference}}',
    bodyTemplate: `Dear {{recipientName}},

This is a follow-up request regarding project {{projectReference}} ({{projectName}}).

To maintain our client SLA with {{clientName}}, please log into the LinguaFlow portal and formally confirm your assignment acceptance.

Expected Completion Date: {{deliveryDeadline}}
Total Volume: {{wordCount}} words

If you require supplementary glossary packages or have terminology queries, please reply to this thread.

Best regards,
{{coordinatorName}}
LinguaFlow Operations`,
  },
  {
    type: 'PROJECT_CLARIFICATION',
    label: 'Project Clarification Request to Client',
    defaultRole: 'CLIENT',
    subjectTemplate: '[LinguaFlow] Linguistic Query / Clarification: {{projectReference}}',
    bodyTemplate: `Dear {{clientName}} Localization Team,

During the source-file preparation and initial translation pass for project {{projectReference}} ({{projectName}}), our linguistic team flagged the following clarification query:

- File: Source Package
- Source Segment / Term: [Insert term or string reference here]
- Query Context: [Please specify context or disambiguation question]
- Proposed Rendering: [Proposed translation / terminology candidate]

We would appreciate your guidance so our team can maintain terminology consistency across all target deliverables.

Thank you for your prompt assistance,
{{coordinatorName}}
Resource Coordination & Project Operations, LinguaFlow`,
  },
  {
    type: 'DEADLINE_REMINDER',
    label: 'Urgent Milestone / Deadline Reminder',
    defaultRole: 'TRANSLATOR',
    subjectTemplate: '[URGENT] Milestone Reminder: {{projectReference}} Delivery Due in {{hoursRemaining}} Hours',
    bodyTemplate: `Dear {{recipientName}},

This is an operational reminder that project {{projectReference}} ({{projectName}}) has a delivery deadline scheduled for:

Date & Time: {{deliveryDeadline}}
Remaining Volume: {{wordCount}} words

Please ensure your deliverables are uploaded to the handoff repository ahead of final linguistic QA. If you encounter any unexpected technical issues or require a handover split, notify the coordination desk immediately.

Thank you for your dedication to on-time delivery.

Best regards,
{{coordinatorName}}
LinguaFlow Resource Desk`,
  },
  {
    type: 'FILE_PREPARATION_REQUEST',
    label: 'Source-File Preparation & Ingestion Notice',
    defaultRole: 'COORDINATOR',
    subjectTemplate: '[LinguaFlow] File Preparation Status: {{projectReference}} Ready for CAT Ingestion',
    bodyTemplate: `Hello Team,

Source-file analysis for project {{projectReference}} ({{projectName}}) has been completed:

- Formats Verified: TXT / CSV / XLIFF
- Estimated Volume: {{wordCount}} words
- Character Encoding: UTF-8 (Strict compliance validated)
- CAT Package Manifest: Generated & attached

The file package has fulfilled all 8 preparation verification checks and is now cleared for resource allocation.

Regards,
{{coordinatorName}}
Resource Coordinator, LinguaFlow`,
  },
  {
    type: 'PROJECT_STATUS_UPDATE',
    label: 'Project Status Update to Client',
    defaultRole: 'CLIENT',
    subjectTemplate: '[LinguaFlow] Operational Progress Update: {{projectReference}} - {{status}}',
    bodyTemplate: `Dear {{clientName}} Team,

We are pleased to provide an operational progress update for {{projectReference}} ({{projectName}}):

- Current Stage: {{status}}
- Progress Completed: {{progressPercent}}%
- Target Languages: {{targetLanguages}}
- Expected Delivery: {{deliveryDeadline}}
- Quality Assurance: In progress

All milestones remain on track for delivery in accordance with agreed service level agreements.

Please let us know if you need any additional intermediate exports.

Warm regards,
{{coordinatorName}}
LinguaFlow Project Team`,
  },
  {
    type: 'QUALITY_ISSUE_NOTIFICATION',
    label: 'Linguistic QA Issue Notification & Query',
    defaultRole: 'TRANSLATOR',
    subjectTemplate: '[LinguaFlow QA] Linguistic Review Feedback: {{projectReference}}',
    bodyTemplate: `Dear {{recipientName}},

During the independent linguistic review for project {{projectReference}} ({{projectName}}), our senior reviewer noted an issue requiring your attention:

- Issue Category: Terminology / Glossary Compliance
- Reviewer Notes: Please inspect flagged segments against the approved project glossary ({{glossaryRequirement}}).
- Action Required: Update segments in the translation memory and submit revised target files.

Maintaining terminology consistency is critical for client signoff. Please review the comments in the QA tab.

Best regards,
{{coordinatorName}}
Quality Operations, LinguaFlow`,
  },
  {
    type: 'DELIVERY_CONFIRMATION',
    label: 'Final Delivery & Package Confirmation',
    defaultRole: 'CLIENT',
    subjectTemplate: '[LinguaFlow] Project Delivery Complete: {{projectReference}} - {{projectName}}',
    bodyTemplate: `Dear {{clientName}} Localization Team,

We are delighted to confirm the successful completion and delivery of project {{projectReference}} ({{projectName}}).

Delivered Package Summary:
- Project Reference: {{projectReference}}
- Languages Delivered: {{targetLanguages}}
- Total Words: {{wordCount}} words
- Delivery Date: {{deliveryDeadline}}
- Quality Checkpoints: 100% Passed (Linguistic review, terminology check, formatting validation)

The finalized target assets and translation memory updates have been archived in your client portal.

Thank you for partnering with LinguaFlow.

Sincerely,
{{coordinatorName}} & Marcus Vance
LinguaFlow Localization Services`,
  },
];

export function buildCommunicationDraft(
  templateType: CommunicationDraft['templateType'],
  project: TranslationProject,
  recipient: { name: string; email: string; role: CommunicationDraft['recipientRole'] },
  coordinatorName: string
): CommunicationDraft {
  const template =
    COMMUNICATION_TEMPLATES.find((t) => t.type === templateType) || COMMUNICATION_TEMPLATES[0];

  const now = new Date();
  const deadline = new Date(project.deliveryDeadline);
  const hoursRemaining = Math.max(0, Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));

  const replacements: Record<string, string> = {
    '{{projectReference}}': project.reference,
    '{{projectName}}': project.name,
    '{{clientName}}': project.clientName,
    '{{domain}}': project.domain,
    '{{sourceLanguage}}': project.sourceLanguage,
    '{{targetLanguages}}': project.targetLanguages.join(', '),
    '{{wordCount}}': project.wordCount.toLocaleString(),
    '{{deliveryDeadline}}': new Date(project.deliveryDeadline).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    '{{tmRequirement}}': project.tmRequirement,
    '{{glossaryRequirement}}': project.glossaryRequirement,
    '{{customerInstructions}}': project.customerInstructions,
    '{{coordinatorName}}': coordinatorName,
    '{{recipientName}}': recipient.name,
    '{{hoursRemaining}}': hoursRemaining.toString(),
    '{{status}}': project.status.replace(/_/g, ' '),
    '{{progressPercent}}': project.progressPercent.toString(),
  };

  let subject = template.subjectTemplate;
  let body = template.bodyTemplate;

  Object.entries(replacements).forEach(([key, val]) => {
    subject = subject.replaceAll(key, val);
    body = body.replaceAll(key, val);
  });

  return {
    id: `com-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    projectId: project.id,
    projectReference: project.reference,
    projectName: project.name,
    templateType,
    recipientRole: recipient.role,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    subject,
    body,
    createdAt: new Date().toISOString(),
    status: 'DRAFT',
  };
}
