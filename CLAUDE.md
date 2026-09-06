# Hearth OS project context

This repository is Hearth OS v1.1: a local-first Vite/React PWA that behaves like a personal desktop rather than a scrolling website.

Home is the permanent base surface. Apps opens a Launchpad overlay. Desktop apps use persistent, bounded floating windows; narrow devices use safe-area-aware sheets. Settings, icon presentation, dock behavior, layout density, transparency, contrast, and reload restoration are real persisted controls.

Architecture rules:

- components -> features -> repositories -> Dexie;
- no direct db access from components;
- no page-level or shell scrolling;
- bounded app/embed scrolling only;
- shared geometry for collision-free layout;
- shared tokens/materials/glyphs for visual changes;
- preserve old rows through defaults and migrations.

The approved design record is docs/superpowers/specs/2026-09-06-hearth-os-v1-1-overhaul-design.md and the plan is docs/superpowers/plans/2026-09-06-hearth-os-v1-1-overhaul.md.
