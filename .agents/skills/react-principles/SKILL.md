---
name: react-principles
description: Deterministic React 19 architecture constraints, Server Component boundaries, hook rules, state colocation, performance, accessibility, and TypeScript standards.
origin: sauron
department: frontend
---

# React Principles

Enforce modern React architecture constraints, rendering boundaries, hook rules, and accessibility baselines. Eliminate client bundle bloat, waterfall network fetches, and unhandled component state lifecycles.

## When to Activate

- Creating or modifying React components, custom hooks, or context providers.
- Structuring React Server Component and Client Component boundaries.
- Refactoring state management, form submissions, or rendering performance bottlenecks.
- Reviewing accessibility (a11y) semantics and DOM event handlers.

## Core Concepts

### 1. Component Architecture and Rendering Boundaries

- **Server Components Default:** All components must be React Server Components by default when operating within Server Component architectures (for example Next.js App Router).
- **Client Component Directive:** Place `'use client'` strictly at interactive leaf components. Use it only when the component fundamentally requires:
  - React state hooks (`useState`, `useReducer`, `useContext`, `useRef`).
  - React effect hooks (`useEffect`, `useLayoutEffect`).
  - DOM Event handlers (`onClick`, `onChange`, `onSubmit`).
  - Browser APIs (`window`, `document`, `localStorage`).
- **No Derivative State in `useEffect`:** Updating state derived from props or other state variables inside `useEffect` is strictly banned. Calculate derived values directly within the component body during rendering.
- **Component Granularity:** Keep components small, focused, and single-purpose. Extract complex presentation subtrees into dedicated sub-components, and pull reusable business workflows into custom hooks.
- **Props Serialization Across Boundaries:** Data passed across Server-to-Client boundaries must be strictly serializable (JSON primitives, plain objects, arrays). Passing functions, class instances, or Symbol objects across the boundary is strictly banned.

### 2. State Colocation and Data Fetching

- **State Colocation:** Keep state as close to where it is consumed as possible. Local UI state (such as modal visibility or dropdown toggles) must not be pushed into global state stores.
- **No `useEffect` Data Fetching:** Fetching data inside `useEffect` on component mount is strictly banned due to layout shifts and network waterfall cascades. Data must be fetched using Server Components, TanStack Query, or SWR.
- **React 19 Action Hooks:** Use React 19 native action hooks (`useActionState`, `useFormStatus`, `useOptimistic`) for form submissions, state transitions, and server action mutations in client components.
- **Context API Boundaries:** Wrap React Context providers closely around the subtree that consumes them rather than mounting all providers globally at the root layout.

### 3. Hook Mechanics and Rules of Hooks

- **Strict Rules of Hooks:** Hooks must only be called at the top level of React function components or custom hooks. Calling hooks inside loops, conditions, or nested functions is strictly banned.
- **Custom Hook Naming:** Custom hooks must begin with the `use` prefix (for example `useAuth`, `useLocalStorage`).
- **Effect Dependency Completeness:** Every variable from component scope used inside a `useEffect` must be explicitly declared in its dependency array. Omitting dependencies or suppressing linter rules is strictly banned.

### 4. Performance and Memory Management

- **Stable List Keys:** Always provide a stable, unique `key` prop when mapping arrays to JSX elements. Using array indices as `key` props for dynamic, filterable, or reorderable lists is strictly banned.
- **List Virtualization:** Render dynamic lists containing more than 100 items using virtualization libraries (`@tanstack/react-virtual` or `react-window`).
- **React Compiler and Memoization:** Trust the React Compiler for automated memoization where available. In non-compiler build setups, apply `React.memo`, `useMemo`, and `useCallback` explicitly around computational bottlenecks or memoized child trees.

### 5. Strict TypeScript Enforcement

- **No `any` Types:** All component props, state objects, event handlers, and hook return values must have explicit, non-`any` TypeScript types.
- **Component Props Naming and Extension:** Prop interfaces must be named `[ComponentName]Props`. Extend native HTML element attributes using `React.ComponentPropsWithoutRef<'button'>` to allow standard attributes.
- **Event Handler Typing:** Explicitly type DOM event handlers using React built-in event types (for example `React.ChangeEvent<HTMLInputElement>`, `React.FormEvent<HTMLFormElement>`).

### 6. Security and Accessibility (a11y)

- **Sanitize HTML Injection:** `dangerouslySetInnerHTML` is strictly banned unless the input is explicitly sanitized through DOMPurify or an equivalent security sanitizer.
- **Semantic HTML and ARIA:** Prefer native semantic HTML elements (`<button>`, `<nav>`, `<header>`, `<main>`) over generic `<div>` wrappers. Custom interactive elements must include explicit keyboard handlers (`onKeyDown`), `tabIndex={0}`, and proper WAI-ARIA roles.

## Code Examples

```tsx
import type { ComponentPropsWithoutRef } from "react";

// Correct Props Interface extending native element attributes
export interface PrimaryButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: "solid" | "outline";
  isLoading?: boolean;
}

export function PrimaryButton({
  children,
  variant = "solid",
  isLoading = false,
  disabled,
  className,
  ...restProps
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`px-4 py-2 rounded font-medium ${
        variant === "solid" ? "bg-blue-600 text-white" : "border border-blue-600 text-blue-600"
      } ${className ?? ""}`}
      {...restProps}
    >
      {isLoading ? "Processing..." : children}
    </button>
  );
}
```

## Anti-Patterns

- **AP-12 (Forgotten state lifecycle / Effect misuse):** Using `useEffect` to synchronize state with props or calculate values that could be derived directly during rendering.
- **AP-4 (Over-permissive client boundary):** Placing `'use client'` at root layout or page files, stripping all Server Component benefits.
- **Array Index as Key:** Writing `<li key={index}>` in dynamic lists, causing input focus bugs and state corruption during sorting or item deletion.
- **Unsanitized HTML:** Rendering untrusted user content via `dangerouslySetInnerHTML`.
- **Mount Data Fetching in `useEffect`:** Triggering raw `fetch()` on mount inside `useEffect`, causing waterfalls and layout shifts.

## Best Practices

- Fetch data on the server using Server Components or specialized data-fetching hooks.
- Colocate UI state within the component that renders it.
- Use semantic HTML tags with accessible ARIA attributes.

## Related Skills

- `nextjs-principles`
- `typescript-standards`
- `clean-architecture`
