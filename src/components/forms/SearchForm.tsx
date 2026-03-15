import { Search } from "lucide-react";

interface SearchFormProps {
  defaultValue?: string;
  placeholder?: string;
}

/**
 * Pure server component — submits via native HTML GET form.
 * No JavaScript required; works with or without hydration.
 */
export default function SearchForm({
  defaultValue = "",
  placeholder = "Search listings…",
}: SearchFormProps) {
  return (
    <form action="/search" method="get" role="search">
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-4 text-slate-400" aria-hidden="true">
          <Search className="h-5 w-5" />
        </span>
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-32 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition"
        />
        <button
          type="submit"
          className="absolute right-2 rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
        >
          Search
        </button>
      </div>
    </form>
  );
}
