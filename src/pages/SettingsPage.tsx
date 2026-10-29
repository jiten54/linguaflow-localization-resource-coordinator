import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { OperationalSettings } from '../types';
import { api } from '../lib/api';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<OperationalSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [resetMsg, setResetMsg] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setSaving(true);
      await api.updateSettings(settings);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 2500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm('Reset all projects, resources, and assignments back to initial seed data?')) {
      await api.resetDatabase();
      setResetMsg(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  if (!settings) {
    return <div className="py-20 text-center text-slate-400 text-xs">Loading operational settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-indigo-600" />
          Operational Settings &amp; Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tune throughput speed assumptions, deadline risk thresholds, and candidate matching engine weights.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Operational settings saved and applied across platform!</span>
        </div>
      )}

      {resetMsg && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-xs flex items-center gap-2 font-medium">
          <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
          <span>Database reset to initial demo seeds. Reloading workspace...</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Speed Assumptions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            1. Productivity &amp; Throughput Speed Defaults (WPH)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Translation Speed (Words Per Hour)
              </label>
              <input
                type="number"
                min={100}
                max={1000}
                value={settings.wordsPerHourTranslation}
                onChange={(e) =>
                  setSettings({ ...settings, wordsPerHourTranslation: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard industry baseline: 250 - 350 words/hour
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Linguistic Review Speed (Words Per Hour)
              </label>
              <input
                type="number"
                min={300}
                max={3000}
                value={settings.wordsPerHourReview}
                onChange={(e) =>
                  setSettings({ ...settings, wordsPerHourReview: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Proofreading &amp; verification: 800 - 1,200 words/hour
              </span>
            </div>
          </div>
        </div>

        {/* Risk Thresholds */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            2. Deadline Risk Escalation Thresholds
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Urgent Warning Window (Hours before deadline)
              </label>
              <input
                type="number"
                min={12}
                max={120}
                value={settings.urgentDeadlineThresholdHours}
                onChange={(e) =>
                  setSettings({ ...settings, urgentDeadlineThresholdHours: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Triggers &quot;At Risk&quot; status if resource remains unallocated (Default: 48h)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Critical Escalation Window (Hours before deadline)
              </label>
              <input
                type="number"
                min={6}
                max={48}
                value={settings.highRiskThresholdHours}
                onChange={(e) =>
                  setSettings({ ...settings, highRiskThresholdHours: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Flags urgent PM escalation when progress &lt; 60% (Default: 24h)
              </span>
            </div>
          </div>
        </div>

        {/* Matching Engine Weights */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              3. Transparent Matching Algorithm Scoring Weights
            </h2>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Total: {settings.weights.languagePair + settings.weights.specialty + settings.weights.capacity + settings.weights.quality}% (100% Target)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Language Pair Proficiency
              </label>
              <input
                type="number"
                value={settings.weights.languagePair}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    weights: { ...settings.weights, languagePair: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Native target / C2 mastery</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject-Matter Domain
              </label>
              <input
                type="number"
                value={settings.weights.specialty}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    weights: { ...settings.weights, specialty: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Medical / Legal / Software SME</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Workload Capacity Buffer
              </label>
              <input
                type="number"
                value={settings.weights.capacity}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    weights: { ...settings.weights, capacity: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Remaining daily words headroom</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Historical Quality Track Record
              </label>
              <input
                type="number"
                value={settings.weights.quality}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    weights: { ...settings.weights, quality: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">QA review scores &amp; on-time rate</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetDatabase}
            className="px-3.5 py-2 border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Database to Initial Seed</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
