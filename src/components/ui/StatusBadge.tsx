import React from 'react';
import { ProjectStatus } from '../../types';

interface StatusBadgeProps {
  status: ProjectStatus | string;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; textClass: string; bgClass: string; dotClass: string }> = {
  REQUEST_RECEIVED: {
    label: 'Request Received',
    textClass: 'text-slate-700',
    bgClass: 'bg-slate-100 border-slate-200',
    dotClass: 'bg-slate-500',
  },
  FILE_PREPARATION: {
    label: 'File Preparation',
    textClass: 'text-indigo-700',
    bgClass: 'bg-indigo-50 border-indigo-200',
    dotClass: 'bg-indigo-600',
  },
  RESOURCE_ASSIGNMENT: {
    label: 'Resource Assignment',
    textClass: 'text-blue-700',
    bgClass: 'bg-blue-50 border-blue-200',
    dotClass: 'bg-blue-600',
  },
  TRANSLATION: {
    label: 'Translation',
    textClass: 'text-amber-700',
    bgClass: 'bg-amber-50 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  LINGUISTIC_REVIEW: {
    label: 'Linguistic Review',
    textClass: 'text-purple-700',
    bgClass: 'bg-purple-50 border-purple-200',
    dotClass: 'bg-purple-600',
  },
  QUALITY_ASSURANCE: {
    label: 'Quality Assurance',
    textClass: 'text-teal-700',
    bgClass: 'bg-teal-50 border-teal-200',
    dotClass: 'bg-teal-600',
  },
  DELIVERY: {
    label: 'Delivery In Progress',
    textClass: 'text-sky-700',
    bgClass: 'bg-sky-50 border-sky-200',
    dotClass: 'bg-sky-600',
  },
  COMPLETED: {
    label: 'Completed',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50 border-emerald-200',
    dotClass: 'bg-emerald-600',
  },
  ON_HOLD: {
    label: 'On Hold',
    textClass: 'text-rose-700',
    bgClass: 'bg-rose-50 border-rose-200',
    dotClass: 'bg-rose-600',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = STATUS_CONFIG[status] || {
    label: status.replace(/_/g, ' '),
    textClass: 'text-slate-700',
    bgClass: 'bg-slate-100 border-slate-200',
    dotClass: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium border ${config.bgClass} ${config.textClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
      {config.label}
    </span>
  );
};
