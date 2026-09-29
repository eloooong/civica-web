"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function SearchBar({
  defaultValue = "",
  placeholder = "Search budgets, bills, datasets…",
  id = "site-search",
  size = "md",
}: {
  defaultValue?: string;
  placeholder?: string;
  id?: string;
  size?: "md" | "lg";
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      role="search"
      aria-label="Site search"
      action="/search"
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/search?q=${encodeURIComponent(value.trim())}`);
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search government data
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
        />
        <input
          id={id}
          name="q"
          type="search"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className={
            size === "lg"
              ? "w-full rounded-lg border border-line bg-white py-4 pl-11 pr-28 text-base text-ink shadow-sm placeholder:text-muted focus:border-brand-600"
              : "w-full rounded-lg border border-line bg-white py-2.5 pl-10 pr-24 text-sm text-ink shadow-sm placeholder:text-muted focus:border-brand-600"
          }
        />
        <button
          type="submit"
          className={
            size === "lg"
              ? "absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
              : "absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-brand-700 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand-800"
          }
        >
          Search
        </button>
      </div>
    </form>
  );
}
