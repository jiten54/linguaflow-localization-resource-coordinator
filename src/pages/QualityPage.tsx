import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Bug,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Filter,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { QualityIssue, TranslationProject } from '../types';
import { api } from '../lib/api';
import { Modal } from '../components/ui/Modal';

export const QualityPage: React.FC = () => {
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [projects, setProjects] = useState<TranslationProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // New Issue Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [category, setCategory] = useState<QualityIssue['category']>('TERMINOLOGY');
  const [severity, setSeverity] = useState<QualityIssue['severity']>('MAJOR');
  const [description, setDescription] = useState('');
  const [sourceSegment, setSourceSegment] = useState('');
  const [targetSegment, setTargetSegment] = useState('');
  const [suggestedCorrection, setSuggestedCorrection] = useState('');

  // Resolve Modal
  const [resolvingIssue, setResolvingIssue] = useState<QualityIssue | null>(null);
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [issList, projList] = await Promise.all([api.getQualityIssues(), api.getProjects()]);
      setIssues(issList);
      setProjects(projList);
      if (projList.length > 0) setProjectId(projList[0].id);
    } catch (err) {
      console.error('Failed to load QA data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj || !description.trim()) return;

    try {
      await api.createQualityIssue({
        projectId: proj.id,
        projectReference: proj.reference,
        projectName: proj.name,
        category,
        severity,
        description: description.trim(),
        sourceSegment: sourceSegment.trim(),
        targetSegment: targetSegment.trim(),
        suggestedCorrection: suggestedCorrection.trim(),
        reporterId: api.getCurrentUser().id,
        reporterName: api.getCurrentUser().name,
        assignedOwnerId: proj.assignedTranslatorId || 'res-1',
        assignedOwnerName: proj.assignedTranslatorName || 'Lead Linguist',
      });

      setIsModalOpen(false);
      setDescription('');
      setSourceSegment('');
      setTargetSegment('');
      setSuggestedCorrection('');
      loadData();
    } catch (err) {
      console.error('Failed to create quality issue:', err);
    }
  };

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIssue) return;
    try {
      await api.updateQualityIssue(resolvingIssue.id, {
        status: 'RESOLVED',
        correctiveAction: correctiveAction.trim(),
        resolutionNotes: resolutionNotes.trim() || 'Verified against project glossary.',
      });
      setResolvingIssue(null);
      setCorrectiveAction('');
      setResolutionNotes('');
      loadData();
    } catch (err) {
      console.error('Failed to resolve issue:', err);
    }
  };

  const filtered = issues.filter((i) => {
    if (statusFilter !== 'ALL' && i.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && i.severity !== severityFilter) return false;
    if (categoryFilter !== 'ALL' && i.category !== categoryFilter) return false;
    return true;
  });

  const openCount = issues.filter((i) => i.status === 'OPEN').length;
  const inProgressCount = issues.filter((i) => i.status === 'IN_PROGRESS').length;
  const resolvedCount = issues.filter((i) => i.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Linguistic Quality Assurance &amp; Issue Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit terminology compliance, track linguistic reviews, and manage corrective resolutions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Quality Defect</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Issues Logged</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">{issues.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-rose-600 font-semibold block">Open / Action Required</span>
          <span className="text-2xl font-bold text-rose-600 mt-1 block font-mono">{openCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-amber-600 font-semibold block">In Triage / Investigation</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block font-mono">{inProgressCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-emerald-600 font-semibold block">Resolved &amp; Closed</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block font-mono">{resolvedCount}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Only</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ACCEPTED_WITH_JUSTIFICATION">Accepted with Justification</option>
          </select>
        </div>

        <div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700 font-medium"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical (Blocks Delivery)</option>
            <option value="MAJOR">Major</option>
            <option value="MINOR">Minor</option>
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700 font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="TERMINOLOGY">Terminology</option>
            <option value="MISTRANSLATION">Mistranslation</option>
            <option value="GLOSSARY_NON_COMPLIANCE">Glossary Non-Compliance</option>
            <option value="FORMATTING">Formatting</option>
            <option value="GRAMMAR_STYLE">Grammar &amp; Style</option>
          </select>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filtered.map((iss) => (
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
                  Project:{' '}
                  <Link
                    to={`/projects/${iss.projectId}`}
                    className="font-semibold text-indigo-600 hover:underline"
                  >
                    {iss.projectReference} ({iss.projectName})
                  </Link>
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
                    onClick={() => {
                      setResolvingIssue(iss);
                      setCorrectiveAction(iss.suggestedCorrection || '');
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors"
                  >
                    Resolve...
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-800 font-medium">{iss.description}</p>

            {/* Segments */}
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
                    Target Error / Correction:
                  </span>
                  <p className="text-rose-700 mt-1">{iss.targetSegment}</p>
                  {iss.suggestedCorrection && (
                    <p className="text-emerald-700 mt-1 pt-1 border-t border-slate-200">
                      Approved: {iss.suggestedCorrection}
                    </p>
                  )}
                </div>
              </div>
            )}

            {iss.resolutionNotes && (
              <div className="p-2.5 bg-emerald-50/60 rounded border border-emerald-200 text-xs text-emerald-900">
                <span className="font-semibold block text-[11px]">Resolution Audit:</span>
                <p className="mt-0.5">{iss.resolutionNotes}</p>
                {iss.correctiveAction && (
                  <p className="mt-0.5 text-slate-600 font-mono text-[10px]">
                    Action: {iss.correctiveAction}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Reported by: {iss.reporterName}</span>
              <span>Assigned: {iss.assignedOwnerName}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Log New Quality Defect */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log New Quality Defect"
        description="Record terminology discrepancy or formatting error during linguistic review pass."
      >
        <form onSubmit={handleCreateIssue} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Associated Translation Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.reference} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
              >
                <option value="TERMINOLOGY">Terminology Inconsistency</option>
                <option value="MISTRANSLATION">Mistranslation / Accuracy</option>
                <option value="GLOSSARY_NON_COMPLIANCE">Glossary Non-Compliance</option>
                <option value="FORMATTING">Formatting / Length Overflow</option>
                <option value="GRAMMAR_STYLE">Grammar &amp; Style</option>
                <option value="OMISSION">Omission</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
              >
                <option value="CRITICAL">Critical (Blocks Delivery)</option>
                <option value="MAJOR">Major</option>
                <option value="MINOR">Minor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Defect Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Non-approved term used in Patient Leaflet..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Source Segment</label>
            <textarea
              rows={2}
              value={sourceSegment}
              onChange={(e) => setSourceSegment(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Flagged Target Text</label>
            <textarea
              rows={2}
              value={targetSegment}
              onChange={(e) => setTargetSegment(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Suggested Correction</label>
            <textarea
              rows={2}
              value={suggestedCorrection}
              onChange={(e) => setSuggestedCorrection(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!description.trim()}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Log Issue
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Resolve Defect */}
      {resolvingIssue && (
        <Modal
          isOpen={true}
          onClose={() => setResolvingIssue(null)}
          title={`Resolve Quality Issue: ${resolvingIssue.reference}`}
          description={`Record corrective action for project ${resolvingIssue.projectReference}`}
        >
          <form onSubmit={handleConfirmResolve} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corrective Action Applied <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                placeholder="e.g. Corrected translation in TM and updated all 3 target consent forms..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Verification Notes</label>
              <input
                type="text"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Verified against EMA oncology terminology guidelines."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResolvingIssue(null)}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!correctiveAction.trim()}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Confirm Resolution
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
