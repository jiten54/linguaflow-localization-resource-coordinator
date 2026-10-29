import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FolderPlus, ArrowLeft, Check, AlertCircle, FileText } from 'lucide-react';
import { Client, DomainExpertise, Priority, User } from '../types';
import { api } from '../lib/api';

const TARGET_LANG_OPTIONS = [
  { code: 'DE-DE', label: 'German (Germany)' },
  { code: 'FR-FR', label: 'French (France)' },
  { code: 'ES-ES', label: 'Spanish (Spain)' },
  { code: 'IT-IT', label: 'Italian (Italy)' },
  { code: 'JA-JP', label: 'Japanese (Japan)' },
  { code: 'ZH-CN', label: 'Chinese (Simplified)' },
  { code: 'AR', label: 'Arabic (Standard)' },
  { code: 'PT-BR', label: 'Portuguese (Brazil)' },
  { code: 'SV', label: 'Swedish' },
  { code: 'NL', label: 'Dutch' },
];

export const NewProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [coordinatorId, setCoordinatorId] = useState('');
  const [description, setDescription] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('EN-US');
  const [selectedTargets, setSelectedTargets] = useState<string[]>(['DE-DE']);
  const [domain, setDomain] = useState<DomainExpertise>('MEDICAL');
  const [wordCount, setWordCount] = useState(5000);
  const [fileCount, setFileCount] = useState(2);
  const [priority, setPriority] = useState<Priority>('HIGH');
  const [requestedStartDate, setRequestedStartDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [deliveryDeadline, setDeliveryDeadline] = useState(
    new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 16)
  );
  const [tmRequirement, setTmRequirement] = useState('');
  const [glossaryRequirement, setGlossaryRequirement] = useState('');
  const [customerInstructions, setCustomerInstructions] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    Promise.all([api.getClients(), api.getUsers()])
      .then(([clientList, userList]) => {
        setClients(clientList);
        if (clientList.length > 0) setClientId(clientList[0].id);

        const coords = userList.filter((u) => u.role === 'RESOURCE_COORDINATOR' || u.role === 'PROJECT_MANAGER');
        setCoordinators(coords);
        if (coords.length > 0) setCoordinatorId(coords[0].id);
      })
      .catch(console.error);
  }, []);

  // Update default TM / Glossary suggestions when client changes
  useEffect(() => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setTmRequirement(`${client.name} Master Central Translation Memory (85%+ Match Threshold)`);
      setGlossaryRequirement(`${client.name} Regulatory & Brand Standard Lexicon v2026`);
    }
  }, [clientId, clients]);

  const toggleTarget = (code: string) => {
    if (selectedTargets.includes(code)) {
      if (selectedTargets.length > 1) {
        setSelectedTargets(selectedTargets.filter((t) => t !== code));
      }
    } else {
      setSelectedTargets([...selectedTargets, code]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a descriptive translation project title.');
      return;
    }
    if (selectedTargets.length === 0) {
      setError('Please select at least one target delivery language.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const client = clients.find((c) => c.id === clientId);
      const coord = coordinators.find((u) => u.id === coordinatorId);

      const created = await api.createProject({
        name: name.trim(),
        clientId,
        clientName: client?.name || 'Enterprise Client',
        coordinatorId,
        coordinatorName: coord?.name || 'Elena Rostova',
        description: description.trim(),
        sourceLanguage,
        targetLanguages: selectedTargets,
        domain,
        wordCount: Number(wordCount),
        fileCount: Number(fileCount),
        priority,
        requestedStartDate: new Date(requestedStartDate).toISOString(),
        deliveryDeadline: new Date(deliveryDeadline).toISOString(),
        tmRequirement,
        glossaryRequirement,
        customerInstructions,
        internalNotes,
      });

      // Navigate directly into project detail workspace
      navigate(`/projects/${created.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create translation project record.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top breadcrumb & back */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects Portfolio</span>
        </Link>
        <span className="text-xs font-mono text-slate-400">Step 1 of 2: Intake Specification</span>
      </div>

      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FolderPlus className="w-5 h-5 text-indigo-600" />
          Create New Translation Project
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Log client request details, scope word counts, specify linguistic assets, and initialize the lifecycle.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Intake Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Core Project Details */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            1. Project Reference &amp; Client Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Title / Scope <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Oncology Phase III Clinical Protocol &amp; Consent Documentation"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client Organization <span className="text-rose-500">*</span>
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.industry})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Resource Coordinator <span className="text-rose-500">*</span>
              </label>
              <select
                value={coordinatorId}
                onChange={(e) => setCoordinatorId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
              >
                {coordinators.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Description &amp; Scope Overview
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of source material context, intended audience, and delivery packaging requirements."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Languages & Subject Domain */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            2. Language Pairs &amp; Subject-Matter Domain
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Source Language</label>
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-mono"
              >
                <option value="EN-US">English (US)</option>
                <option value="EN-GB">English (UK)</option>
                <option value="DE-DE">German (Germany)</option>
                <option value="FR-FR">French (France)</option>
                <option value="JA-JP">Japanese (Japan)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject-Matter Domain</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value as DomainExpertise)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-medium"
              >
                <option value="MEDICAL">Medical &amp; Life Sciences (EMA / FDA)</option>
                <option value="LEGAL">Legal &amp; Contractual Regulations</option>
                <option value="SOFTWARE_LOCALIZATION">Software, Cloud &amp; Mobile UI</option>
                <option value="MARKETING">Marketing &amp; Transcreation</option>
                <option value="FINANCE">Finance, Banking &amp; Regulatory</option>
                <option value="ENGINEERING">Industrial Automation &amp; Engineering</option>
                <option value="GAMING">Gaming &amp; Creative Media</option>
                <option value="GENERAL">General Technical</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Target Languages (Select all required target deliverables)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {TARGET_LANG_OPTIONS.map((lang) => {
                  const isChecked = selectedTargets.includes(lang.code);
                  return (
                    <button
                      type="button"
                      key={lang.code}
                      onClick={() => toggleTarget(lang.code)}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all ${
                        isChecked
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold'
                          : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{lang.label}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Word Count, Timeline & Priority */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            3. Volume, Effort Estimates &amp; Delivery Schedule
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Word Count
              </label>
              <input
                type="number"
                min={50}
                step={50}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                ~{Math.round((wordCount / 300) * 10) / 10} hours effort at 300 WPH
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Files</label>
              <input
                type="number"
                min={1}
                max={50}
                value={fileCount}
                onChange={(e) => setFileCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold text-slate-900"
              >
                <option value="URGENT">Urgent (Rush SLA)</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low / Standard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Deadline</label>
              <input
                type="datetime-local"
                value={deliveryDeadline}
                onChange={(e) => setDeliveryDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Linguistic Assets & Instructions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            4. Translation Memory, Termbase &amp; Customer Directives
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Translation Memory (TM) Package
              </label>
              <input
                type="text"
                value={tmRequirement}
                onChange={(e) => setTmRequirement(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Glossary / Terminology Lexicon
              </label>
              <input
                type="text"
                value={glossaryRequirement}
                onChange={(e) => setGlossaryRequirement(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer-Specific Translation Instructions
              </label>
              <textarea
                rows={2}
                value={customerInstructions}
                onChange={(e) => setCustomerInstructions(e.target.value)}
                placeholder="e.g. Tone of voice rules, untranslatable parameter tokens, maximum length limitations, or formal address forms."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Link
            to="/projects"
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{submitting ? 'Creating Project...' : 'Initialize Project & Proceed to Workspace'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
