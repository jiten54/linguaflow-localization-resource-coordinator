import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, CheckCircle2, UserPlus, RefreshCw, Key } from 'lucide-react';
import { User } from '../types';
import { api } from '../lib/api';

export const UsersSettingsPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(api.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

  const handleSwitch = (u: User) => {
    api.setCurrentUser(u);
    setCurrentUser(u);
    window.location.reload();
  };

  const permissions = [
    {
      feature: 'Create & Update Projects',
      coordinator: true,
      pm: true,
      linguist: false,
    },
    {
      feature: 'Run Matching Engine & Allocate Resources',
      coordinator: true,
      pm: true,
      linguist: false,
    },
    {
      feature: 'Upload & Verify Source Files (TXT/CSV)',
      coordinator: true,
      pm: true,
      linguist: false,
    },
    {
      feature: 'Authorize Exception Overrides & Hold Status',
      coordinator: true,
      pm: true,
      linguist: false,
    },
    {
      feature: 'Update Milestone Delivery Progress',
      coordinator: true,
      pm: true,
      linguist: true,
    },
    {
      feature: 'Log & Resolve Linguistic QA Issues',
      coordinator: true,
      pm: true,
      linguist: true,
    },
    {
      feature: 'Draft & Send Stakeholder Communications',
      coordinator: true,
      pm: true,
      linguist: false,
    },
    {
      feature: 'Access Protected Contact Details (Phone/Email)',
      coordinator: true,
      pm: true,
      linguist: false,
    },
    {
      feature: 'Configure Operational Speeds & WPH Settings',
      coordinator: true,
      pm: true,
      linguist: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-indigo-600" />
          User Directory &amp; Role-Based Access Control (RBAC)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Simulate coordinator, project manager, and linguistic specialist roles across the localization lifecycle.
        </p>
      </div>

      {/* Active User Callout */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-mono text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">
            Currently Authenticated
          </span>
          <div className="font-bold text-slate-900 text-sm mt-0.5">{currentUser.name}</div>
          <div className="text-slate-600 mt-0.5">
            {currentUser.title} · Role: <strong>{currentUser.role.replace(/_/g, ' ')}</strong>
          </div>
        </div>

        <div className="text-slate-500 text-[11px]">
          Click &quot;Switch to this User&quot; on any profile below to test permissions.
        </div>
      </div>

      {/* Users Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => {
          const isActive = u.id === currentUser.id;

          return (
            <div
              key={u.id}
              className={`bg-white rounded-xl p-5 border shadow-xs transition-all flex flex-col justify-between ${
                isActive ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{u.name}</h3>
                    <div className="text-xs text-indigo-600 font-medium">{u.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{u.department}</div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      u.role === 'RESOURCE_COORDINATOR'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : u.role === 'PROJECT_MANAGER'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {u.role.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="py-3 space-y-1 text-xs text-slate-600 font-mono">
                  <div>Email: {u.email}</div>
                  <div>Phone: {u.phone}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-2">
                {isActive ? (
                  <span className="w-full py-1.5 bg-emerald-50 text-emerald-700 rounded text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active Session</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleSwitch(u)}
                    className="w-full py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded text-xs font-semibold transition-colors"
                  >
                    Switch to this User
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            Role Permissions Matrix
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Feature / Operation</th>
                <th className="py-3 px-4 text-center">Resource Coordinator</th>
                <th className="py-3 px-4 text-center">Project Manager</th>
                <th className="py-3 px-4 text-center">Linguistic Specialist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {permissions.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-medium text-slate-800">{p.feature}</td>
                  <td className="py-2.5 px-4 text-center">
                    {p.coordinator ? (
                      <span className="text-emerald-600 font-bold">✓ Granted</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {p.pm ? (
                      <span className="text-emerald-600 font-bold">✓ Granted</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {p.linguist ? (
                      <span className="text-emerald-600 font-bold">✓ Granted</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
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
