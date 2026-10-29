import {
  TranslationProject,
  LinguisticResource,
  Assignment,
  QualityIssue,
  QualityReviewChecklist,
  CommunicationDraft,
  FileAnalysisReport,
  OperationalSettings,
  DashboardMetrics,
  User,
  Client,
  ProjectStatus,
} from '../types';
import {
  SEED_PROJECTS,
  SEED_RESOURCES,
  SEED_ASSIGNMENTS,
  SEED_QUALITY_ISSUES,
  SEED_QUALITY_CHECKLISTS,
  SEED_COMMUNICATIONS,
  SEED_FILES,
  SEED_SETTINGS,
  SEED_USERS,
  SEED_CLIENTS,
} from '../data/seedData';
import { analyzeFileContent } from './fileAnalyzer';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Local in-memory / localStorage cache fallback for resilience
const STORAGE_KEY_PREFIX = 'linguaflow_data_v1_';

function loadFromStorage<T>(key: string, defaultData: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage save error:', e);
  }
}

// Fallback in-memory database
class LocalDatabase {
  projects: TranslationProject[] = loadFromStorage('projects', SEED_PROJECTS);
  resources: LinguisticResource[] = loadFromStorage('resources', SEED_RESOURCES);
  assignments: Assignment[] = loadFromStorage('assignments', SEED_ASSIGNMENTS);
  qualityIssues: QualityIssue[] = loadFromStorage('quality_issues', SEED_QUALITY_ISSUES);
  qualityChecklists: QualityReviewChecklist[] = loadFromStorage('quality_checklists', SEED_QUALITY_CHECKLISTS);
  communications: CommunicationDraft[] = loadFromStorage('communications', SEED_COMMUNICATIONS);
  files: FileAnalysisReport[] = loadFromStorage('files', SEED_FILES);
  settings: OperationalSettings = loadFromStorage('settings', SEED_SETTINGS);
  users: User[] = loadFromStorage('users', SEED_USERS);
  clients: Client[] = loadFromStorage('clients', SEED_CLIENTS);

  save(entity: string) {
    saveToStorage(entity, (this as any)[entity]);
  }

  reset() {
    this.projects = [...SEED_PROJECTS];
    this.resources = [...SEED_RESOURCES];
    this.assignments = [...SEED_ASSIGNMENTS];
    this.qualityIssues = [...SEED_QUALITY_ISSUES];
    this.qualityChecklists = [...SEED_QUALITY_CHECKLISTS];
    this.communications = [...SEED_COMMUNICATIONS];
    this.files = [...SEED_FILES];
    this.settings = { ...SEED_SETTINGS };
    this.users = [...SEED_USERS];
    this.clients = [...SEED_CLIENTS];
    ['projects', 'resources', 'assignments', 'quality_issues', 'quality_checklists', 'communications', 'files', 'settings', 'users', 'clients'].forEach(
      (k) => saveToStorage(k, (this as any)[k])
    );
  }
}

const localDb = new LocalDatabase();

// Reusable fetch with fallback
async function fetchApi<T>(path: string, options?: RequestInit, fallbackFn?: () => T): Promise<T> {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    if (fallbackFn) {
      return fallbackFn();
    }
    throw err;
  }
}

