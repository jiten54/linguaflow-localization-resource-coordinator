import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { LinguisticResource, DomainExpertise } from '../types';
import { api } from '../lib/api';

export const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<LinguisticResource[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [targetLangFilter, setTargetLangFilter] = useState('ALL');

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await api.getResources();
      setResources(data);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = resources.filter((r) => {
    if (specialtyFilter !== 'ALL' && !r.specialties.includes(specialtyFilter as any)) return false;
    if (availabilityFilter !== 'ALL' && r.availabilityStatus !== availabilityFilter) return false;
    if (targetLangFilter !== 'ALL') {
      const hasTarget = r.languagePairs.some((p) => p.target.startsWith(targetLangFilter));
      if (!hasTarget) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const match =
        r.displayName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.nativeLanguages.some((n) => n.toLowerCase().includes(q));
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
            <Users className="w-5 h-5 text-indigo-600" />
            Linguistic Resource Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified external translator network, subject-matter SMEs, daily capacity tracking, and quality metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
          <span>Roster: {resources.length} verified specialists</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, location, language..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Target Language Filter */}
          <div>
            <select
              value={targetLangFilter}
              onChange={(e) => setTargetLangFilter(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
            >
              <option value="ALL">All Target Languages</option>
              <option value="DE">German (DE)</option>
              <option value="FR">French (FR)</option>
              <option value="ES">Spanish (ES)</option>
              <option value="IT">Italian (IT)</option>
              <option value="JA">Japanese (JA)</option>
              <option value="ZH">Chinese (ZH)</option>
              <option value="AR">Arabic (AR)</option>
              <option value="PT">Portuguese (PT)</option>
            </select>
          </div>

          {/* Specialty Filter */}
          <div>
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
            >
              <option value="ALL">All Domains &amp; Specialties</option>
              <option value="MEDICAL">Medical &amp; Life Sciences</option>
              <option value="LEGAL">Legal &amp; Contracts</option>
              <option value="SOFTWARE_LOCALIZATION">Software &amp; Mobile UI</option>
              <option value="MARKETING">Marketing &amp; Transcreation</option>
              <option value="FINANCE">Finance &amp; Banking</option>
              <option value="ENGINEERING">Engineering &amp; Technical</option>
              <option value="GAMING">Gaming &amp; Dialogue</option>
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
            >
              <option value="ALL">All Availability Statuses</option>
              <option value="AVAILABLE">Available Now</option>
              <option value="BUSY">Near Capacity / Busy</option>
              <option value="UNAVAILABLE">Unavailable / Sabbatical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => {
          const capacityUsedPercent = Math.min(
            100,
            Math.round((r.currentWorkloadWords / r.dailyCapacityWords) * 100)
          );

          return (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/resources/${r.id}`}
                        className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors"
                      >
                        {r.displayName}
                      </Link>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {r.resourceType}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>{r.location}</span>
                      <span>·</span>
                      <span>{r.timeZone}</span>
                    </div>
                  </div>

                  {/* Qualification Badge */}
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      r.qualificationStatus === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : r.qualificationStatus === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {r.qualificationStatus}
                  </span>
                </div>

                {/* Language Pairs & Native Language */}
                <div className="py-3 space-y-1.5 text-xs border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Native:</span>
                    <span className="font-semibold text-slate-800">
                      {r.nativeLanguages.join(', ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Language Pairs:</span>
                    <span className="font-mono text-slate-800 font-medium truncate max-w-[180px]">
                      {r.languagePairs.map((p) => `${p.source}→${p.target}`).join(', ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Specialties:</span>
                    <span className="text-slate-700 font-medium truncate max-w-[180px]">
                      {r.specialties.map((s) => s.replace(/_/g, ' ')).join(', ')}
                    </span>
                  </div>
                </div>

                {/* Capacity & Workload Meter */}
                <div className="py-3 border-b border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Daily Workload Allocation</span>
                    <span className="font-mono text-[11px] font-semibold text-slate-800">
                      {r.currentWorkloadWords.toLocaleString()} / {r.dailyCapacityWords.toLocaleString()} words
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        capacityUsedPercent > 80
                          ? 'bg-rose-500'
                          : capacityUsedPercent > 50
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${capacityUsedPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{capacityUsedPercent}% utilized</span>
                    <span>
                      {Math.max(0, r.dailyCapacityWords - r.currentWorkloadWords).toLocaleString()} w/day free
                    </span>
                  </div>
                </div>

                {/* Quality & On-time stats */}
                <div className="py-2 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">QA Rating</span>
                    <span className="font-bold text-emerald-600">{r.qualityScore}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">On-Time SLA</span>
                    <span className="font-bold text-slate-800">{r.onTimeDeliveryRate}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Projects</span>
                    <span className="font-bold text-slate-800">{r.completedProjectsCount}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
                <span className="text-xs font-mono text-slate-500">
                  €{r.hourlyRateEur}/hr · {r.wordsPerHourAvg} WPH
                </span>

                <Link
                  to={`/resources/${r.id}`}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <span>Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
