---
name: nextjs-principles
description: Next.js App Router and React 19 architecture constraints, Server Components default, caching, Server Actions security, and Turbopack optimization.
origin: sauron
department: frontend
---

# Next.js Principles

Architect high-performance web applications using the Next.js App Router and React 19. Maximize server-side data execution, optimize client bundle weight, enforce Server Action authorization, and eliminate client data-fetching waterfalls.

## When to Activate

- Creating or modifying files inside the `app/` directory (`layout.tsx`, `page.tsx`, `route.ts`, `loading.tsx`, `error.tsx`).
- Implementing data fetching, dynamic caching, Server Actions, or Route Handlers.
- Structuring server and client component boundaries or configuring Turbopack builds.
- Reviewing SEO metadata, font optimization, and secret environment variable isolation.

## Core Concepts

### 1. Component Architecture and Rendering Boundaries

- **Server Components Default:** All components must be React Server Components by default.
- **Client Component Constraints:** The `'use client'` directive is strictly regulated. Use it only if the component fundamentally requires:
  - React hooks (`useState`, `useEffect`, `useReducer`, `useContext`, `useRef`).
  - Browser APIs (for example `window`, `document`, `navigator`, `localStorage`).
  - DOM Event listeners (for example `onClick`, `onChange`).
- **File Structure:** All Next.js projects must use the App Router (`app/` directory). The legacy Pages router (`pages/`) is strictly banned for new features.
- **Feature-First Architecture:** Place all code inside a `src/` directory. Group code by feature or domain (for example `src/features/auth/`) rather than scattering files globally. The `app/` directory strictly contains routing logic (`page.tsx`, `layout.tsx`).
- **Serialization Boundary:** Data passed from a Server Component to a Client Component must be strictly serializable (JSON). Passing functions, Dates, or class instances as props is banned.
- **Async Request APIs (Next.js 16):** Page and layout props (`params`, `searchParams`) are asynchronous Promises. You must explicitly `await params` and `await searchParams` before accessing their properties.

### 2. Data Fetching and Dynamic Caching

- **Server-Side Fetching:** Fetch data on the server using `async/await` directly within Server Components.
- **Banned Fetching:** Do not use the `useEffect` hook for data fetching. It causes layout shifts and performance degradation.
- **Next.js 16 Caching and Dynamic I/O:** Dynamic data operations and fetches are uncached by default. Opt-in explicitly using the `'use cache'` directive alongside `cacheLife()` and `cacheTag()` helpers. Invalidate tagged entries with `revalidateTag(tag, cacheLifeProfile)`, which requires a profile argument (such as `'max'`) in Next.js 16. Use `updateTag()` inside Server Actions for read-your-writes semantics.
- **Async Request Context (Next.js 16):** Dynamic server utilities (`cookies()`, `headers()`, `draftMode()`) are asynchronous. You must explicitly `await cookies()` and `await headers()` in Server Components and Server Actions.
- **Server Actions and React 19 Action Hooks:** Use Server Actions for all form submissions and internal database mutations. In Client Components, integrate Server Actions using React 19 native hooks (`useActionState`, `useFormStatus`, `useOptimistic`). Reserve Route Handlers strictly for external public REST APIs or webhooks.
- **Server Action Authorization and Schema Validation:** Server Actions are exposed public HTTP POST endpoints. Every Server Action must explicitly validate input arguments using a schema validator (such as Zod) and execute an explicit session authorization check before performing database mutations or reads.
- **Suspense and Cache Components:** Enforce granular `<Suspense>` boundaries around genuinely dynamic components. Next.js 16 deprecated the standalone PPR configuration flag; Cache Components built on `'use cache'` deliver partial prerendering behavior. Avoid wrapping entire pages in a single monolithic Suspense boundary.

### 3. Asset and Performance Optimization

- **Image Optimization:** The standard HTML `<img>` tag is strictly banned. You must import and use the `next/image` component for all images.
- **Font Optimization:** Importing fonts from external CDNs is banned. You must use the built-in `next/font` module to self-host and optimize fonts.
- **Lazy Loading:** For heavy Client Components (such as charts or rich text editors), use `next/dynamic` to lazy-load them and reduce initial JavaScript bundle size.
- **Turbopack Readiness:** All custom configurations, imports, and modules must be fully compatible with Turbopack (the default bundler in Next.js 16).

### 4. Routing, SEO, and Middleware

- **Metadata API:** Use the built-in Next.js Metadata API (`export const metadata = { ... }`) in `layout.tsx` or `page.tsx` for SEO and Open Graph tags.
- **Forms and Navigation:** Use plain `<form action={serverAction}>` for mutations. Use `next/form` only for search and navigation forms whose `action` is a URL path string, which adds prefetching of loading UI and client-side navigation.
- **Error and Loading States:** Every major route segment must include a `loading.tsx` and an `error.tsx` file to handle Suspense boundaries and prevent broken user experiences.
- **Proxy Over Middleware:** Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts` at the project root for cross-cutting concerns such as authentication checks, rate limiting, and redirects.
- **Route Segment Config Standards:** Use explicit route segment config exports (`export const dynamic = 'force-dynamic'`, `export const revalidate = 0`) or `'use cache'` directives when non-default dynamic behavior is needed.

### 5. Security and Environment Variables

- **Client-Side Secrets:** Never expose API keys or secrets to the browser. Only variables explicitly safe for the client may be prefixed with `NEXT_PUBLIC_`.
- **Server-Side Secrets:** Database credentials, authentication secrets, and private API keys must remain on the server and be accessed securely through `process.env` in Server Components or API Routes only.
- **`server-only` Package Guardrail:** Import `'server-only'` at the top of server database modules, secret handlers, and domain service files. This triggers a build-time compiler failure if server logic or private keys are accidentally imported into Client Component bundles.

## Code Examples

```tsx
import { Suspense } from "react";
import Image from "next/image";
import { UserProfileData } from "@/features/users/components/user-profile-data";
import { ProfileSkeleton } from "@/features/users/components/profile-skeleton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  // Explicitly await async params (Next.js 16 requirement)
  const { id } = await params;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <header className="flex items-center gap-4 mb-8">
        <Image
          src="/brand-logo.svg"
          alt="Organization Logo"
          width={48}
          height={48}
          priority
        />
        <h1 className="text-3xl font-bold">User Account Profile</h1>
      </header>
      <Suspense fallback={<ProfileSkeleton />}>
        <UserProfileData userId={id} />
      </Suspense>
    </main>
  );
}
```

## Anti-Patterns

- **AP-4 (Over-permissive client / Bundle explosion):** Placing `'use client'` at the top of layout or page files, stripping all Server Component benefits.
- **AP-9 (Goal without verification / Unvalidated Server Actions):** Creating Server Actions that modify database state without verifying user session authorization and validating input payloads with Zod.
- **Synchronous Params Access:** Accessing `params.id` directly without `await params` in Next.js 16.
- **Raw HTML Images:** Using standard `<img src="..." />` tags, bypassing automated optimization, WebP conversion, and responsive srcset generation.
- **Accidental Client Secret Leakage:** Omitting `'server-only'` on database utility files, allowing private tokens to bundle into browser assets.

## Best Practices

- Use Server Components for all data fetching and Server Actions for form submissions.
- Guard server-only files with `import 'server-only'`.
- Define granular `<Suspense>` boundaries around slow data dependencies with matching skeleton loaders.

## Related Skills

- `react-principles`
- `typescript-standards`
- `api-design`
