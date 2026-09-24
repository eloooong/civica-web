# GEMINI.md

> Governed by Sauron v1.0.0. Persistent context and instructions for Gemini CLI.

## Project Overview & Tech Stack

Production codebase governed by Sauron Universal Agent Harness.
- Target: Node.js 20+, TypeScript 7+, ESM
- Test Runner: Native Node.js test runner

## Essential Commands

- Build: `npm run build`
- Test All: `npm test`
- Lint & Typecheck: `npx tsc --noEmit`
- Single Test: `node --test tests/<filename>.test.mjs`

## Architectural & Coding Guidelines

- Present tense, active voice, English language exclusively.
- Zero emojis across all code files, comments, and commit messages.
- Prohibit Latin abbreviations: use 'for example', 'that is', 'and so forth'.
- Prohibit em dashes: use colons, parentheses, or separate sentences.
- Strict Red-Green-Refactor TDD required before touching production code.
- Zero untyped boundary parameters: enforce runtime validation (Zod, Pydantic).
- Zero hardcoded secrets, connection strings, or unredacted logging output.
- Token Conservation & Caveman Mode: When invoked with '/caveman' (or 'lite', 'ultra'), eliminate conversational filler and pleasantries while preserving all code, commands, paths, and technical precision verbatim. Restore standard conversational style when requested with '/caveman off'.

## Token Optimization & Caveman Mode

- When contributor triggers `/caveman` (or `lite`, `ultra`), enforce terse, spartan communication.
- Drop conversational pleasantries, filler phrases, and tool narration overhead.
- Never alter or compress code blocks, diffs, file paths, or commands.
- Restore normal conversational style immediately when requested with `/caveman off`.

## Fellowship Sub-Agents Delegation

- **Elessar** (`/aragorn`): Principal System Architect
- **Shield of Gondor** (`/boromir`): Security Auditor and Shield
- **Ringbearer** (`/frodo`): Core Task Executor
- **Mithrandir** (`/gandalf`): Master Planner and Strategy Guide
- **Lockbearer** (`/gimli`): Refactorer and AST Dead Code Slasher
- **Greenleaf** (`/legolas`): Precision Linter and Syntax Bug Hunter
- **Brandir** (`/merry`): QA and TDD Specialist
- **Took** (`/pippin`): Edge Case and Chaos Prober
- **The Brave** (`/samwise`): Git Commits and State Keeper

## Gemini Behavior & Safety Boundaries

- AP-1 (Vague task verb) : Always decompose requests into concrete atomic tasks.
- AP-6 (Monolithic prompt) : Never combine architecture, code, and test in one step.
- AP-14 (Leaking secrets) : Zero credentials in version control.
- AP-17 (Skipping tests) : Code without a prior failing test is unverified code.
- AP-18 (Non-atomic commit) : One logical concern per commit.
- AP-52 (Fake fix) : Masking errors with type casts or empty catch blocks is prohibited.
- Never modify files in `.sauron/backups/` directly.
- Never commit secrets, credentials, or `.env` files.
- Always run tests and verify zero exit codes before concluding.
