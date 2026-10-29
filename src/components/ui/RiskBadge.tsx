import React from 'react';
import { RiskLevel } from '../../types';
import { AlertCircle, AlertTriangle, CheckCircle2, PauseCircle } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = '' }) => {
  switch (level) {
    case 'CRITICAL_OVERDUE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800 ${className}`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          Critical Overdue
        </span>
      );
    case 'AT_RISK':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800 ${className}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          At Risk
        </span>
      );
    case 'LOW_RISK':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 border border-blue-200 text-blue-800 ${className}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-blue-500" />
          Watchlist
        </span>
      );
    case 'HOLD':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 border border-slate-200 text-slate-800 ${className}`}
        >
          <PauseCircle className="w-3.5 h-3.5 text-slate-600" />
          On Hold
        </span>
      );
    case 'ON_TRACK':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          On Track
        </span>
      );
  }
};
