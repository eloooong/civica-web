---
name: frontend-development
description: Framework-agnostic frontend engineering standards for component architecture, state colocation, Core Web Vitals performance, Error Boundaries, responsive layouts, and WCAG accessibility.
department: frontend
ownerAgent: legolas
triggerCommand: /frontend-development
antiPatternsPrevented:
  - AP-1
  - AP-4
  - AP-12
  - AP-18
  - AP-26
  - AP-28
---

# Frontend Development Principles

## 0. Identity

- **Role:** Principal Frontend Architect and User Experience Engineer. Governs client-side component architecture, state hierarchy colocation, Error Boundaries, Core Web Vitals optimization, responsive layout stability, and WCAG 2.2 accessibility.
- **Authority:** Normative tier-4 standard for frontend applications under `skills/frontend/frontend-development/`.
- **Must not define:** Backend database migrations or server persistence logic.
- **Normative base:** `core/fellowship/legolas.md`, `rules/engineering/architecture-boundaries.md`, `rules/common/code-style-standards.md`, `references/anti-patterns.md`.
- **Anti-pattern gate:** Blocks AP-1 (unbounded client state), AP-12 (forgotten lifecycle management), and AP-26 (leaking backend driver errors into client UI).

## 1. Intent (9 Dimensions)

| #   | Dimension        | Value                                                                                                       |
| --- | ---------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | Task             | Architect, implement, and review production-grade client-side user interfaces and state hierarchies.        |
| 2   | Target Tool      | React 19, Next.js App Router, Vue 3, Svelte 5, Tailwind CSS, TanStack Virtual, Web Vitals.                  |
| 3   | Output Format    | Modular component architectures, typed custom hooks, and responsive accessible layout templates.            |
| 4   | Constraints      | Mandatory four-state UI handling (Loading, Success, Empty, Error). Zero unhandled Error Boundaries.         |
| 5   | Input            | User experience designs, wireframes, REST/GraphQL API contracts, accessibility requirements.                |
| 6   | Context          | Prevents layout thrashing, component cascade re-renders, unresponsive interactions, and accessibility gaps. |
| 7   | Audience         | Frontend developers, UI/UX engineers, full-stack developers, design systems leads.                          |
| 8   | Success Criteria | 100 percent WCAG 2.2 Level AA compliance; zero Cumulative Layout Shift; sub-100ms INP response times.       |
| 9   | Examples         | See Section 5.                                                                                              |

## 2. Trigger Matrix

| Trigger Condition                                              | Fire? | Action / Route                                                   |
| -------------------------------------------------------------- | ----- | ---------------------------------------------------------------- |
| Designing new client-side UI components or state management    | YES   | Enforce state colocation and four-state boundary resilience.     |
| Optimizing Core Web Vitals (LCP, CLS, INP)                     | YES   | Apply explicit media dimensions and non-blocking event handlers. |
| Authoring React-specific hooks and Server Component boundaries | NO    | Route to `skills/frontend/react-principles/`.                    |
| Writing backend route controllers or database queries          | NO    | Route to `skills/backend/backend-development/`.                  |

## 3. Core Architectural Directives

1. **Four-State UI Resilience:** Every asynchronous data boundary must explicitly handle four distinct states:
   - **Loading:** Render lightweight skeleton loaders matching layout geometry to prevent CLS.
   - **Success:** Render validated payload data.
   - **Empty:** Display an actionable empty-state message with clear next steps.
   - **Error:** Present user-friendly error copy with retry actions wrapped inside an Error Boundary.
2. **State Colocation Hierarchy:** Colocate state as close to its point of use as possible.
   - **Local UI State:** Component toggles, dropdown active states, form inputs.
   - **URL State:** Search queries, pagination offsets, active tab keys (kept in URL query strings for shareability).
   - **Server State:** Cached API responses (managed via TanStack Query or Server Components).
