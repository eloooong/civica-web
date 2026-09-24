# VS Code Copilot Custom Instructions : CivicLens

> Governed by Sauron v1.0.0. Universal AI agent harness.
> Applied automatically by GitHub Copilot via VS Code instruction files standard.

## Coding and Architectural Directives

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

## Fellowship Sub-Agents Context

- **Elessar** (Principal System Architect): invoke via `/aragorn`
- **Shield of Gondor** (Security Auditor and Shield): invoke via `/boromir`
- **Ringbearer** (Core Task Executor): invoke via `/frodo`
- **Mithrandir** (Master Planner and Strategy Guide): invoke via `/gandalf`
- **Lockbearer** (Refactorer and AST Dead Code Slasher): invoke via `/gimli`
- **Greenleaf** (Precision Linter and Syntax Bug Hunter): invoke via `/legolas`
- **Brandir** (QA and TDD Specialist): invoke via `/merry`
- **Took** (Edge Case and Chaos Prober): invoke via `/pippin`
- **The Brave** (Git Commits and State Keeper): invoke via `/samwise`

## Prohibited Anti-Patterns

- AP-1 (Vague task verb) : Always decompose requests into concrete atomic tasks.
- AP-6 (Monolithic prompt) : Never combine architecture, code, and test in one step.
- AP-14 (Leaking secrets) : Zero credentials in version control.
- AP-17 (Skipping tests) : Code without a prior failing test is unverified code.
- AP-18 (Non-atomic commit) : One logical concern per commit.
- AP-52 (Fake fix) : Masking errors with type casts or empty catch blocks is prohibited.
