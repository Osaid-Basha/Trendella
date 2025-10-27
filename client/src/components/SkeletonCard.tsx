export const SkeletonCard = () => {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 h-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="mb-2 h-4 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mb-4 h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="flex gap-2">
        <div className="h-8 flex-1 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-8 flex-1 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
};
