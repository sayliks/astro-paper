---
name: mobile-menu-behavior-update
description: Workflow command scaffold for mobile-menu-behavior-update in astro-paper.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /mobile-menu-behavior-update

Use this workflow when working on **mobile-menu-behavior-update** in `astro-paper`.

## Goal

Refactor or fix the mobile menu overlay and its behavior, including alignment, overlay style, and responsive transitions.

## Common Files

- `src/components/Header.astro`
- `src/scripts/header-menu.ts`
- `src/styles/global.css`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit src/components/Header.astro to adjust menu markup and classes.
- Optionally edit src/scripts/header-menu.ts to update menu logic.
- Optionally edit src/styles/global.css for related style tweaks.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.