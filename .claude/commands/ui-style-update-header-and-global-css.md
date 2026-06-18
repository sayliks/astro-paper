---
name: ui-style-update-header-and-global-css
description: Workflow command scaffold for ui-style-update-header-and-global-css in astro-paper.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /ui-style-update-header-and-global-css

Use this workflow when working on **ui-style-update-header-and-global-css** in `astro-paper`.

## Goal

Update the visual style or layout of the header and related global styles, often to implement new design aesthetics (e.g., glassmorphism) or improve mobile experience.

## Common Files

- `src/components/Header.astro`
- `src/styles/global.css`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit src/components/Header.astro to change header structure, classes, or behavior.
- Edit src/styles/global.css to update global CSS variables, classes, or responsive rules.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.