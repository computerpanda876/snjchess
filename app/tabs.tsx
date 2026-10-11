"use client";
// A row of tabs that shows one panel at a time. This file runs in the browser
// (that is what "use client" means) because it has to react to clicks.

import { useState, type ReactNode } from "react";

export function Tabs({
  name,
  labels,
  panels,
  initial = 0,
}: {
  name: string; // read out by screen readers, e.g. "Seasons"
  labels: string[];
  panels: ReactNode[];
  initial?: number; // which tab is open at first
}) {
  const [active, setActive] = useState(initial);

  return (
    <div>
      <div role="tablist" aria-label={name} className="flex flex-wrap gap-x-7 gap-y-1 border-b border-line">
        {labels.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`-mb-px cursor-pointer border-b-2 py-3 font-semibold ${
              i === active ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{panels[active]}</div>
    </div>
  );
}
