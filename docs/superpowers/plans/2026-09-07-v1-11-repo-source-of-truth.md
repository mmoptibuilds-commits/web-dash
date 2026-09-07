# V1.11 Repository Source-of-Truth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align repository documentation and reference layout with the approved V1.11 visual/UX direction without changing runtime behavior.

**Architecture:** Keep the existing React application and default branch intact. Move reference-only material into a dedicated non-runtime area, add the supplied HTML reference, and update governing documentation with an explicit precedence hierarchy so later agents do not follow stale V1 restrictions.

**Tech Stack:** Markdown, Git/GitHub repository metadata, existing Vite/React/TypeScript project; no runtime dependency changes.

**Spec:** `docs/superpowers/specs/2026-09-07-v1-11-repo-source-of-truth-design.md`

## Global Constraints

- No runtime source or dependency changes in this pass.
- No new spend.
- Preserve the existing default branch and working app behavior.
- Historical V1 documents remain identifiable as historical baseline.
- Do not claim LiquidGlass WebGL, Figma icon replacement, or new dock motion is implemented yet.

---

### Task 1: Reorganize reference material

**Files:**
- Move: `assets/` → `design-references/assets/`
- Create: `design-references/macos-liquidglass-motion-reference.html`
- Create: `design-references/README.md`

**Interfaces:**
- Consumes: existing root reference tree and supplied HTML prototype.
- Produces: one stable reference location for Work/Codex/Claude and future human contributors.

- [ ] Move the existing `assets/` tree by reusing its Git tree/blob SHAs so binary contents are unchanged.
- [ ] Add the supplied HTML prototype verbatim as a reference-only file.
- [ ] Add a README defining source roles, allowed reuse, prohibited wholesale copying, Figma node `401:3`, and the LiquidGlass repository.
- [ ] Verify runtime source files were not changed.

### Task 2: Update active agent/source-of-truth docs

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `DESIGN.md`
- Modify: `_v2prompt.md`
- Create: `docs/V1_11_WORK_HANDOFF.md`

**Interfaces:**
- Consumes: current shipped behavior recorded in `docs/V2_STATUS.md` and the approved V1.11 design.
- Produces: clear instructions for future coding agents.

- [ ] Add an explicit document-precedence hierarchy.
- [ ] Replace stale ordered-grid-only/current-V1 statements with the current freeform-desktop/mobile-adaptive baseline.
- [ ] Mark WebGL Liquid Glass as an approved selective V1.11 target, not an already-shipped feature.
- [ ] Convert `_v2prompt.md` into a compatibility pointer to the new handoff instead of leaving a stale execution prompt active.

### Task 3: Align project documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/PRODUCT_SPEC.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/BUILD_STATE.md`
- Modify: `docs/QA_CHECKLIST.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: shipped V2 ledger and approved V1.11 target.
- Produces: documentation that distinguishes implemented baseline, historical V1 contract, and pending V1.11 work.

- [ ] Update README feature/status and documentation map.
- [ ] Update architecture to the current freeform geometry / DB-v3-era baseline and document the planned material seam without claiming it exists.
- [ ] Add a supersession notice to the frozen V1 product spec rather than rewriting history.
- [ ] Rewrite roadmap around shipped baseline → V1.11 → later work; remove refraction from a blanket V3-only deferral.
- [ ] Add V1.11 prep status and pending acceptance gates to build/QA docs.
- [ ] Record the repository-prep change under `[Unreleased]`.

### Task 4: Verify and commit

**Files:** all files above.

**Interfaces:**
- Consumes: final Git tree.
- Produces: a coherent commit on `build/v1-one-shot`.

- [ ] Confirm the branch head is still based on the expected pre-change commit.
- [ ] Confirm `design-references/assets/` points to the original `assets/` tree and the old root path is removed.
- [ ] Fetch changed files from the new branch head and check source-precedence, V1.11 target wording, and no false implementation claims.
- [ ] Confirm no `src/`, `package.json`, lockfile, test, or PWA runtime file changed.
- [ ] Check commit status/CI information available from GitHub and report any limits of verification.