export const api = {
  // Current user / auth
  getCurrentUser: (): User => {
    const saved = localStorage.getItem('linguaflow_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return localDb.users[0]; // Default Elena Rostova (Resource Coordinator)
  },

  setCurrentUser: (user: User) => {
    localStorage.setItem('linguaflow_current_user', JSON.stringify(user));
  },

  getUsers: async (): Promise<User[]> => {
    return fetchApi('/api/v1/users', undefined, () => localDb.users);
  },

  getClients: async (): Promise<Client[]> => {
    return fetchApi('/api/v1/clients', undefined, () => localDb.clients);
  },

  getSettings: async (): Promise<OperationalSettings> => {
    return fetchApi('/api/v1/settings', undefined, () => localDb.settings);
  },

  updateSettings: async (settings: Partial<OperationalSettings>): Promise<OperationalSettings> => {
    return fetchApi(
      '/api/v1/settings',
      { method: 'PUT', body: JSON.stringify(settings) },
      () => {
        localDb.settings = { ...localDb.settings, ...settings };
        localDb.save('settings');
        return localDb.settings;
      }
    );
  },

  // Projects
  getProjects: async (filters?: {
    status?: string;
    clientId?: string;
    domain?: string;
    priority?: string;
    search?: string;
  }): Promise<TranslationProject[]> => {
    return fetchApi(
      '/api/v1/projects',
      undefined,
      () => {
        let list = [...localDb.projects];
        if (filters?.status && filters.status !== 'ALL') {
          list = list.filter((p) => p.status === filters.status);
        }
        if (filters?.clientId && filters.clientId !== 'ALL') {
          list = list.filter((p) => p.clientId === filters.clientId);
        }
        if (filters?.domain && filters.domain !== 'ALL') {
          list = list.filter((p) => p.domain === filters.domain);
        }
        if (filters?.priority && filters.priority !== 'ALL') {
          list = list.filter((p) => p.priority === filters.priority);
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.reference.toLowerCase().includes(q) ||
              p.clientName.toLowerCase().includes(q)
          );
        }
        return list;
      }
    );
  },

  getProject: async (id: string): Promise<TranslationProject> => {
    return fetchApi(
      `/api/v1/projects/${id}`,
      undefined,
      () => {
        const found = localDb.projects.find((p) => p.id === id || p.reference === id);
        if (!found) throw new Error(`Project ${id} not found`);
        return found;
      }
    );
  },

  createProject: async (data: Partial<TranslationProject>): Promise<TranslationProject> => {
    return fetchApi(
      '/api/v1/projects',
      { method: 'POST', body: JSON.stringify(data) },
      () => {
        const newRefNumber = 100 + localDb.projects.length + 1;
        const newProj: TranslationProject = {
          id: `proj-${Date.now()}`,
          reference: `LF-2026-0${newRefNumber}`,
          name: data.name || 'Untitled Project',
          clientId: data.clientId || localDb.clients[0].id,
          clientName: data.clientName || localDb.clients[0].name,
          coordinatorId: data.coordinatorId || localDb.users[0].id,
          coordinatorName: data.coordinatorName || localDb.users[0].name,
          description: data.description || '',
          sourceLanguage: data.sourceLanguage || 'EN-US',
          targetLanguages: data.targetLanguages || ['DE-DE'],
          domain: data.domain || 'GENERAL',
          wordCount: Number(data.wordCount) || 1000,
          fileCount: Number(data.fileCount) || 1,
          priority: data.priority || 'MEDIUM',
          createdAt: new Date().toISOString(),
          requestedStartDate: data.requestedStartDate || new Date().toISOString(),
          deliveryDeadline: data.deliveryDeadline || new Date(Date.now() + 86400000 * 5).toISOString(),
          tmRequirement: data.tmRequirement || 'Default Translation Memory',
          glossaryRequirement: data.glossaryRequirement || 'Standard Corporate Glossary',
          customerInstructions: data.customerInstructions || '',
          status: 'REQUEST_RECEIVED',
          riskStatus: 'ON_TRACK',
          estimatedEffortHours: Math.round(((Number(data.wordCount) || 1000) / 300) * 10) / 10,
          internalNotes: data.internalNotes || '',
          progressPercent: 0,
          deliveryChecklist: {
            filesReceived: true,
            filePrepComplete: false,
            tmApplied: false,
            glossaryChecked: false,
            translationComplete: false,
            reviewComplete: false,
            qaIssuesResolved: false,
            clientSignOff: false,
          },
          activityHistory: [
            {
              id: `act-${Date.now()}`,
              timestamp: new Date().toISOString(),
              action: 'PROJECT_CREATED',
              userId: localDb.users[0].id,
              userName: localDb.users[0].name,
              notes: 'Project created by Resource Coordinator.',
            },
          ],
        };
        localDb.projects.unshift(newProj);
        localDb.save('projects');
        return newProj;
      }
    );
  },

  updateProject: async (id: string, updates: Partial<TranslationProject>): Promise<TranslationProject> => {
    return fetchApi(
      `/api/v1/projects/${id}`,
      { method: 'PATCH', body: JSON.stringify(updates) },
      () => {
        const idx = localDb.projects.findIndex((p) => p.id === id);
        if (idx === -1) throw new Error('Project not found');
        localDb.projects[idx] = { ...localDb.projects[idx], ...updates };
        localDb.save('projects');
        return localDb.projects[idx];
      }
    );
  },

  updateProjectStatus: async (
    id: string,
    newStatus: ProjectStatus,
    reason: string = '',
    actingUser?: User
  ): Promise<TranslationProject> => {
    return fetchApi(
      `/api/v1/projects/${id}/status`,
      { method: 'POST', body: JSON.stringify({ status: newStatus, reason, user: actingUser }) },
      () => {
        const idx = localDb.projects.findIndex((p) => p.id === id);
        if (idx === -1) throw new Error('Project not found');
        const proj = localDb.projects[idx];
        const oldStatus = proj.status;

        let holdReason = proj.holdReason;
        let prevBeforeHold = proj.previousStatusBeforeHold;

        if (newStatus === 'ON_HOLD') {
          prevBeforeHold = oldStatus;
          holdReason = reason || 'Placed on hold per operational review.';
        } else if (oldStatus === 'ON_HOLD') {
          holdReason = undefined;
        }

        // Checklist auto update
        const checklist = { ...proj.deliveryChecklist };
        if (newStatus === 'RESOURCE_ASSIGNMENT' || newStatus === 'TRANSLATION') {
          checklist.filePrepComplete = true;
          checklist.filesReceived = true;
        }
        if (newStatus === 'LINGUISTIC_REVIEW' || newStatus === 'QUALITY_ASSURANCE') {
          checklist.translationComplete = true;
        }
        if (newStatus === 'DELIVERY') {
          checklist.reviewComplete = true;
          checklist.qaIssuesResolved = true;
        }
        if (newStatus === 'COMPLETED') {
          checklist.clientSignOff = true;
          proj.actualDeliveredAt = new Date().toISOString();
        }

        const activity = {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          fromStatus: oldStatus,
          toStatus: newStatus,
          action: newStatus === 'ON_HOLD' ? 'PROJECT_PLACED_ON_HOLD' : 'STATUS_CHANGED',
          userId: actingUser?.id || 'usr-coord-1',
          userName: actingUser?.name || 'Elena Rostova',
          notes: reason || `Workflow progressed from ${oldStatus} to ${newStatus}.`,
        };

        const updated: TranslationProject = {
          ...proj,
          status: newStatus,
          previousStatusBeforeHold: prevBeforeHold,
          holdReason,
          deliveryChecklist: checklist,
          activityHistory: [activity, ...proj.activityHistory],
        };

        localDb.projects[idx] = updated;
        localDb.save('projects');
        return updated;
      }
    );
  },

  // Resources
  getResources: async (filters?: {
    search?: string;
    specialty?: string;
    availability?: string;
    languagePair?: string;
  }): Promise<LinguisticResource[]> => {
    return fetchApi(
      '/api/v1/resources',
      undefined,
      () => {
        let list = [...localDb.resources];
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(
            (r) =>
              r.displayName.toLowerCase().includes(q) ||
              r.email.toLowerCase().includes(q) ||
              r.location.toLowerCase().includes(q)
          );
        }
        if (filters?.specialty && filters.specialty !== 'ALL') {
          list = list.filter((r) => r.specialties.includes(filters.specialty as any));
        }
        if (filters?.availability && filters.availability !== 'ALL') {
          list = list.filter((r) => r.availabilityStatus === filters.availability);
        }
        return list;
      }
    );
  },

  getResource: async (id: string): Promise<LinguisticResource> => {
    return fetchApi(
      `/api/v1/resources/${id}`,
      undefined,
      () => {
        const found = localDb.resources.find((r) => r.id === id);
        if (!found) throw new Error(`Resource ${id} not found`);
        return found;
      }
    );
  },

  updateResource: async (id: string, updates: Partial<LinguisticResource>): Promise<LinguisticResource> => {
    return fetchApi(
      `/api/v1/resources/${id}`,
      { method: 'PATCH', body: JSON.stringify(updates) },
      () => {
        const idx = localDb.resources.findIndex((r) => r.id === id);
        if (idx === -1) throw new Error('Resource not found');
        localDb.resources[idx] = { ...localDb.resources[idx], ...updates };
        localDb.save('resources');
        return localDb.resources[idx];
      }
    );
  },

  // Assignments
  getAssignments: async (): Promise<Assignment[]> => {
    return fetchApi('/api/v1/assignments', undefined, () => localDb.assignments);
  },

  createAssignment: async (data: {
    projectId: string;
    resourceId: string;
    role: 'TRANSLATOR' | 'REVIEWER';
    notes?: string;
    overrideReason?: string;
    actingUser?: User;
  }): Promise<Assignment> => {
    return fetchApi(
      '/api/v1/assignments',
      { method: 'POST', body: JSON.stringify(data) },
      () => {
        const proj = localDb.projects.find((p) => p.id === data.projectId);
        const res = localDb.resources.find((r) => r.id === data.resourceId);
        if (!proj || !res) throw new Error('Project or Resource not found');

        const refNum = localDb.assignments.length + 1;
        const newAsg: Assignment = {
          id: `asg-${Date.now()}`,
          reference: `ASG-2026-0${refNum}`,
          projectId: proj.id,
          projectReference: proj.reference,
          projectName: proj.name,
          resourceId: res.id,
          resourceName: res.displayName,
          role: data.role,
          languagePair: `${proj.sourceLanguage} -> ${proj.targetLanguages.join(', ')}`,
          assignedWordCount: proj.wordCount,
          estimatedEffortHours: Math.round((proj.wordCount / (data.role === 'TRANSLATOR' ? 300 : 1000)) * 10) / 10,
          assignedDate: new Date().toISOString(),
          expectedStartDate: proj.requestedStartDate,
          expectedCompletionDate: proj.deliveryDeadline,
          status: 'IN_PROGRESS',
          progressPercent: 0,
          deadlineRisk: 'LOW',
          notes: data.notes || (data.overrideReason ? `Authorized Override: ${data.overrideReason}` : 'Assigned via transparent matching engine.'),
        };

        localDb.assignments.unshift(newAsg);
        localDb.save('assignments');

        // Update Project assigned translator / reviewer and progress status if in assignment stage
        if (data.role === 'TRANSLATOR') {
          proj.assignedTranslatorId = res.id;
          proj.assignedTranslatorName = res.displayName;
        } else {
          proj.assignedReviewerId = res.id;
          proj.assignedReviewerName = res.displayName;
        }

        if (proj.status === 'RESOURCE_ASSIGNMENT') {
          proj.status = 'TRANSLATION';
        }

        proj.activityHistory.unshift({
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'RESOURCE_ASSIGNED',
          userId: data.actingUser?.id || 'usr-coord-1',
          userName: data.actingUser?.name || 'Elena Rostova',
          notes: `Assigned ${res.displayName} as ${data.role} (${newAsg.reference}). ${data.overrideReason ? `[Override Note: ${data.overrideReason}]` : ''}`,
        });

        // Update Resource workload
        res.currentWorkloadWords += proj.wordCount;

        localDb.save('projects');
        localDb.save('resources');
        return newAsg;
      }
    );
  },

  updateAssignment: async (id: string, updates: Partial<Assignment>): Promise<Assignment> => {
    return fetchApi(
      `/api/v1/assignments/${id}`,
      { method: 'PATCH', body: JSON.stringify(updates) },
      () => {
        const idx = localDb.assignments.findIndex((a) => a.id === id);
        if (idx === -1) throw new Error('Assignment not found');
        localDb.assignments[idx] = { ...localDb.assignments[idx], ...updates };
        localDb.save('assignments');
        return localDb.assignments[idx];
      }
    );
  },

  // Files
  getFiles: async (projectId?: string): Promise<FileAnalysisReport[]> => {
    return fetchApi(
      `/api/v1/files${projectId ? `?projectId=${projectId}` : ''}`,
      undefined,
      () => (projectId ? localDb.files.filter((f) => f.projectId === projectId) : localDb.files)
    );
  },

  uploadAndAnalyzeFile: async (
    fileContent: string,
    fileName: string,
    projectId: string
  ): Promise<FileAnalysisReport> => {
    return fetchApi(
      '/api/v1/files/analyze',
      { method: 'POST', body: JSON.stringify({ fileContent, fileName, projectId }) },
      () => {
        const analysis = analyzeFileContent(fileContent, fileName);
        const format = fileName.toLowerCase().endsWith('.csv') ? 'CSV' : 'TXT';
        const sizeKb = (new Blob([fileContent]).size / 1024).toFixed(1) + ' KB';

        const newFileReport: FileAnalysisReport = {
          id: `fil-${Date.now()}`,
          projectId,
          fileName,
          fileSizeFormatted: sizeKb,
          format: format as any,
          uploadedAt: new Date().toISOString(),
          wordCount: analysis.wordCount,
          characterCount: analysis.characterCount,
          characterCountNoSpaces: analysis.characterCountNoSpaces,
          lineCount: analysis.lineCount,
          encoding: analysis.encoding,
          isUtf8Valid: analysis.isUtf8Valid,
          isEmpty: analysis.isEmpty,
          duplicateSegmentsFound: analysis.duplicateSegmentsFound,
          readinessStatus: 'PENDING_REVIEW',
          samplePreview: analysis.samplePreview,
          checklist: {
            filesReceived: true,
            readable: !analysis.isEmpty,
            languageVerified: false,
            referencesIdentified: false,
            instructionsPrepared: false,
            glossaryDocumented: false,
            wordCountReviewed: true,
            deliveryRequirementsRecorded: false,
          },
        };

        localDb.files.unshift(newFileReport);
        localDb.save('files');

        // Also update project wordCount and fileCount
        const proj = localDb.projects.find((p) => p.id === projectId);
        if (proj) {
          proj.fileCount += 1;
          proj.wordCount += analysis.wordCount;
          proj.estimatedEffortHours = Math.round((proj.wordCount / 300) * 10) / 10;
          if (proj.status === 'REQUEST_RECEIVED') {
            proj.status = 'FILE_PREPARATION';
          }
          localDb.save('projects');
        }

        return newFileReport;
      }
    );
  },

  updateFileChecklist: async (
    fileId: string,
    checklistKey: keyof FileAnalysisReport['checklist'],
    val: boolean
  ): Promise<FileAnalysisReport> => {
    return fetchApi(
      `/api/v1/files/${fileId}/checklist`,
      { method: 'POST', body: JSON.stringify({ checklistKey, val }) },
      () => {
        const file = localDb.files.find((f) => f.id === fileId);
        if (!file) throw new Error('File not found');
        file.checklist[checklistKey] = val;

        const allChecked = Object.values(file.checklist).every(Boolean);
        file.readinessStatus = allChecked ? 'PREPARED_READY' : 'PENDING_REVIEW';

        // Check if all files for project are ready
        const projectFiles = localDb.files.filter((f) => f.projectId === file.projectId);
        const allFilesReady = projectFiles.every((f) => f.readinessStatus === 'PREPARED_READY');
        const proj = localDb.projects.find((p) => p.id === file.projectId);
        if (proj && allFilesReady) {
          proj.deliveryChecklist.filePrepComplete = true;
          if (proj.status === 'FILE_PREPARATION') {
            proj.status = 'RESOURCE_ASSIGNMENT';
          }
          localDb.save('projects');
        }

        localDb.save('files');
        return file;
      }
    );
  },

  // Quality Issues
  getQualityIssues: async (projectId?: string): Promise<QualityIssue[]> => {
    return fetchApi(
      `/api/v1/quality/issues${projectId ? `?projectId=${projectId}` : ''}`,
      undefined,
      () => (projectId ? localDb.qualityIssues.filter((q) => q.projectId === projectId) : localDb.qualityIssues)
    );
  },

  createQualityIssue: async (data: Partial<QualityIssue>): Promise<QualityIssue> => {
    return fetchApi(
      '/api/v1/quality/issues',
      { method: 'POST', body: JSON.stringify(data) },
      () => {
        const count = localDb.qualityIssues.length + 1;
        const newIssue: QualityIssue = {
          id: `iss-${Date.now()}`,
          reference: `QA-ISS-0${40 + count}`,
          projectId: data.projectId || localDb.projects[0].id,
          projectReference: data.projectReference || localDb.projects[0].reference,
          projectName: data.projectName || localDb.projects[0].name,
          category: data.category || 'TERMINOLOGY',
          severity: data.severity || 'MAJOR',
          description: data.description || '',
          sourceSegment: data.sourceSegment || '',
          targetSegment: data.targetSegment || '',
          suggestedCorrection: data.suggestedCorrection || '',
          reporterId: data.reporterId || 'usr-ling-1',
          reporterName: data.reporterName || 'Dr. Sophie Lin',
          assignedOwnerId: data.assignedOwnerId || 'res-1',
          assignedOwnerName: data.assignedOwnerName || 'Linguist Lead',
          status: 'OPEN',
          createdAt: new Date().toISOString(),
        };

        localDb.qualityIssues.unshift(newIssue);
        localDb.save('quality_issues');
        return newIssue;
      }
    );
  },

  updateQualityIssue: async (id: string, updates: Partial<QualityIssue>): Promise<QualityIssue> => {
    return fetchApi(
      `/api/v1/quality/issues/${id}`,
      { method: 'PATCH', body: JSON.stringify(updates) },
      () => {
        const idx = localDb.qualityIssues.findIndex((q) => q.id === id);
        if (idx === -1) throw new Error('Issue not found');
        const updated = { ...localDb.qualityIssues[idx], ...updates };
        if (updates.status === 'RESOLVED' || updates.status === 'ACCEPTED_WITH_JUSTIFICATION') {
          updated.resolvedAt = new Date().toISOString();
        }
        localDb.qualityIssues[idx] = updated;
        localDb.save('quality_issues');
        return updated;
      }
    );
  },

  // Communications
  getCommunications: async (projectId?: string): Promise<CommunicationDraft[]> => {
    return fetchApi(
      `/api/v1/communications${projectId ? `?projectId=${projectId}` : ''}`,
      undefined,
      () => (projectId ? localDb.communications.filter((c) => c.projectId === projectId) : localDb.communications)
    );
  },

  saveCommunication: async (draft: CommunicationDraft): Promise<CommunicationDraft> => {
    return fetchApi(
      '/api/v1/communications',
      { method: 'POST', body: JSON.stringify(draft) },
      () => {
        const existingIdx = localDb.communications.findIndex((c) => c.id === draft.id);
        if (existingIdx !== -1) {
          localDb.communications[existingIdx] = draft;
        } else {
          localDb.communications.unshift(draft);
        }
        localDb.save('communications');
        return draft;
      }
    );
  },

  // Dashboard Metrics
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    return fetchApi(
      '/api/v1/dashboard/metrics',
      undefined,
      () => {
        const active = localDb.projects.filter((p) => p.status !== 'COMPLETED');
        const completed = localDb.projects.filter((p) => p.status === 'COMPLETED');

        const onTimeDelivered = completed.filter((p) => {
          if (!p.actualDeliveredAt) return true;
          return new Date(p.actualDeliveredAt).getTime() <= new Date(p.deliveryDeadline).getTime();
        }).length;

        const onTimeDeliveryRate =
          completed.length > 0 ? Math.round((onTimeDelivered / completed.length) * 100) : 100;

        const availableResources = localDb.resources.filter(
          (r) => r.availabilityStatus === 'AVAILABLE' && r.qualificationStatus === 'VERIFIED'
        ).length;

        const openIssues = localDb.qualityIssues.filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;

        return {
          totalActiveProjects: active.length,
          awaitingFilePrep: active.filter((p) => p.status === 'FILE_PREPARATION').length,
          awaitingResourceAssignment: active.filter((p) => p.status === 'RESOURCE_ASSIGNMENT').length,
          inTranslation: active.filter((p) => p.status === 'TRANSLATION').length,
          awaitingLinguisticReview: active.filter((p) => p.status === 'LINGUISTIC_REVIEW').length,
          approachingDeadlines: active.filter((p) => p.riskStatus === 'AT_RISK').length,
          overdueProjects: active.filter((p) => p.riskStatus === 'CRITICAL_OVERDUE').length,
          deliveredOnTimeCount: onTimeDelivered,
          onTimeDeliveryRate,
          availableResourcesCount: availableResources,
          openQualityIssuesCount: openIssues,
          avgTurnaroundDays: 4.8,
          avgAssignmentTurnaroundHours: 3.2,
        };
      }
    );
  },

  resetDatabase: async (): Promise<void> => {
    try {
      await fetch('/api/v1/database/reset', { method: 'POST' });
    } catch {}
    localDb.reset();
  },
};
