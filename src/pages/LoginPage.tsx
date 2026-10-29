import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe2, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { api } from '../lib/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    api.getUsers().then(setUsers).catch(console.error);
  }, []);

  const handleSelectUser = (user: User) => {
    api.setCurrentUser(user);
    navigate('/dashboard');
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = users.find((u) => u.email.toLowerCase() === emailInput.trim().toLowerCase()) || users[0];
    api.setCurrentUser(found);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-500/30">
            <Globe2 className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">LinguaFlow</h1>
          <p className="text-xs text-slate-400">
            Localization Project &amp; Resource Coordination Platform
          </p>
        </div>

        {/* Demo Fast-Login Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono uppercase tracking-wider">
            <span>Instant Demo Persona Sign-In</span>
            <span className="text-indigo-400 font-semibold">1-Click</span>
          </div>

          <div className="space-y-2">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => handleSelectUser(u)}
                className="w-full p-3 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800/80 hover:border-indigo-500/50 transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-xs text-white group-hover:text-indigo-300 transition-colors">
                    {u.name}
                  </div>
                  <div className="text-[11px] text-slate-400">{u.title}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {u.role.replace(/_/g, ' ')}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Email sign in */}
        <div className="pt-4 border-t border-slate-800/80">
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-400">
              Or sign in with corporate email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="elena.rostova@linguaflow.com"
                className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-white placeholder-slate-500"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="pt-2 text-center text-[11px] text-slate-500">
          Associate Resource Coordinator (RWS) Portfolio Simulation
        </div>
      </div>
    </div>
  );
};
