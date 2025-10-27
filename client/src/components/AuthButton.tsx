import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "../lib/api";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export const AuthButton = () => {
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: fetchMe });

  if (!user) {
    return (
      <a
        href={`${API_BASE}/api/auth/google`}
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200"
      >
        Continue with Google
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-full border border-slate-300 px-3 py-2 text-sm dark:border-slate-700">
      {user.picture ? (
        <img src={user.picture} alt={user.name} className="h-6 w-6 rounded-full" />
      ) : (
        <div className="h-6 w-6 rounded-full bg-brand/20" />
      )}
      <span className="text-slate-800 dark:text-slate-200">{user.name}</span>
    </div>
  );
};
