import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  FolderKanban,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import { TranslationProject, ProjectStatus, Priority, DomainExpertise } from '../types';
import { api } from '../lib/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { RiskBadge } from '../components/ui/RiskBadge';

export const ProjectsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [projects, setProjects] = useState<TranslationProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [domainFilter, setDomainFilter] = useState('ALL');

  // Sorting
  const [sortBy, setSortBy] = useState<'deadline' | 'reference' | 'wordCount' | 'created'>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filtered = projects.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (clientFilter !== 'ALL' && p.clientId !== clientFilter) return false;
    if (priorityFilter !== 'ALL' && p.priority !== priorityFilter) return false;
    if (domainFilter !== 'ALL' && p.domain !== domainFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.assignedTranslatorName?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'deadline') {
      comparison = new Date(a.deliveryDeadline).getTime() - new Date(b.deliveryDeadline).getTime();
    } else if (sortBy === 'created') {
      comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'wordCount') {
      comparison = a.wordCount - b.wordCount;
    } else if (sortBy === 'reference') {
      comparison = a.reference.localeCompare(b.reference);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Paginated items
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-600" />
            Translation Projects Portfolio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage active localization lifecycles, resource allocations, and delivery schedules.
          </p>
        </div>

        <Link
          to="/projects/new"
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Translation Project</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search reference, client, title, linguist..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="REQUEST_RECEIVED">Request Received</option>
              <option value="FILE_PREPARATION">File Preparation</option>
              <option value="RESOURCE_ASSIGNMENT">Resource Assignment</option>
              <option value="TRANSLATION">Translation</option>
              <option value="LINGUISTIC_REVIEW">Linguistic Review</option>
              <option value="QUALITY_ASSURANCE">Quality Assurance</option>
              <option value="DELIVERY">Delivery</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>

          {/* Domain Filter */}
          <div>
            <select
              value={domainFilter}
              onChange={(e) => {
                setDomainFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
            >
              <option value="ALL">All Domains</option>
              <option value="MEDICAL">Medical &amp; Life Sciences</option>
              <option value="LEGAL">Legal &amp; Regulatory</option>
              <option value="SOFTWARE_LOCALIZATION">Software &amp; Mobile UI</option>
              <option value="MARKETING">Marketing &amp; Transcreation</option>
              <option value="FINANCE">Finance &amp; Banking</option>
              <option value="ENGINEERING">Engineering &amp; Hardware</option>
              <option value="GAMING">Gaming &amp; Lore</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Results Count & Active Filters Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <span className="font-semibold text-slate-800">{sorted.length}</span> matching projects
            {projects.length > sorted.length && ` (filtered from ${projects.length} total)`}
          </div>
          {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || domainFilter !== 'ALL' || search) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
                setDomainFilter('ALL');
                setCurrentPage(1);
              }}
              className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline text-xs"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Projects Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px] select-none">
                <th
                  onClick={() => toggleSort('reference')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>Reference / Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Languages &amp; Domain</th>
                <th
                  onClick={() => toggleSort('wordCount')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>Volume</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Resource</th>
                <th
                  onClick={() => toggleSort('deadline')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>Deadline &amp; Risk</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginated.map((p) => {
                const deadlineDate = new Date(p.deliveryDeadline);
                const isOverdue = p.riskStatus === 'CRITICAL_OVERDUE';

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Reference & Name */}
                    <td className="py-3 px-4 font-medium">
                      <Link
                        to={`/projects/${p.id}`}
                        className="font-mono text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline block"
                      >
                        {p.reference}
                      </Link>
                      <div className="text-slate-900 font-medium line-clamp-1 max-w-xs text-xs mt-0.5">
                        {p.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span
                          className={`font-semibold ${
                            p.priority === 'URGENT'
                              ? 'text-rose-600'
                              : p.priority === 'HIGH'
                              ? 'text-amber-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {p.priority}
                        </span>
                        <span>·</span>
                        <span>Coord: {p.coordinatorName}</span>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block text-xs">{p.clientName}</span>
                      <span className="text-[11px] text-slate-400">Req #{p.id.slice(-4)}</span>
                    </td>

                    {/* Languages & Domain */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 text-xs">
                        {p.sourceLanguage} → {p.targetLanguages.join(', ')}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{p.domain.replace(/_/g, ' ')}</div>
                    </td>

                    {/* Volume & Files */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-slate-900 text-xs">
                        {p.wordCount.toLocaleString()} words
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {p.fileCount} file(s) · ~{p.estimatedEffortHours}h effort
                      </div>
                    </td>

                    {/* Status & Progress */}
                    <td className="py-3 px-4">
                      <StatusBadge status={p.status} />
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${p.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{p.progressPercent}%</span>
                      </div>
                    </td>

                    {/* Assigned Linguist */}
                    <td className="py-3 px-4">
                      {p.assignedTranslatorName ? (
                        <div>
                          <div className="font-medium text-slate-800 text-xs">{p.assignedTranslatorName}</div>
                          {p.assignedReviewerName && (
                            <div className="text-[10px] text-slate-400">Rev: {p.assignedReviewerName}</div>
                          )}
                        </div>
                      ) : (
                        <Link
                          to={`/projects/${p.id}?tab=matching`}
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-semibold hover:underline"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Assign Linguist</span>
                        </Link>
                      )}
                    </td>

                    {/* Deadline & Risk */}
                    <td className="py-3 px-4">
                      <div className={`font-mono text-xs ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                        {deadlineDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="mt-1">
                        <RiskBadge level={p.riskStatus} />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/projects/${p.id}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Workspace</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No translation projects found matching the selected search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
