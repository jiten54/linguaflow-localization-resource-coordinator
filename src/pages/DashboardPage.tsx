import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  FileClock,
  UserPlus2,
  Languages,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Users2,
  Bug,
  TrendingUp,
  ArrowRight,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { TranslationProject, DashboardMetrics, QualityIssue, LinguisticResource } from '../types';
import { api } from '../lib/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { RiskBadge } from '../components/ui/RiskBadge';

const STATUS_COLORS: Record<string, string> = {
  REQUEST_RECEIVED: '#64748b',
  FILE_PREPARATION: '#6366f1',
  RESOURCE_ASSIGNMENT: '#2563eb',
  TRANSLATION: '#d97706',
  LINGUISTIC_REVIEW: '#9333ea',
  QUALITY_ASSURANCE: '#0d9488',
  DELIVERY: '#0284c7',
  COMPLETED: '#10b981',
  ON_HOLD: '#e11d48',
};

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [projects, setProjects] = useState<TranslationProject[]>([]);
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [resources, setResources] = useState<LinguisticResource[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClient, setSelectedClient] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [m, p, q, r] = await Promise.all([
        api.getDashboardMetrics(),
        api.getProjects(),
        api.getQualityIssues(),
        api.getResources(),
      ]);
      setMetrics(m);
      setProjects(p);
      setIssues(q);
      setResources(r);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered project list for charts & tasks
  const filteredProjects = projects.filter((p) => {
    if (selectedClient !== 'ALL' && p.clientId !== selectedClient) return false;
    if (selectedPriority !== 'ALL' && p.priority !== selectedPriority) return false;
    return true;
  });

  // Calculate status breakdown chart
  const statusCounts: Record<string, number> = {};
  filteredProjects.forEach((p) => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });

  const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.replace(/_/g, ' '),
    rawStatus: status,
    value: count,
  }));

  // Language demand calculation
  const languageDemand: Record<string, number> = {};
  filteredProjects.forEach((p) => {
    p.targetLanguages.forEach((t) => {
      const pair = `${p.sourceLanguage.split('-')[0]} → ${t.split('-')[0]}`;
      languageDemand[pair] = (languageDemand[pair] || 0) + p.wordCount;
    });
  });

  const languageChartData = Object.entries(languageDemand)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([pair, words]) => ({
      pair,
      words: Math.round(words / 1000), // in k words
    }));

  // Weekly throughput simulated trend
  const throughputTrend = [
    { week: 'W39', completed: 3, onTimeRate: 100 },
    { week: 'W40', completed: 5, onTimeRate: 98 },
    { week: 'W41', completed: 4, onTimeRate: 96 },
    { week: 'W42', completed: 7, onTimeRate: 100 },
    { week: 'W43 (Current)', completed: filteredProjects.filter((p) => p.status === 'COMPLETED').length, onTimeRate: 97.5 },
  ];

  // Operational Task Queue items
  const unassignedProjects = filteredProjects.filter(
    (p) => (p.status === 'RESOURCE_ASSIGNMENT' || p.status === 'REQUEST_RECEIVED') && !p.assignedTranslatorId
  );
  const pendingFilePrep = filteredProjects.filter((p) => p.status === 'FILE_PREPARATION');
  const atRiskOrOverdue = filteredProjects.filter(
    (p) => p.riskStatus === 'AT_RISK' || p.riskStatus === 'CRITICAL_OVERDUE'
  );
  const openQualityIssues = issues.filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Operations Command Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time localization throughput, resource allocation, and deadline monitoring.
          </p>
        </div>

        {/* Global Dashboard Filters */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Clients</option>
              <option value="cli-1">Novartis LifeSciences</option>
              <option value="cli-2">Spotify Tech</option>
              <option value="cli-3">Siemens Industrial</option>
              <option value="cli-4">Ubisoft Montreal</option>
              <option value="cli-5">European Central Bank</option>
              <option value="cli-6">BMW Group</option>
              <option value="cli-7">Freshworks SaaS</option>
              <option value="cli-8">Booking Holdings</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600 shadow-xs">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent Only</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards Grid (10 operational metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Active */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Active Projects</span>
            <FolderKanban className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics?.totalActiveProjects ?? 0}</span>
            <span className="text-[11px] text-slate-400">in portfolio</span>
          </div>
        </div>

        {/* Awaiting File Prep */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>File Preparation</span>
            <FileClock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics?.awaitingFilePrep ?? 0}</span>
            <span className="text-[11px] text-amber-600 font-medium">pending check</span>
          </div>
        </div>

        {/* Awaiting Resource Assignment */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Unassigned Work</span>
            <UserPlus2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics?.awaitingResourceAssignment ?? 0}</span>
            <span className="text-[11px] text-blue-600 font-medium">needs linguist</span>
          </div>
        </div>

        {/* In Translation */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>In Translation</span>
            <Languages className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics?.inTranslation ?? 0}</span>
            <span className="text-[11px] text-slate-400">active drafting</span>
          </div>
        </div>

        {/* Awaiting Linguistic Review */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>In Review / QA</span>
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics?.awaitingLinguisticReview ?? 0}</span>
            <span className="text-[11px] text-teal-600 font-medium">proofreading</span>
          </div>
        </div>

        {/* Approaching Deadlines */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Approaching Deadlines</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{metrics?.approachingDeadlines ?? 0}</span>
            <span className="text-[11px] text-slate-400">&lt; 48 hours</span>
          </div>
        </div>

        {/* Overdue Projects */}
        <div className="bg-white p-3.5 rounded-xl border border-rose-100 bg-rose-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-rose-700">
            <span className="font-semibold">Overdue Projects</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{metrics?.overdueProjects ?? 0}</span>
            <span className="text-[11px] text-rose-600 font-medium">action required</span>
          </div>
        </div>

        {/* On-Time Delivery Rate */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>On-Time Delivery</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{metrics?.onTimeDeliveryRate ?? 98}%</span>
            <span className="text-[11px] text-slate-400">historical SLA</span>
          </div>
        </div>

        {/* Available Resources */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Available Linguists</span>
            <Users2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics?.availableResourcesCount ?? 0}</span>
            <span className="text-[11px] text-slate-400">verified roster</span>
          </div>
        </div>

        {/* Open Quality Issues */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Open QA Issues</span>
            <Bug className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-orange-600">{metrics?.openQualityIssuesCount ?? 0}</span>
            <span className="text-[11px] text-slate-400">in triage</span>
          </div>
        </div>
      </div>

      {/* Operational Task Queue (High-Priority Coordination Items) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Coordinator Action Queue</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
              {unassignedProjects.length + pendingFilePrep.length + atRiskOrOverdue.length} Items Pending
            </span>
          </div>
          <Link
            to="/projects"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {/* Overdue or At-Risk Items */}
          {atRiskOrOverdue.slice(0, 3).map((proj) => (
            <div
              key={proj.id}
              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-600 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-900">{proj.reference}</span>
                    <span className="text-slate-400 text-xs">·</span>
                    <span className="text-xs font-semibold text-slate-800">{proj.clientName}</span>
                    <RiskBadge level={proj.riskStatus} />
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">{proj.name}</p>
                  <p className="text-[11px] text-rose-600 mt-1 font-mono">
                    Deadline: {new Date(proj.deliveryDeadline).toLocaleString()} ·{' '}
                    {proj.riskReason || 'Urgent attention required.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Link
                  to={`/projects/${proj.id}?tab=timeline`}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Manage Risk
                </Link>
              </div>
            </div>
          ))}

          {/* Unassigned Projects needing allocation */}
          {unassignedProjects.slice(0, 3).map((proj) => (
            <div
              key={proj.id}
              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-blue-50 border border-blue-200 text-blue-600 mt-0.5">
                  <UserPlus2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-900">{proj.reference}</span>
                    <span className="text-slate-400 text-xs">·</span>
                    <span className="text-xs font-semibold text-slate-800">{proj.clientName}</span>
                    <StatusBadge status={proj.status} />
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">{proj.name}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span>
                      {proj.sourceLanguage} → {proj.targetLanguages.join(', ')}
                    </span>
                    <span>·</span>
                    <span>{proj.wordCount.toLocaleString()} words</span>
                    <span>·</span>
                    <span>Domain: {proj.domain}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Link
                  to={`/projects/${proj.id}?tab=matching`}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Match Translator</span>
                </Link>
              </div>
            </div>
          ))}

          {/* Pending File Prep Projects */}
          {pendingFilePrep.slice(0, 2).map((proj) => (
            <div
              key={proj.id}
              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-600 mt-0.5">
                  <FileClock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-900">{proj.reference}</span>
                    <span className="text-slate-400 text-xs">·</span>
                    <span className="text-xs font-semibold text-slate-800">{proj.clientName}</span>
                    <StatusBadge status={proj.status} />
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">{proj.name}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {proj.fileCount} source files pending preparation checklist verification.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Link
                  to={`/projects/${proj.id}?tab=files`}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Inspect Files
                </Link>
              </div>
            </div>
          ))}

          {unassignedProjects.length === 0 && pendingFilePrep.length === 0 && atRiskOrOverdue.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              All projects are currently assigned and file preparation queues are clear.
            </div>
          )}
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Project Lifecycle Distribution</h3>
              <p className="text-xs text-slate-500 mt-0.5">Active portfolio volume segmented by workflow stage</p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500">
              {filteredProjects.length} projects
            </span>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} projects`, 'Count']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.rawStatus] || '#6366f1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Language Pair Demand */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Language Pair Volume (Word Count)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Top translation streams in current active projects</p>
            </div>
            <span className="text-xs font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Thousands of words
            </span>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={languageChartData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  dataKey="pair"
                  type="category"
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                  width={60}
                />
                <Tooltip
                  formatter={(val: any) => [`${val}k words`, 'Volume']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Bar dataKey="words" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Throughput & On-Time Delivery */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">On-Time Delivery Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Historical delivery performance against client SLA</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              98.2% Avg SLA
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={throughputTrend} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'On-Time SLA']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Line
                  type="monotone"
                  dataKey="onTimeRate"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Issue Categories */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Linguistic Quality Reviews</h3>
              <p className="text-xs text-slate-500 mt-0.5">Recent quality queries &amp; corrective resolutions</p>
            </div>
            <Link
              to="/quality"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              <span>Quality Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {issues.slice(0, 3).map((iss) => (
              <div
                key={iss.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-800">{iss.reference}</span>
                    <span className="text-slate-400">·</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                        iss.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : iss.severity === 'MAJOR'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {iss.severity}
                    </span>
                    <span className="text-slate-500">{iss.category.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-slate-700 font-medium mt-1 line-clamp-1">{iss.description}</p>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-medium ${
                    iss.status === 'RESOLVED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {iss.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