3. **Core Web Vitals Discipline:**
   - **CLS (Cumulative Layout Shift):** Always set explicit `width`, `height`, or CSS `aspect-ratio` on images, videos, and iframe containers.
   - **LCP (Largest Contentful Paint):** Preload above-the-fold hero images. Eliminate render-blocking client scripts.
   - **INP (Interaction to Next Paint):** Keep click and input handlers lean. Defer non-critical compute using `startTransition` or Web Workers.
4. **WCAG 2.2 Level AA Accessibility:**
   - Use native semantic elements (`<main>`, `<nav>`, `<article>`, `<button>`). Never use `div` click handlers.
   - Interactive targets must meet the minimum 24 by 24 CSS pixel bounding box requirement (44 by 44 CSS pixels for Level AAA).
   - Enforce visible `:focus-visible` outlines and support `prefers-reduced-motion` media queries.

## 4. Execution Workflow

### Step 1: Semantic Component Breakdown

- **Action:** Decompose design into atomic presentation components and container orchestration layers.
- **Stop Condition:** Halt if presentation components attempt direct database or low-level network operations.
- **Validation:** Clear props interface defined without type escapes.

### Step 2: State Placement & URL Binding

- **Action:** Bind shareable filter, search, and page variables directly to URL search parameters.
- **Validation:** Reloading page preserves active filter and view state.

### Step 3: Degraded State & Error Boundary Wiring

- **Action:** Implement loading skeleton and wrap asynchronous component in an Error Boundary.
- **Validation:** Component network failure triggers localized error fallback without crashing adjacent page layout.

## 5. Reference Implementation

### TypeScript & React (Resilient Four-State Container Component Pattern)

```tsx
import React, { useState, useEffect } from "react";

export interface Item {
  readonly id: string;
  readonly name: string;
}

export interface ItemListProps {
  readonly fetchItems: () => Promise<Item[]>;
}

export function ItemList({ fetchItems }: ItemListProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<
    "IDLE" | "LOADING" | "SUCCESS" | "ERROR"
  >("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadData() {
    setStatus("LOADING");
    setErrorMessage(null);
    try {
      const data = await fetchItems();
      setItems(data);
      setStatus("SUCCESS");
    } catch (err) {
      setErrorMessage("Unable to retrieve items. Please try again.");
      setStatus("ERROR");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (status === "LOADING") {
    return (
      <div className="space-y-3" role="status" aria-label="Loading items">
        <div className="h-6 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-6 w-1/2 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  if (status === "ERROR") {
    return (
      <div
        className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800"
        role="alert"
      >
        <p className="font-medium">{errorMessage}</p>
        <button
          type="button"
          onClick={loadData}
          className="mt-2 rounded bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (status === "SUCCESS" && items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-8 text-center text-slate-500">
        <p className="font-medium">No items found.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-200">
      {items.map((item) => (
        <li key={item.id} className="py-2 text-slate-900">
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```

## 6. Validation Gate

Run before accepting frontend pull requests:

- [ ] All asynchronous components implement Loading, Success, Empty, and Error states.
- [ ] Media elements declare explicit dimensions or CSS aspect ratios to prevent CLS.
- [ ] Interactive elements feature visible `:focus-visible` focus rings.
- [ ] Shareable filter and pagination parameters are bound to URL query state.
- [ ] Error boundaries wrap critical component sub-trees to isolate runtime failures.

## 7. Versioning & Portability Matrix

- **Version:** 2.0.0
- **Changelog:**
  - `2.0.0` (2026-09-20): Elevated to Sauron Tier-5 specification with four-state resilience and Core Web Vitals patterns.

| Runtime / Harness | Status   | Notes                                    |
| ----------------- | -------- | ---------------------------------------- |
| Claude Code       | verified | Fully supported via command integration. |
| Cursor            | verified | Compatible with editor rule context.     |
| Windsurf          | verified | Fully functional.                        |
| Antigravity       | verified | Certified.                               |
