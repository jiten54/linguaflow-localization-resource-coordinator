import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { TranslationProject, OperationalSettings } from '../types';
import { api } from '../lib/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { RiskBadge } from '../components/ui/RiskBadge';
import { evaluateProjectRisk } from '../lib/riskEngine';

export const CalendarPage: React.FC = () => {
  const [projects, setProjects] = useState<TranslationProject[]>([]);
  const [settings, setSettings] = useState<OperationalSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // View state: 'month' | 'upcoming'
  const [viewMode, setViewMode] = useState<'month' | 'upcoming'>('month');

  // Month navigation (Defaults to Oct 2026 based on mock context)
  const [currentDate, setCurrentDate] = useState(new Date('2026-10-29T00:00:00Z'));

  useEffect(() => {
    Promise.all([api.getProjects(), api.getSettings()])
      .then(([p, s]) => {
        setProjects(p);
        setSettings(s);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const changeMonth = (offset: number) => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + offset);
    setCurrentDate(next);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d));
  }

  // Group projects by date
  const projectsByDay: Record<string, TranslationProject[]> = {};
  projects.forEach((p) => {
    const d = new Date(p.deliveryDeadline);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    if (!projectsByDay[dateKey]) projectsByDay[dateKey] = [];
    projectsByDay[dateKey].push(p);
  });

  // Upcoming projects sorted by deadline
  const upcomingProjects = [...projects].sort(
    (a, b) => new Date(a.deliveryDeadline).getTime() - new Date(b.deliveryDeadline).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            Deadline Monitoring &amp; Operational Calendar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track customer delivery milestones, evaluate deadline risks, and detect resource shortages.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              viewMode === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Month Grid
          </button>
          <button
            onClick={() => setViewMode('upcoming')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              viewMode === 'upcoming' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chronological Schedule
          </button>
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Month Header Controller */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-bold text-slate-900">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => changeMonth(1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-slate-600">Critical Overdue</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-600">At Risk (&lt;48h)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-600">On Track</span>
              </span>
            </div>
          </div>

          {/* Calendar Day Labels */}
          <div className="grid grid-cols-7 border-b border-slate-200 text-center py-2 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[500px]">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="bg-slate-50/40 p-2 min-h-24" />;
              }

              const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(
                day.getDate()
              ).padStart(2, '0')}`;
              const dayProjects = projectsByDay[dateKey] || [];
              const isToday = day.getDate() === 29 && day.getMonth() === 9 && day.getFullYear() === 2026;

              return (
                <div
                  key={dateKey}
                  className={`p-2 min-h-24 flex flex-col justify-between transition-colors ${
                    isToday ? 'bg-indigo-50/30' : 'bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-xs font-semibold ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center'
                          : 'text-slate-700'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {dayProjects.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">
                        {dayProjects.length} due
                      </span>
                    )}
                  </div>

                  {/* Project deadline pills */}
                  <div className="mt-1.5 space-y-1">
                    {dayProjects.map((p) => {
                      const isOverdue = p.riskStatus === 'CRITICAL_OVERDUE';
                      const isAtRisk = p.riskStatus === 'AT_RISK';

                      return (
                        <Link
                          key={p.id}
                          to={`/projects/${p.id}`}
                          className={`block p-1 rounded text-[10px] font-semibold truncate border transition-colors ${
                            isOverdue
                              ? 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
                              : isAtRisk
                              ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                          title={`${p.reference}: ${p.name} (${p.wordCount} words)`}
                        >
                          <span className="font-mono">{p.reference}:</span> {p.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Chronological View */}
      {viewMode === 'upcoming' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          {upcomingProjects.map((p) => {
            const deadline = new Date(p.deliveryDeadline);
            const risk = settings ? evaluateProjectRisk(p, settings) : null;

            return (
              <div
                key={p.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700 text-center font-mono shrink-0">
                    <span className="text-[10px] text-slate-400 block uppercase">
                      {deadline.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-base font-bold text-slate-900 leading-none">
                      {deadline.getDate()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600">{p.reference}</span>
                      <span className="text-slate-400 text-xs">·</span>
                      <span className="text-xs font-semibold text-slate-800">{p.clientName}</span>
                      <StatusBadge status={p.status} />
                      <RiskBadge level={p.riskStatus} />
                    </div>
                    <Link
                      to={`/projects/${p.id}`}
                      className="text-xs font-semibold text-slate-900 hover:text-indigo-600 block mt-0.5"
                    >
                      {p.name}
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-mono">
                      <span>{p.wordCount.toLocaleString()} words</span>
                      <span>·</span>
                      <span>Linguist: {p.assignedTranslatorName || 'Unassigned ⚠'}</span>
                      <span>·</span>
                      <span>Due: {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {risk && risk.reasons.length > 0 && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{risk.reasons[0]}</p>
                    )}
                  </div>
                </div>

                <Link
                  to={`/projects/${p.id}`}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold self-end sm:self-auto transition-colors"
                >
                  Manage Timeline
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
