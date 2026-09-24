# CLAUDE.md

> Managed by Sauron v1.2.0. Persistent instruction manual for Claude Code.

## Common Commands

- **Dev Server**: `npm run dev`
- **Build Engine**: `npm run build`
- **Run Linter**: `npm run lint`
- **Typecheck**: `npm run typecheck`

## Architecture and Code Organization

- Context: CivicLens PH. Next.js 16 App Router plus React 19 plus TypeScript strict plus Tailwind CSS v4. No database, no auth, no env vars.
- `app/`: Routes for homepage, search, budget, congress, data, plus `sitemap.ts` and `robots.ts`.
- `components/`: `layout/`, `ui/`, `search/`, `budget/`, `congress/`, `data/`, plus vendored Bklit charts in `components/charts/` (excluded from ESLint).
- `lib/`: Per-source API clients in `lib/api/` (budget, congress, datasets). UI components never fetch directly. Upstream responses cache for 1 hour.
- `types/`: Per-source API shapes plus normalized `SearchResult`.

## Code Style and Conventions

- Present tense, active voice, English language exclusively.
- Zero emojis across all code files, comments, and commit messages.
- Prohibit Latin abbreviations: use 'for example', 'that is', 'and so forth'.
- Prohibit em dashes: use colons, parentheses, or separate sentences.
- Prefer editing existing files over creating new ones.
- Follow Next.js App Router conventions: server components by default, `loading.tsx` and `error.tsx` boundaries, semantic HTML.
- Keep API base URLs in exactly one constant per source module in `lib/api/`.
- Attribute every government record to its source with retrieval timestamp. Never invent bill statuses or legislative stages.
- Token Conservation and Caveman Mode: When invoked with '/caveman' (or 'lite', 'ultra'), eliminate conversational filler and pleasantries while preserving all code, commands, paths, and technical precision verbatim. Restore standard conversational style when requested with '/caveman off'.

## Fellowship Sub-Agents

- **Elessar** (`/aragorn`): Principal System Architect
- **Shield of Gondor** (`/boromir`): Security Auditor and Shield
- **Ringbearer** (`/frodo`): Core Task Executor
- **Mithrandir** (`/gandalf`): Master Planner and Strategy Guide
- **Lockbearer** (`/gimli`): Refactorer and AST Dead Code Slasher
- **Greenleaf** (`/legolas`): Precision Linter and Syntax Bug Hunter
- **Brandir** (`/merry`): QA and TDD Specialist
- **Took** (`/pippin`): Edge Case and Chaos Prober
- **The Brave** (`/samwise`): Git Commits and State Keeper

## Token Optimization and Caveman Mode

- When contributor triggers `/caveman` (or `lite`, `ultra`), enforce terse, spartan communication.
- Drop conversational pleasantries, filler phrases, and tool narration overhead.
- Never alter or compress code blocks, diffs, file paths, or commands.
- Restore normal conversational style immediately when requested with `/caveman off`.
