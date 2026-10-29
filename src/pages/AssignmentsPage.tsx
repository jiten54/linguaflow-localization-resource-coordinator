import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Assignment } from '../types';
import { api } from '../lib/api';

export const AssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await api.getAssignments();
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (asgId: string, progress: number) => {
    try {
      const newStatus = progress === 100 ? 'DELIVERED' : 'IN_PROGRESS';
      await api.updateAssignment(asgId, { progressPercent: progress, status: newStatus as any });
      loadAssignments();
    } catch (err) {
      console.error('Progress update failed:', err);
    }
  };

  const filtered = assignments.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        a.reference.toLowerCase().includes(q) ||
        a.projectName.toLowerCase().includes(q) ||
        a.resourceName.toLowerCase().includes(q) ||
        a.languagePair.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Linguistic Assignment &amp; Workload Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor active linguist allocations, track milestone delivery progress, and audit scheduling conflicts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
          <span>{assignments.length} total active allocations</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by assignment ref, project name, linguist..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DELIVERED">Delivered</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="OFFERED">Offered</option>
          </select>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Assignment Ref</th>
                <th className="py-3 px-4">Associated Project</th>
                <th className="py-3 px-4">Linguistic Specialist</th>
                <th className="py-3 px-4">Language Pair</th>
                <th className="py-3 px-4">Volume &amp; Effort</th>
                <th className="py-3 px-4">Progress &amp; Status</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4 text-right">Quick Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{a.reference}</td>

                  <td className="py-3 px-4 font-medium">
                    <Link
                      to={`/projects/${a.projectId}`}
                      className="text-slate-900 hover:text-indigo-600 line-clamp-1 max-w-xs font-semibold block"
                    >
                      {a.projectName}
                    </Link>
                    <span className="font-mono text-[10px] text-slate-400">{a.projectReference}</span>
                  </td>

                  <td className="py-3 px-4 font-medium">
                    <div className="text-slate-800">{a.resourceName}</div>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">{a.role}</span>
                  </td>

                  <td className="py-3 px-4 font-mono text-xs">{a.languagePair}</td>

                  <td className="py-3 px-4">
                    <span className="font-mono font-semibold text-slate-900 block">
                      {a.assignedWordCount.toLocaleString()} words
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">~{a.estimatedEffortHours}h</span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${a.progressPercent}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-slate-700">
                        {a.progressPercent}%
                      </span>
                    </div>
                    <span
                      className={`inline-block mt-1 text-[10px] font-mono px-2 py-0.2 rounded font-semibold ${
                        a.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {a.status.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-xs text-slate-700">
                    {new Date(a.expectedCompletionDate).toLocaleDateString()}
                    {a.conflictWarning && (
                      <span className="text-rose-600 text-[10px] block mt-0.5 font-sans font-medium">
                        ⚠ Capacity tight
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      {a.progressPercent < 100 && (
                        <button
                          onClick={() => handleUpdateProgress(a.id, Math.min(100, a.progressPercent + 25))}
                          className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded text-xs font-semibold transition-colors"
                          title="Record 25% milestone completion"
                        >
                          +25% Progress
                        </button>
                      )}
                      {a.progressPercent < 100 && (
                        <button
                          onClick={() => handleUpdateProgress(a.id, 100)}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold border border-emerald-200 transition-colors"
                          title="Mark work delivered"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
