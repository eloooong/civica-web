"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";

const MIN_QUERY_LENGTH = 2;

export function SearchBar({
  defaultValue = "",
  placeholder = "Search budgets, bills, datasets…",
  id = "site-search",
  size = "md",
  hideLabel = false,
}: {
  defaultValue?: string;
  placeholder?: string;
  id?: string;
  size?: "md" | "lg";
  hideLabel?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (window.location.hash !== `#${id}`) return;
    // The route transition mounts this field after Next's fragment handler.
    const frame = requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [id]);
  const [value, setValue] = useState(defaultValue);
  const trimmed = value.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_QUERY_LENGTH;
  const hintId = `${id}-hint`;

  return (
    <form
      role="search"
      aria-label="Site search"
      aria-busy={pending}
      action="/search"
      method="get"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (tooShort) return;
        startTransition(() => router.push(`/search?q=${encodeURIComponent(trimmed)}`));
      }}
    >
      <label
        htmlFor={id}
        className={size === "lg" && !hideLabel ? "mb-2 block text-sm font-semibold text-white" : "sr-only"}
      >
        Search government data
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
        />
        <input
          ref={inputRef}
          id={id}
          name="q"
          type="search"
          minLength={MIN_QUERY_LENGTH}
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-invalid={tooShort || undefined}
          aria-describedby={tooShort ? hintId : undefined}
          className={`${
            size === "lg"
              ? "w-full rounded-lg py-4 pl-11 pr-28 text-base shadow-sm"
              : "min-h-12 w-full rounded-lg py-3 pl-10 pr-28 text-base"
          } border bg-white text-ink placeholder:text-muted focus:border-brand-600 ${
            tooShort ? "border-accent-600" : "border-control"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className={
            size === "lg"
              ? "absolute right-2 top-1/2 h-11 -translate-y-1/2 rounded-md bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-wait disabled:opacity-75"
              : "absolute right-1 top-1/2 min-h-11 -translate-y-1/2 rounded-md bg-brand-700 px-3.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-wait disabled:opacity-75"
          }
        >
          {pending ? "Searching…" : "Search"}
        </button>
      </div>
      <p role="status" className="sr-only">{pending ? "Searching public records" : ""}</p>
      {tooShort && (
        <p
          id={hintId}
          className={`mt-1.5 text-xs font-medium ${
            size === "lg" ? "text-amber-300" : "text-accent-600"
          }`}
        >
          Type {MIN_QUERY_LENGTH} or more characters to search.
        </p>
      )}
    </form>
  );
}
