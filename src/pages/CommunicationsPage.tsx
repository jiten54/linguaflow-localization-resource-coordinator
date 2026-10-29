import React, { useState, useEffect } from 'react';
import {
  MailCheck,
  Send,
  Copy,
  ChevronRight,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';
import { CommunicationDraft, TranslationProject } from '../types';
import { api } from '../lib/api';
import { COMMUNICATION_TEMPLATES, buildCommunicationDraft } from '../lib/communicationTemplates';

export const CommunicationsPage: React.FC = () => {
  const [projects, setProjects] = useState<TranslationProject[]>([]);
  const [communications, setCommunications] = useState<CommunicationDraft[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationDraft['templateType']>('NEW_TRANSLATOR_ASSIGNMENT');
  const [activeDraft, setActiveDraft] = useState<CommunicationDraft | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getProjects(), api.getCommunications()])
      .then(([projList, commList]) => {
        setProjects(projList);
        setCommunications(commList);
        if (projList.length > 0) {
          setSelectedProjectId(projList[0].id);
          const initialDraft = buildCommunicationDraft(
            'NEW_TRANSLATOR_ASSIGNMENT',
            projList[0],
            {
              name: projList[0].assignedTranslatorName || 'Dr. Sophie Lin',
              email: 'sophie.lin@linguaflow.com',
              role: 'TRANSLATOR',
            },
            projList[0].coordinatorName
          );
          setActiveDraft(initialDraft);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleProjectOrTemplateChange = (projId: string, tpl: CommunicationDraft['templateType']) => {
    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;
    setSelectedProjectId(projId);
    setSelectedTemplate(tpl);

    const recipient = {
      name: proj.assignedTranslatorName || 'Linguistic Specialist',
      email: 'linguist@linguaflow.com',
      role: 'TRANSLATOR' as const,
    };
    const draft = buildCommunicationDraft(tpl, proj, recipient, proj.coordinatorName);
    setActiveDraft(draft);
  };

  const handleCopy = () => {
    if (!activeDraft) return;
    const fullText = `Subject: ${activeDraft.subject}\n\n${activeDraft.body}`;
    navigator.clipboard.writeText(fullText);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const handleSaveSent = async () => {
    if (!activeDraft) return;
    try {
      const sent: CommunicationDraft = {
        ...activeDraft,
        status: 'SIMULATED_SENT',
        sentAt: new Date().toISOString(),
      };
      await api.saveCommunication(sent);
      const updated = await api.getCommunications();
      setCommunications(updated);
    } catch (err) {
      console.error('Save communication failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MailCheck className="w-5 h-5 text-indigo-600" />
            Project Communication Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate and dispatch standardized stakeholder memos, translator offers, and delivery notifications.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configuration Controls */}
        <div className="space-y-4">
          {/* Project Selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Select Translation Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectOrTemplateChange(e.target.value, selectedTemplate)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-900 font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.reference} — {p.clientName}
                </option>
              ))}
            </select>
          </div>

          {/* Template Selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
              Standardized Memos &amp; Templates
            </h3>
            <div className="space-y-1">
              {COMMUNICATION_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.type}
                  onClick={() => handleProjectOrTemplateChange(selectedProjectId, tpl.type)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                    selectedTemplate === tpl.type
                      ? 'border-indigo-600 bg-indigo-50 font-semibold text-indigo-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="truncate">{tpl.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Columns: Live Draft Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            {activeDraft ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                      Target Role: {activeDraft.recipientRole}
                    </span>
                    <span className="text-xs text-slate-500">{activeDraft.recipientName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>{copiedNotice ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
                    </button>

                    <button
                      onClick={handleSaveSent}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Log &amp; Mark Sent</span>
                    </button>
                  </div>
                </div>

                {/* Subject Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Subject</label>
                  <input
                    type="text"
                    value={activeDraft.subject}
                    onChange={(e) => setActiveDraft({ ...activeDraft, subject: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-medium"
                  />
                </div>

                {/* Body Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Message Body</label>
                  <textarea
                    rows={12}
                    value={activeDraft.body}
                    onChange={(e) => setActiveDraft({ ...activeDraft, body: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-slate-800 leading-relaxed"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Audit Policy: Communication records are retained for compliance verification.</span>
                  <span className="font-mono text-indigo-600 font-semibold">Simulated SMTP</span>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">
                Select a project and template to generate an editable communication draft.
              </div>
            )}
          </div>

          {/* Historical Communication Log */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                Recent Stakeholder Communication History ({communications.length})
              </h3>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {communications.map((c) => (
                <div key={c.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-indigo-600">{c.projectReference}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-slate-800">{c.subject}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        c.status === 'SIMULATED_SENT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>Recipient: {c.recipientName}</span>
                    <span>·</span>
                    <span>Logged: {new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
