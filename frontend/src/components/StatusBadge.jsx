import { CheckCircle2, ArrowDownRight, ArrowUpRight, HelpCircle } from 'lucide-react';

export default function StatusBadge({ status, className = '' }) {
  const normalized = (status || '').toLowerCase();

  if (normalized === 'within_range' || normalized.includes('within')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
        Within reported range
      </span>
    );
  }

  if (normalized === 'below_range' || normalized.includes('below') || normalized.includes('low')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
        <ArrowDownRight size={13} className="text-amber-600 shrink-0" />
        Below reference range
      </span>
    );
  }

  if (normalized === 'above_range' || normalized.includes('above') || normalized.includes('high')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 ${className}`}>
        <ArrowUpRight size={13} className="text-orange-600 shrink-0" />
        Above reference range
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
      <HelpCircle size={13} className="text-slate-500 shrink-0" />
      Unable to determine
    </span>
  );
}
