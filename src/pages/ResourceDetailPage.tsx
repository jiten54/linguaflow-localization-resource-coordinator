import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  Briefcase,
  Layers,
  Award,
  Calendar,
} from 'lucide-react';
import { LinguisticResource, Assignment } from '../types';
import { api } from '../lib/api';

export const ResourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [resource, setResource] = useState<LinguisticResource | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([api.getResource(id), api.getAssignments()])
        .then(([res, asgList]) => {
          setResource(res);
          setAssignments(asgList.filter((a) => a.resourceId === res.id));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading || !resource) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        Loading linguist specialist profile...
      </div>
    );
  }

  const capacityUsedPercent = Math.min(
    100,
    Math.round((resource.currentWorkloadWords / resource.dailyCapacityWords) * 100)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top back */}
      <div>
        <Link
          to="/resources"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Resource Directory</span>
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{resource.displayName}</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
              {resource.resourceType}
            </span>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded font-semibold ${
                resource.qualificationStatus === 'VERIFIED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {resource.qualificationStatus}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {resource.location} ({resource.timeZone})
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {resource.workingHours}
            </span>
            <span>·</span>
            <span className="font-semibold text-emerald-600">
              Status: {resource.availabilityStatus}
            </span>
          </div>
        </div>

        {/* Rates & Volume Stats */}
        <div className="flex items-center gap-6 text-xs font-mono self-start md:self-auto bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div>
            <span className="text-slate-400 text-[10px] block">Standard Rate</span>
            <span className="font-bold text-slate-900 text-sm">€{resource.hourlyRateEur}/hr</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">Average Speed</span>
            <span className="font-bold text-slate-900 text-sm">{resource.wordsPerHourAvg} WPH</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">Historical QA</span>
            <span className="font-bold text-emerald-600 text-sm">{resource.qualityScore}%</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Language & Skills */}
        <div className="space-y-6">
          {/* Language Competencies */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Language Matrix &amp; Proficiencies
            </h2>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-100 flex justify-between">
                <span className="text-slate-500">Native Languages:</span>
                <span className="font-semibold text-slate-800">
                  {resource.nativeLanguages.join(', ')}
                </span>
              </div>

              {Object.entries(resource.proficiencies).map(([lang, prof]) => (
                <div
                  key={lang}
                  className="p-2.5 rounded bg-slate-50 border border-slate-100 flex justify-between"
                >
                  <span className="text-slate-500">Language {lang}:</span>
                  <span className="font-mono font-semibold text-indigo-700">{prof}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Qualified Translation Pairs:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {resource.languagePairs.map((pair, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold"
                  >
                    {pair.source} → {pair.target}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Subject-Matter Specialties */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Domain Expertise
            </h2>

            <div className="flex flex-wrap gap-1.5">
              {resource.specialties.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200 font-medium"
                >
                  {s.replace(/_/g, ' ')}
                </span>
              ))}
            </div>

            {/* Coordinator Internal Notes */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                Internal Coordinator Notes:
              </span>
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                {resource.internalNotes}
              </p>
            </div>
          </div>

          {/* Protected Contact Information */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center justify-between">
              <span>Authorized Contact</span>
              <span className="text-[10px] text-emerald-600">Access Granted</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-mono">{resource.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-mono">{resource.contactPhone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Workload & Assignment History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Capacity Utilization Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Workload &amp; Capacity Feasibility
            </h2>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Current Daily Allocation:</span>
                <span className="font-mono font-bold text-slate-900">
                  {resource.currentWorkloadWords.toLocaleString()} / {resource.dailyCapacityWords.toLocaleString()} words/day
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full ${
                    capacityUsedPercent > 80
                      ? 'bg-rose-500'
                      : capacityUsedPercent > 50
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${capacityUsedPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{capacityUsedPercent}% capacity committed</span>
                <span>
                  {Math.max(0, resource.dailyCapacityWords - resource.currentWorkloadWords).toLocaleString()} words available buffer
                </span>
              </div>
            </div>
          </div>

          {/* Active & Past Assignments */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                Assignment History ({assignments.length})
              </h2>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {assignments.map((asg) => (
                <div key={asg.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-semibold text-indigo-600">
                        {asg.reference}
                      </span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="font-semibold text-slate-800">{asg.projectName}</span>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        asg.status === 'DELIVERED' || asg.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {asg.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
                    <span>Role: {asg.role}</span>
                    <span>·</span>
                    <span>Volume: {asg.assignedWordCount.toLocaleString()} words</span>
                    <span>·</span>
                    <span>Due: {new Date(asg.expectedCompletionDate).toLocaleDateString()}</span>
                  </div>

                  {asg.notes && <p className="text-[11px] text-slate-600 mt-1">{asg.notes}</p>}
                </div>
              ))}

              {assignments.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No active assignments currently linked to this specialist.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
