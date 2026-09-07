# Hearth v1.1 Branch Consolidation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate `feat/v1.1-hearth-os-overhaul` and `build/v1-one-shot` into one maintained default branch containing the latest runtime/UI implementation, current reference materials, and one clean documentation set.

**Architecture:** Use the feature branch tree as the runtime base because it contains the newer v1.1 application implementation. Overlay the current default branch's `design-references/` material and replace conflicting documentation with a concise source-of-truth set describing the actual merged state. Create a real merge commit with both branch heads as parents, then make `build/v1-one-shot` the sole maintained branch and retire the redundant feature ref where tooling permits.

**Tech Stack:** Git/GitHub, Vite, React 19, TypeScript, Dexie, Zustand, Playwright/Vitest documentation contracts.

**Spec:** User-approved consolidation design in the 2026-09-07 conversation.

## Global Constraints

- Preserve all runtime/UI work from `feat/v1.1-hearth-os-overhaul` unless a newer default-branch file is intentionally reference/documentation-only.
- Preserve `design-references/` and the exact committed HTML reference from `build/v1-one-shot`.
- Do not keep multiple competing current-state docs, stale one-shot prompts, V2 ledgers, or superseded planning records.
- Normalize current product naming to Hearth v1.1; historical implementation details belong in `CHANGELOG.md`, not competing source-of-truth files.
- No runtime feature changes are introduced by this consolidation itself.
- Do not claim fresh npm/Playwright verification unless it is actually executed; use Git tree/diff/status evidence for repository-only merge work.

---

### Task 1: Build the merged runtime tree

- [ ] Use `feat/v1.1-hearth-os-overhaul` as the base tree so all v1.1 `src/`, schema, tests, package files, and shell/UI work are retained.
- [ ] Overlay `design-references/` from the current default branch without altering binary/reference contents.
- [ ] Confirm runtime paths are not replaced by reference files.

### Task 2: Replace documentation with one current set

- [ ] Keep/update: `README.md`, `DESIGN.md`, `CLAUDE.md`, `AGENTS.md`, `CHANGELOG.md`.
- [ ] Keep/update: `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/CURRENT_STATE.md`, `docs/QA_CHECKLIST.md`, `docs/ROADMAP.md`.
- [ ] Keep: `design-references/README.md` and the reference materials.
- [ ] Remove stale/superseded docs and prompts including the root one-shot prompt, `_v2prompt.md`, `docs/V2_STATUS.md`, `docs/BUILD_STATE.md`, and old `docs/superpowers/` plans/specs after this plan has served its purpose.

### Task 3: Create and integrate the merge commit

- [ ] Create one Git tree representing the final cleaned repository.
- [ ] Create a merge commit whose first parent is current `build/v1-one-shot` and second parent is `feat/v1.1-hearth-os-overhaul`.
- [ ] Fast-forward `build/v1-one-shot` to the merge commit.

### Task 4: Verify and retire redundant branch state

- [ ] Compare the pre-merge heads to the final head and confirm the intended runtime + reference changes are present.
- [ ] Verify old duplicate paths/docs are absent and the current docs/reference files exist.
- [ ] Verify GitHub/Vercel commit status where available.
- [ ] Delete `feat/v1.1-hearth-os-overhaul` if the connector exposes branch-ref deletion; otherwise point it at the final commit only as a temporary fallback and report the one remaining GitHub UI deletion step.
- [ ] Remove this temporary plan from the final tree so only lasting documentation remains.
