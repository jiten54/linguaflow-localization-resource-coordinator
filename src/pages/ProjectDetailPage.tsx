import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  ArrowLeft,
  Calendar,
  Clock,
  UserCheck,
  FileText,
  Sparkles,
  Layers,
  ShieldCheck,
  MailCheck,
  History,
  AlertTriangle,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  Download,
  Upload,
  Copy,
  ExternalLink,
  ChevronRight,
  Send,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  TranslationProject,
  ProjectStatus,
  LinguisticResource,
  FileAnalysisReport,
  Assignment,
  QualityIssue,
  QualityReviewChecklist,
  CommunicationDraft,
  CandidateMatchScore,
  OperationalSettings,
} from '../types';
import { api } from '../lib/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { RiskBadge } from '../components/ui/RiskBadge';
import { Modal } from '../components/ui/Modal';
import { rankCandidatesForProject } from '../lib/matchingEngine';
import { generateCatHandoffManifest } from '../lib/fileAnalyzer';
import { buildCommunicationDraft, COMMUNICATION_TEMPLATES } from '../lib/communicationTemplates';
import { evaluateProjectRisk } from '../lib/riskEngine';

const LIFECYCLE_STAGES: { status: ProjectStatus; label: string }[] = [
  { status: 'REQUEST_RECEIVED', label: 'Request Received' },
  { status: 'FILE_PREPARATION', label: 'File Prep' },
  { status: 'RESOURCE_ASSIGNMENT', label: 'Resource Assignment' },
  { status: 'TRANSLATION', label: 'Translation' },
  { status: 'LINGUISTIC_REVIEW', label: 'Review' },
  { status: 'QUALITY_ASSURANCE', label: 'Quality QA' },
  { status: 'DELIVERY', label: 'Delivery' },
  { status: 'COMPLETED', label: 'Completed' },
];

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  const navigate = useNavigate();

  const [project, setProject] = useState<TranslationProject | null>(null);
  const [resources, setResources] = useState<LinguisticResource[]>([]);
  const [files, setFiles] = useState<FileAnalysisReport[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [communications, setCommunications] = useState<CommunicationDraft[]>([]);
  const [settings, setSettings] = useState<OperationalSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Action State
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [holdReasonInput, setHoldReasonInput] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateMatchScore | null>(null);
  const [isOverride, setIsOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [assignRole, setAssignRole] = useState<'TRANSLATOR' | 'REVIEWER'>('TRANSLATOR');

  // Compare candidates modal
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [candidatesToCompare, setCandidatesToCompare] = useState<CandidateMatchScore[]>([]);

  // New Quality Issue Modal
  const [isNewIssueModalOpen, setIsNewIssueModalOpen] = useState(false);
  const [issueCategory, setIssueCategory] = useState<QualityIssue['category']>('TERMINOLOGY');
  const [issueSeverity, setIssueSeverity] = useState<QualityIssue['severity']>('MAJOR');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueSourceSnippet, setIssueSourceSnippet] = useState('');
  const [issueTargetSnippet, setIssueTargetSnippet] = useState('');
  const [issueSuggestedCorrection, setIssueSuggestedCorrection] = useState('');

  // File upload state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileText, setUploadedFileText] = useState('');

  // Communication draft editor state
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationDraft['templateType']>('NEW_TRANSLATOR_ASSIGNMENT');
  const [activeDraft, setActiveDraft] = useState<CommunicationDraft | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  useEffect(() => {
    if (id) {
      loadProjectData(id);
    }
  }, [id]);

  const loadProjectData = async (projId: string) => {
    try {
      setLoading(true);
      const [proj, resList, fileList, asgList, issueList, commList, sett] = await Promise.all([
        api.getProject(projId),
        api.getResources(),
        api.getFiles(projId),
        api.getAssignments(),
        api.getQualityIssues(projId),
        api.getCommunications(projId),
        api.getSettings(),
      ]);

      setProject(proj);
      setResources(resList);
      setFiles(fileList);
      setAssignments(asgList.filter((a) => a.projectId === proj.id));
      setIssues(issueList);
      setCommunications(commList);
      setSettings(sett);

      // Initialize default communication draft
      const defaultRecipient = {
        name: proj.assignedTranslatorName || 'Candidate Linguist',
        email: 'linguist@linguaflow.com',
        role: 'TRANSLATOR' as const,
      };
      const draft = buildCommunicationDraft('NEW_TRANSLATOR_ASSIGNMENT', proj, defaultRecipient, proj.coordinatorName);
      setActiveDraft(draft);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusTransition = async (newStatus: ProjectStatus, reason: string = '') => {
    if (!project) return;
    try {
      const updated = await api.updateProjectStatus(project.id, newStatus, reason, api.getCurrentUser());
      setProject(updated);
    } catch (err) {
      console.error('Failed status transition:', err);
    }
  };

  const handlePlaceOnHold = async () => {
    if (!project || !holdReasonInput.trim()) return;
    await handleStatusTransition('ON_HOLD', holdReasonInput.trim());
    setIsHoldModalOpen(false);
    setHoldReasonInput('');
  };

  const handleResumeFromHold = async () => {
    if (!project) return;
    const resumeStatus = project.previousStatusBeforeHold || 'RESOURCE_ASSIGNMENT';
    await handleStatusTransition(resumeStatus, 'Resumed from hold after operational clearance.');
  };

  const handleConfirmAssignment = async () => {
    if (!project || !selectedCandidate) return;
    try {
      await api.createAssignment({
        projectId: project.id,
        resourceId: selectedCandidate.resource.id,
        role: assignRole,
        overrideReason: isOverride ? overrideReason : undefined,
        actingUser: api.getCurrentUser(),
      });

      setIsAssignModalOpen(false);
      setSelectedCandidate(null);
      setIsOverride(false);
      setOverrideReason('');
      if (id) loadProjectData(id);
    } catch (err) {
      console.error('Assignment failed:', err);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !uploadedFileName || !uploadedFileText) return;
    try {
      await api.uploadAndAnalyzeFile(uploadedFileText, uploadedFileName, project.id);
      setIsUploadModalOpen(false);
      setUploadedFileName('');
      setUploadedFileText('');
      if (id) loadProjectData(id);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleToggleChecklistItem = async (fileId: string, key: keyof FileAnalysisReport['checklist'], currentVal: boolean) => {
    try {
      await api.updateFileChecklist(fileId, key, !currentVal);
      if (id) loadProjectData(id);
    } catch (err) {
      console.error('Checklist update failed:', err);
    }
  };

  const handleCreateQualityIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !issueDescription.trim()) return;
    try {
      await api.createQualityIssue({
        projectId: project.id,
        projectReference: project.reference,
        projectName: project.name,
        category: issueCategory,
        severity: issueSeverity,
        description: issueDescription.trim(),
        sourceSegment: issueSourceSnippet.trim(),
        targetSegment: issueTargetSnippet.trim(),
        suggestedCorrection: issueSuggestedCorrection.trim(),
        reporterId: api.getCurrentUser().id,
        reporterName: api.getCurrentUser().name,
        assignedOwnerId: project.assignedTranslatorId || 'res-1',
        assignedOwnerName: project.assignedTranslatorName || 'Assigned Translator',
      });
      setIsNewIssueModalOpen(false);
      setIssueDescription('');
      setIssueSourceSnippet('');
      setIssueTargetSnippet('');
      setIssueSuggestedCorrection('');
      if (id) loadProjectData(id);
    } catch (err) {
      console.error('Create issue failed:', err);
    }
  };

  const handleResolveIssue = async (issueId: string) => {
    try {
      await api.updateQualityIssue(issueId, {
        status: 'RESOLVED',
        resolutionNotes: 'Verified and approved by Lead Resource Coordinator.',
      });
      if (id) loadProjectData(id);
    } catch (err) {
      console.error('Resolve issue failed:', err);
    }
  };

  const handleTemplateChange = (tpl: CommunicationDraft['templateType']) => {
    if (!project) return;
    setSelectedTemplate(tpl);
    const recipient = {
      name: project.assignedTranslatorName || 'Dr. Sophie Lin',
      email: 'sophie.lin@linguaflow.com',
      role: 'TRANSLATOR' as const,
    };
    const draft = buildCommunicationDraft(tpl, project, recipient, project.coordinatorName);
    setActiveDraft(draft);
  };

  const handleCopyDraft = () => {
    if (!activeDraft) return;
    const textToCopy = `Subject: ${activeDraft.subject}\n\n${activeDraft.body}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const handleSaveSimulatedSent = async () => {
    if (!activeDraft || !project) return;
    try {
      const toSave: CommunicationDraft = {
        ...activeDraft,
        status: 'SIMULATED_SENT',
        sentAt: new Date().toISOString(),
      };
      await api.saveCommunication(toSave);
      if (id) loadProjectData(id);
    } catch (err) {
      console.error('Save communication failed:', err);
    }
  };

  const handleDownloadCatManifest = () => {
    if (!project) return;
    const { jsonManifest, textManifest } = generateCatHandoffManifest(project, files);
    const blob = new Blob([textManifest], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.reference}_CAT_Handoff_Manifest.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !project || !settings) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
        <span>Loading project coordination workspace...</span>
      </div>
    );
  }

  // Scored candidates from matching engine
  const candidateScores = rankCandidatesForProject(resources, project, settings);
  const eligibleCandidates = candidateScores.filter((c) => c.isEligible);
  const disqualifiedCandidates = candidateScores.filter((c) => !c.isEligible);

  // Evaluated risk
  const evaluatedRisk = evaluateProjectRisk(project, settings);

  const tabs = [
    { id: 'overview', label: 'Overview & Lifecycle', icon: FolderKanban },
    { id: 'files', label: `Files & Analysis (${files.length})`, icon: FileText },
    { id: 'matching', label: `Translator Matching (${eligibleCandidates.length})`, icon: Sparkles },
    { id: 'timeline', label: 'Timeline & Milestones', icon: Calendar },
    { id: 'quality', label: `Linguistic QA (${issues.length})`, icon: ShieldCheck },
    { id: 'communications', label: 'Communication Center', icon: MailCheck },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  const currentStageIndex = LIFECYCLE_STAGES.findIndex((s) => s.status === project.status);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Link
            to="/projects"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Return to projects list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {project.reference}
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-xs font-semibold text-slate-700">{project.clientName}</span>
              <StatusBadge status={project.status} />
              <RiskBadge level={project.riskStatus} />
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-1">{project.name}</h1>
          </div>
        </div>

        {/* Header Action Buttons (Hold, Resume, CAT Export) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {project.status === 'ON_HOLD' ? (
            <button
              onClick={handleResumeFromHold}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Resume Project</span>
            </button>
          ) : (
            project.status !== 'COMPLETED' && (
              <button
                onClick={() => setIsHoldModalOpen(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <PauseCircle className="w-4 h-4 text-slate-500" />
                <span>Place on Hold</span>
              </button>
            )
          )}

          <button
            onClick={handleDownloadCatManifest}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            title="Export CAT package handoff manifest for Trados / memoQ / Phrase"
          >
            <Download className="w-4 h-4" />
            <span>CAT Handoff Package</span>
          </button>
        </div>
      </div>

      {/* Lifecycle Stage Progression Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-3 flex items-center justify-between">
          <span>Operational Lifecycle Progression</span>
          <span className="text-slate-500 font-medium">Stage {currentStageIndex + 1} of 8</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {LIFECYCLE_STAGES.map((stage, idx) => {
            const isCurrent = project.status === stage.status;
            const isPassed = currentStageIndex > idx;

            return (
              <button
                key={stage.status}
                onClick={() => handleStatusTransition(stage.status)}
                disabled={project.status === 'ON_HOLD'}
                className={`p-2 rounded-lg text-left border transition-all text-xs flex flex-col justify-between h-16 ${
                  isCurrent
                    ? 'border-indigo-600 bg-indigo-50/80 font-bold text-indigo-900 shadow-xs ring-2 ring-indigo-500/20'
                    : isPassed
                    ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900 font-medium'
                    : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-400">0{idx + 1}</span>
                  {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  {isCurrent && <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />}
                </div>
                <div className="truncate text-[11px] leading-tight">{stage.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ tab: tab.id })}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors shrink-0 ${
                isActive
                  ? 'border-indigo-600 text-indigo-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & LIFECYCLE */}
      {/* ========================================================================= */}
      {currentTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Scope & Metadata */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Project Scope &amp; Specifications
              </h2>

              <p className="text-xs text-slate-700 leading-relaxed">
                {project.description || 'No detailed scope description provided.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Source Language</span>
                  <span className="font-semibold text-slate-900 font-mono">{project.sourceLanguage}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Target Deliverables</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {project.targetLanguages.join(', ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Domain / Specialization</span>
                  <span className="font-semibold text-slate-900">{project.domain.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Volume</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {project.wordCount.toLocaleString()} words ({project.fileCount} files)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Estimated Effort</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    ~{project.estimatedEffortHours} hours (300 WPH)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Coordinator</span>
                  <span className="font-semibold text-slate-900">{project.coordinatorName}</span>
                </div>
              </div>
            </div>

            {/* Translation Memory & Glossary Requirements */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Linguistic Assets &amp; Customer Directives
              </h2>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-800 block text-[11px]">
                    Translation Memory (TM) Leverage:
                  </span>
                  <p className="text-slate-600 mt-0.5">{project.tmRequirement}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-800 block text-[11px]">
                    Approved Termbase &amp; Glossary:
                  </span>
                  <p className="text-slate-600 mt-0.5">{project.glossaryRequirement}</p>
                </div>

                {project.customerInstructions && (
                  <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                    <span className="font-semibold text-indigo-900 block text-[11px]">
                      Client Customer Directives:
                    </span>
                    <p className="text-indigo-800 mt-0.5">{project.customerInstructions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Readiness Checklist & Allocations */}
          <div className="space-y-6">
            {/* Delivery Readiness Checklist */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
                <span>Delivery Gate Checklist</span>
                <span className="text-indigo-600 font-mono">
                  {Object.values(project.deliveryChecklist).filter(Boolean).length}/8 Verified
                </span>
              </h2>

              <div className="space-y-2 text-xs">
                {Object.entries({
                  filesReceived: 'Source files ingested & readable',
                  filePrepComplete: 'File preparation checklist certified',
                  tmApplied: 'Translation Memory leverage applied',
                  glossaryChecked: 'Glossary & termbase attached',
                  translationComplete: 'Target translation batch delivered',
                  reviewComplete: 'Independent linguistic review passed',
                  qaIssuesResolved: 'All open QA queries resolved',
                  clientSignOff: 'Client final handoff signoff recorded',
                }).map(([key, label]) => {
                  const isChecked = (project.deliveryChecklist as any)[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100"
                    >
                      <span className="text-slate-700 text-[11px]">{label}</span>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isChecked ? 'PASS' : 'PENDING'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assigned Personnel Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Allocated Personnel
              </h2>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Lead Translator
                  </span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {project.assignedTranslatorName || 'Unassigned — Run matching engine'}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Senior Reviewer
                  </span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {project.assignedReviewerName || 'Unassigned — Optional secondary review'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSearchParams({ tab: 'matching' })}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Open Resource Matching Engine</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FILES & PREPARATION CENTER */}
      {/* ========================================================================= */}
      {currentTab === 'files' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Source-File Preparation Center</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ingest, tokenize, validate UTF-8 encoding, and certify preparation checklists.
              </p>
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Source File (TXT/CSV)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{file.fileName}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {file.format}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          file.readinessStatus === 'PREPARED_READY'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {file.readinessStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Uploaded: {new Date(file.uploadedAt).toLocaleString()} · Size: {file.fileSizeFormatted}
                    </div>
                  </div>

                  {/* Token Metrics */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">Word Count</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {file.wordCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">Characters</span>
                      <span className="font-semibold text-slate-700">
                        {file.characterCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">Encoding</span>
                      <span className="font-semibold text-emerald-600">{file.encoding} (Valid)</span>
                    </div>
                  </div>
                </div>

                {/* Sample Content Preview */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700 whitespace-pre-wrap max-h-28 overflow-y-auto">
                  {file.samplePreview}
                </div>

                {/* 8-Step Preparation Verification Checklist */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-2">
                    Associate Resource Coordinator — File Readiness Verification Checklist
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                    {[
                      { key: 'filesReceived', label: '1. Files received & readable' },
                      { key: 'readable', label: '2. Non-corrupt format integrity' },
                      { key: 'languageVerified', label: '3. Source language verified' },
                      { key: 'referencesIdentified', label: '4. Reference materials mapped' },
                      { key: 'instructionsPrepared', label: '5. Instructions prepared' },
                      { key: 'glossaryDocumented', label: '6. Glossary terms documented' },
                      { key: 'wordCountReviewed', label: '7. Word count reviewed' },
                      { key: 'deliveryRequirementsRecorded', label: '8. Delivery specs locked' },
                    ].map(({ key, label }) => {
                      const isChecked = (file.checklist as any)[key];
                      return (
                        <button
                          key={key}
                          onClick={() =>
                            handleToggleChecklistItem(file.id, key as keyof FileAnalysisReport['checklist'], isChecked)
                          }
                          className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                            isChecked
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-[11px] truncate">{label}</span>
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ml-1.5 ${
                              isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                            }`}
                          >
                            {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            {files.length === 0 && (
              <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
                No files uploaded for this project yet. Click &quot;Upload Source File&quot; to begin preparation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRANSPARENT TRANSLATOR MATCHING ENGINE */}
      {/* ========================================================================= */}
      {currentTab === 'matching' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Transparent Translator Matching Engine
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic weighted ranking evaluating language proficiency (25%), domain expertise (25%), capacity (25%), and historical quality (25%).
              </p>
            </div>

            {eligibleCandidates.length >= 2 && (
              <button
                onClick={() => {
                  setCandidatesToCompare(eligibleCandidates.slice(0, 3));
                  setIsCompareModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
              >
                Compare Top Candidates Side-by-Side
              </button>
            )}
          </div>

          {/* Eligible Candidates Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center justify-between">
              <span>Eligible Linguistic Candidates ({eligibleCandidates.length})</span>
              <span className="text-emerald-600">Passed all hard eligibility filters</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eligibleCandidates.map((candidate, rank) => {
                const r = candidate.resource;
                const isCurrentlyAssigned = project.assignedTranslatorId === r.id;

                return (
                  <div
                    key={r.id}
                    className={`bg-white rounded-xl p-5 border shadow-xs transition-all flex flex-col justify-between ${
                      isCurrentlyAssigned
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-400">#{rank + 1}</span>
                            <span className="font-bold text-slate-900 text-sm">{r.displayName}</span>
                            <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                              {r.resourceType}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {r.location} · {r.workingHours} ({r.timeZone})
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div className="text-right">
                          <div className="text-xl font-black text-indigo-600 font-mono">
                            {candidate.totalScore}%
                          </div>
                          <span className="text-[10px] font-mono font-medium text-slate-400 block">
                            MATCH SCORE
                          </span>
                        </div>
                      </div>

                      {/* Transparent Score Breakdown */}
                      <div className="grid grid-cols-4 gap-2 py-3 border-b border-slate-100 text-center">
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Language</span>
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {candidate.breakdown.languagePairScore}/25
                          </span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Domain</span>
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {candidate.breakdown.domainExpertiseScore}/25
                          </span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Capacity</span>
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {candidate.breakdown.capacityScore}/25
                          </span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Quality</span>
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {candidate.breakdown.qualityMetricScore}/25
                          </span>
                        </div>
                      </div>

                      {/* Explainable Reasoning List */}
                      <div className="py-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block mb-1">
                          Scoring Rationale &amp; Explanations
                        </span>
                        {candidate.explanations.map((exp, idx) => (
                          <div key={idx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                            <span className="text-indigo-500 font-bold">✓</span>
                            <span>{exp}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
                      <div className="text-[11px] text-slate-500 font-mono">
                        €{r.hourlyRateEur}/hr · {r.wordsPerHourAvg} WPH
                      </div>

                      {isCurrentlyAssigned ? (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Currently Assigned</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setIsOverride(false);
                            setAssignRole('TRANSLATOR');
                            setIsAssignModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        >
                          Assign Translator
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disqualified Candidates Section */}
          {disqualifiedCandidates.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 font-mono flex items-center justify-between">
                <span>Disqualified Resources ({disqualifiedCandidates.length})</span>
                <span className="text-slate-400">Failed mandatory eligibility checks</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {disqualifiedCandidates.slice(0, 4).map((candidate) => {
                  const r = candidate.resource;

                  return (
                    <div
                      key={r.id}
                      className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 opacity-85 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                          <div>
                            <span className="font-bold text-slate-700 text-xs">{r.displayName}</span>
                            <span className="text-[10px] text-slate-400 ml-2">({r.resourceType})</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                            DISQUALIFIED
                          </span>
                        </div>

                        <div className="py-2 space-y-1">
                          {candidate.disqualificationReasons.map((reason, idx) => (
                            <div key={idx} className="text-[11px] text-rose-700 flex items-start gap-1.5">
                              <span className="text-rose-500 font-bold">✗</span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between mt-2">
                        <span className="text-[10px] text-slate-400">Authorized exception override available</span>
                        <button
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setIsOverride(true);
                            setAssignRole('TRANSLATOR');
                            setIsAssignModalOpen(true);
                          }}
                          className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 hover:underline"
                        >
                          Override &amp; Assign...
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TIMELINE & MILESTONES */}
      {/* ========================================================================= */}
      {currentTab === 'timeline' && (
        <div className="space-y-6">
          {/* Risk Evaluation Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              evaluatedRisk.riskLevel === 'CRITICAL_OVERDUE'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : evaluatedRisk.riskLevel === 'AT_RISK'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <RiskBadge level={evaluatedRisk.riskLevel} />
                <span className="font-bold text-xs font-mono">
                  {evaluatedRisk.hoursUntilDeadline > 0
                    ? `${evaluatedRisk.hoursUntilDeadline} Hours Remaining`
                    : `${Math.abs(evaluatedRisk.hoursUntilDeadline)} Hours Overdue`}
                </span>
              </div>
              <p className="text-xs mt-1 font-medium">{evaluatedRisk.suggestedAction}</p>
            </div>

            {evaluatedRisk.riskLevel !== 'ON_TRACK' && (
              <button
                onClick={() => setSearchParams({ tab: 'communications' })}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold self-start sm:self-auto shrink-0 transition-colors"
              >
                Send Urgent Milestone Reminder
              </button>
            )}
          </div>

          {/* Milestone Schedule */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Delivery Milestones &amp; Schedule
            </h3>

            <div className="space-y-4">
              {[
                {
                  label: 'Project Ingestion & Work Order Confirmation',
                  date: project.createdAt,
                  status: 'COMPLETED',
                },
                {
                  label: 'Source-File Analysis & Preparation Checklist',
                  date: project.requestedStartDate,
                  status: project.deliveryChecklist.filePrepComplete ? 'COMPLETED' : 'IN_PROGRESS',
                },
                {
                  label: 'Translator Allocation & Handoff Package Transfer',
                  date: project.requestedStartDate,
                  status: project.assignedTranslatorId ? 'COMPLETED' : 'PENDING',
                },
                {
                  label: 'Mid-Point Translation Milestone Delivery',
                  date: new Date(new Date(project.requestedStartDate).getTime() + 86400000 * 2).toISOString(),
                  status: project.progressPercent >= 50 ? 'COMPLETED' : 'PENDING',
                },
                {
                  label: 'Linguistic Review & QA Verification',
                  date: new Date(new Date(project.deliveryDeadline).getTime() - 86400000).toISOString(),
                  status: project.deliveryChecklist.reviewComplete ? 'COMPLETED' : 'PENDING',
                },
                {
                  label: 'Final Target Delivery to Client',
                  date: project.deliveryDeadline,
                  status: project.status === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING',
                },
              ].map((m, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5 ${
                      m.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : m.status === 'IN_PROGRESS'
                        ? 'bg-indigo-100 text-indigo-800 animate-pulse'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 pb-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{m.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {new Date(m.date).toLocaleString()}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        m.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : m.status === 'IN_PROGRESS'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: LINGUISTIC QA & ISSUES */}
      {/* ========================================================================= */}
      {currentTab === 'quality' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Linguistic Quality Assurance &amp; Issues</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track terminology compliance, mistranslations, and reviewer query resolutions.
              </p>
            </div>

            <button
              onClick={() => setIsNewIssueModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Log Quality Issue</span>
            </button>
          </div>

          {/* Issues List */}
          <div className="space-y-3">
            {issues.map((iss) => (
              <div
                key={iss.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{iss.reference}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.2 rounded font-semibold ${
                        iss.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : iss.severity === 'MAJOR'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {iss.severity}
                    </span>
                    <span className="text-xs text-slate-500">
                      Category: <strong className="text-slate-800">{iss.category.replace(/_/g, ' ')}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded font-medium ${
                        iss.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {iss.status.replace(/_/g, ' ')}
                    </span>
                    {iss.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolveIssue(iss.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-700 font-medium">{iss.description}</p>

                {/* Source & Target Segments */}
                {(iss.sourceSegment || iss.targetSegment) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                        Source Segment:
                      </span>
                      <p className="text-slate-800 mt-1">{iss.sourceSegment}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-500 font-semibold uppercase block">
                        Flagged Target / Correction:
                      </span>
                      <p className="text-rose-700 mt-1">{iss.targetSegment}</p>
                      {iss.suggestedCorrection && (
                        <p className="text-emerald-700 mt-1 pt-1 border-t border-slate-200">
                          Proposed Fix: {iss.suggestedCorrection}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Reported by: {iss.reporterName}</span>
                  <span>Assigned Owner: {iss.assignedOwnerName}</span>
                </div>
              </div>
            ))}

            {issues.length === 0 && (
              <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
                No quality issues currently logged. Quality checks are fully compliant.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: COMMUNICATION CENTER */}
      {/* ========================================================================= */}
      {currentTab === 'communications' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Project Communication Desk</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Draft professional coordinator memos and client updates with real project detail interpolation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Template Selector */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
                Operational Templates
              </h3>
              {COMMUNICATION_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.type}
                  onClick={() => handleTemplateChange(tpl.type)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                    selectedTemplate === tpl.type
                      ? 'border-indigo-600 bg-indigo-50 font-semibold text-indigo-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="truncate">{tpl.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                </button>
              ))}
            </div>

            {/* Right Column: Editable Draft & Action */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              {activeDraft ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Recipient: {activeDraft.recipientRole} ({activeDraft.recipientName})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyDraft}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>{copiedNotice ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
                      </button>

                      <button
                        onClick={handleSaveSimulatedSent}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Save &amp; Mark Sent</span>
                      </button>
                    </div>
                  </div>

                  {/* Subject Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={activeDraft.subject}
                      onChange={(e) => setActiveDraft({ ...activeDraft, subject: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-900"
                    />
                  </div>

                  {/* Body Textarea */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Message Body</label>
                    <textarea
                      rows={10}
                      value={activeDraft.body}
                      onChange={(e) => setActiveDraft({ ...activeDraft, body: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-slate-800 leading-relaxed"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Note: LinguaFlow uses simulated dispatch to maintain audit records without external SMTP dependencies.
                  </p>
                </>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">Select a template to generate a draft.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: AUDIT TRAIL */}
      {/* ========================================================================= */}
      {currentTab === 'audit' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            Chronological Project Audit History
          </h2>

          <div className="space-y-4">
            {project.activityHistory.map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{act.action.replace(/_/g, ' ')}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{act.userName}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {act.notes && <p className="text-slate-600 mt-1">{act.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PLACE ON HOLD */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isHoldModalOpen}
        onClose={() => setIsHoldModalOpen(false)}
        title="Place Project On Hold"
        description="Temporarily freeze workflow progression pending client authorization or updated assets."
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hold Reason &amp; Explanation <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={holdReasonInput}
              onChange={(e) => setHoldReasonInput(e.target.value)}
              placeholder="e.g. Client requested temporary hold while legal counsel amends Section 4 clauses."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setIsHoldModalOpen(false)}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handlePlaceOnHold}
              disabled={!holdReasonInput.trim()}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Confirm Hold
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN RESOURCE / CONFIRMATION */}
      {/* ========================================================================= */}
      {selectedCandidate && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Confirm Allocation: ${selectedCandidate.resource.displayName}`}
          description={`Allocate to project ${project.reference} (${project.wordCount.toLocaleString()} words)`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Match Score:</span>
                <span className="font-mono font-bold text-indigo-600 text-sm">
                  {selectedCandidate.totalScore}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Language Pairs:</span>
                <span className="font-mono text-slate-800">
                  {selectedCandidate.resource.languagePairs.map((p) => `${p.source}→${p.target}`).join(', ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Daily Capacity:</span>
                <span className="font-mono text-slate-800">
                  {selectedCandidate.resource.dailyCapacityWords.toLocaleString()} words/day
                </span>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Role</label>
              <select
                value={assignRole}
                onChange={(e) => setAssignRole(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-semibold"
              >
                <option value="TRANSLATOR">Lead Translator (Primary Draft)</option>
                <option value="REVIEWER">Senior Quality Reviewer (Linguistic Verification)</option>
              </select>
            </div>

            {/* If Override Mode */}
            {isOverride && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                <div className="font-bold text-rose-800 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Mandatory Override Justification</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  This candidate failed hard eligibility checks. Coordinator must supply an operational justification.
                </p>
                <textarea
                  rows={2}
                  required
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Specify authorized operational reason (e.g. Urgent capacity surge approved by PM)..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-rose-300 rounded focus:outline-none text-slate-900"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignment}
                disabled={isOverride && !overrideReason.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: COMPARE CANDIDATES SIDE-BY-SIDE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        maxWidth="max-w-4xl"
        title="Side-by-Side Translator Candidate Comparison"
        description="Evaluate top ranked linguists against project requirements before committing allocation."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {candidatesToCompare.map((cand, idx) => {
            const r = cand.resource;
            return (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="pb-2 border-b border-slate-200">
                  <div className="font-bold text-slate-900 text-sm">{r.displayName}</div>
                  <div className="text-[11px] text-slate-500">{r.resourceType}</div>
                  <div className="text-xl font-black text-indigo-600 font-mono mt-1">
                    {cand.totalScore}%
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Native Target:</span>
                    <span className="font-semibold text-slate-800">{r.nativeLanguages.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Domain Match:</span>
                    <span className="font-semibold text-slate-800">
                      {cand.breakdown.domainExpertiseScore}/25 pts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Daily Capacity:</span>
                    <span className="font-mono text-slate-800">
                      {r.dailyCapacityWords.toLocaleString()} w/day
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quality Score:</span>
                    <span className="font-mono text-emerald-600 font-bold">{r.qualityScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">On-Time SLA:</span>
                    <span className="font-mono text-emerald-600 font-bold">
                      {r.onTimeDeliveryRate}%
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCompareModalOpen(false);
                    setSelectedCandidate(cand);
                    setIsOverride(false);
                    setIsAssignModalOpen(true);
                  }}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold text-xs shadow-xs"
                >
                  Select Candidate
                </button>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: UPLOAD SOURCE FILE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Source Translation File"
        description="Ingest TXT or CSV source assets to calculate word count and verify character encoding."
      >
        <form onSubmit={handleFileUpload} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              File Name (with .txt or .csv extension) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={uploadedFileName}
              onChange={(e) => setUploadedFileName(e.target.value)}
              placeholder="e.g. Clinical_Protocol_Patient_Info.txt"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              File Content (Paste raw text or CSV strings) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={6}
              required
              value={uploadedFileText}
              onChange={(e) => setUploadedFileText(e.target.value)}
              placeholder="Paste text or CSV data here (e.g. Segment_ID,Source_String_EN,Context)..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!uploadedFileName || !uploadedFileText}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Analyze &amp; Ingest
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: LOG QUALITY ISSUE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewIssueModalOpen}
        onClose={() => setIsNewIssueModalOpen(false)}
        title="Log Linguistic Quality Issue"
        description="Record terminology discrepancy, mistranslation, or format defect for reviewer triage."
      >
        <form onSubmit={handleCreateQualityIssue} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={issueCategory}
                onChange={(e) => setIssueCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-900 font-medium"
              >
                <option value="TERMINOLOGY">Terminology Inconsistency</option>
                <option value="MISTRANSLATION">Mistranslation / Accuracy</option>
                <option value="GLOSSARY_NON_COMPLIANCE">Glossary Non-Compliance</option>
                <option value="FORMATTING">Formatting / Length Overflow</option>
                <option value="GRAMMAR_STYLE">Grammar &amp; Style</option>
                <option value="OMISSION">Omission / Untranslated Text</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
              <select
                value={issueSeverity}
                onChange={(e) => setIssueSeverity(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-900 font-medium"
              >
                <option value="CRITICAL">Critical (Blocks Delivery)</option>
                <option value="MAJOR">Major (Client Visible)</option>
                <option value="MINOR">Minor (Stylistic / Polish)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Issue Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="e.g. Non-approved clinical term used in Patient Information Leaflet Section 2."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Source Segment</label>
            <textarea
              rows={2}
              value={issueSourceSnippet}
              onChange={(e) => setIssueSourceSnippet(e.target.value)}
              placeholder="Original English sentence..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Flagged Target Text</label>
            <textarea
              rows={2}
              value={issueTargetSnippet}
              onChange={(e) => setIssueTargetSnippet(e.target.value)}
              placeholder="Current translated target text containing error..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Suggested Correction</label>
            <textarea
              rows={2}
              value={issueSuggestedCorrection}
              onChange={(e) => setIssueSuggestedCorrection(e.target.value)}
              placeholder="Approved terminology correction..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewIssueModalOpen(false)}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!issueDescription.trim()}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Log Issue
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
