"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

export function CopyCitation({ citation }: { citation: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");

  async function copyCitation() {
    try {
      await navigator.clipboard.writeText(citation);
      setStatus("copied");
    } catch {
      setStatus("manual");
    }
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button type="button" onClick={copyCitation} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-control bg-white px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">
          <Copy aria-hidden="true" className="h-4 w-4" /> Copy citation
        </button>
        <p role="status" className="text-xs text-muted">
          {status === "copied" ? "Citation copied." : status === "manual" ? "Copy the citation from the text field below." : "Includes the source, dataset, and recorded retrieval times."}
        </p>
      </div>
      {status === "manual" && (
        <label className="mt-3 block text-xs font-semibold text-ink">
          Source citation
          <textarea readOnly value={citation} onFocus={(event) => event.currentTarget.select()} rows={4} className="mt-1.5 block w-full rounded-md border border-control bg-white p-3 text-sm font-normal leading-6 text-ink" />
        </label>
      )}
    </div>
  );
}
