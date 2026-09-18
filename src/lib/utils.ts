import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { EventStatus, TeamStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date | undefined) {
  if (!dateString) return 'TBD';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getStatusBadge(status: EventStatus) {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft', color: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
    case 'REGISTRATION_OPEN':
      return { label: 'Registration Open', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'REGISTRATION_CLOSED':
      return { label: 'Registration Closed', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'EVALUATION_READY':
      return { label: 'Evaluation Ready', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'EVALUATION_RUNNING':
      return { label: 'Evaluation Live', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'EVALUATION_COMPLETED':
      return { label: 'Evaluation Completed', color: 'bg-teal-50 text-teal-700 border-teal-200' };
    case 'RESULT_REVIEW':
      return { label: 'Result Review', color: 'bg-orange-50 text-orange-700 border-orange-200' };
    case 'RESULT_APPROVED':
      return { label: 'Result Approved', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
    case 'RESULT_PUBLISHED':
      return { label: 'Results Published', color: 'bg-green-600 text-white border-green-600' };
    case 'COMPLETED':
      return { label: 'Completed', color: 'bg-zinc-800 text-white border-zinc-800' };
    case 'ARCHIVED':
      return { label: 'Archived', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: status, color: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
  }
}

export function getTeamStatusBadge(status: TeamStatus) {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft', color: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
    case 'SUBMITTED':
      return { label: 'Pending Verification', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'NEEDS_CORRECTION':
      return { label: 'Correction Requested', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'APPROVED':
      return { label: 'Approved & Stalled', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'REJECTED':
      return { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200' };
    default:
      return { label: status, color: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
  }
}
