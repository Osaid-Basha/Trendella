import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
    <span className="text-4xl" role="img" aria-hidden="true">
      🎀
    </span>
    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
    <p className="max-w-md text-sm leading-relaxed">{description}</p>
    {action}
  </div>
);
