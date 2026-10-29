import { TranslationProject, OperationalSettings, RiskLevel } from '../types';

export interface EvaluatedRisk {
  projectId: string;
  projectReference: string;
  projectName: string;
  riskLevel: RiskLevel;
  reasons: string[];
  suggestedAction: string;
  hoursUntilDeadline: number;
}

export function evaluateProjectRisk(
  project: TranslationProject,
  settings: OperationalSettings,
  currentDate: Date = new Date('2026-10-29T09:00:00Z')
): EvaluatedRisk {
  const deadline = new Date(project.deliveryDeadline);
  const diffMs = deadline.getTime() - currentDate.getTime();
  const hoursUntilDeadline = Math.round(diffMs / (1000 * 60 * 60));

  const reasons: string[] = [];
  let riskLevel: RiskLevel = 'ON_TRACK';
  let suggestedAction = 'Maintain standard progress tracking.';

  // If already on hold
  if (project.status === 'ON_HOLD') {
    return {
      projectId: project.id,
      projectReference: project.reference,
      projectName: project.name,
      riskLevel: 'HOLD',
      reasons: [project.holdReason || 'Project currently on hold per client request.'],
      suggestedAction: 'Review client hold conditions and resume workflow when authorized.',
      hoursUntilDeadline,
    };
  }

  // If already completed or delivered
  if (project.status === 'COMPLETED' || project.status === 'DELIVERY') {
    return {
      projectId: project.id,
      projectReference: project.reference,
      projectName: project.name,
      riskLevel: 'ON_TRACK',
      reasons: [],
      suggestedAction: 'Project successfully delivered or in final dispatch.',
      hoursUntilDeadline,
    };
  }

  // Rule 1: Deadline has passed and work remains incomplete
  if (hoursUntilDeadline < 0 && project.progressPercent < 100) {
    riskLevel = 'CRITICAL_OVERDUE';
    reasons.push(
      `Delivery deadline passed ${Math.abs(hoursUntilDeadline)} hours ago with ${100 - project.progressPercent}% of work incomplete.`
    );
    suggestedAction = 'Trigger emergency escalation: contact project manager and assign priority rush resource.';
  }
  // Rule 2: Approaching deadline (< 48 hours) without an assigned resource
  else if (hoursUntilDeadline <= settings.urgentDeadlineThresholdHours && !project.assignedTranslatorId) {
    riskLevel = 'AT_RISK';
    reasons.push(
      `Project is due within ${hoursUntilDeadline} hours, but no linguistic resource has been allocated.`
    );
    suggestedAction = 'Open resource matching workspace immediately to assign qualified translator.';
  }
  // Rule 3: File preparation incomplete and requested start date has passed
  else if (
    project.status === 'FILE_PREPARATION' &&
    new Date(project.requestedStartDate).getTime() < currentDate.getTime()
  ) {
    riskLevel = 'AT_RISK';
    reasons.push('Source-file preparation and analysis checklist remain pending past planned start date.');
    suggestedAction = 'Complete file analysis checklist or re-upload missing source assets.';
  }
  // Rule 4: Approaching deadline (< 24 hours) with low progress (< 60%)
  else if (hoursUntilDeadline <= settings.highRiskThresholdHours && project.progressPercent < 60) {
    riskLevel = 'AT_RISK';
    reasons.push(
      `Only ${project.progressPercent}% completed with ${hoursUntilDeadline} hours remaining before delivery.`
    );
    suggestedAction = 'Split volume with a secondary translator or request a client deadline extension.';
  }
  // Rule 5: Low risk warning (due within 72 hours and under 40% complete)
  else if (hoursUntilDeadline <= 72 && project.progressPercent < 40) {
    riskLevel = 'LOW_RISK';
    reasons.push(`Due in ${hoursUntilDeadline} hours with ${project.progressPercent}% progress.`);
    suggestedAction = 'Send mid-project milestone reminder to assigned linguist.';
  }

  return {
    projectId: project.id,
    projectReference: project.reference,
    projectName: project.name,
    riskLevel,
    reasons,
    suggestedAction,
    hoursUntilDeadline,
  };
}
