# Hearth OS contributor notes

Hearth v1.1 is a viewport-locked personal desktop. Home is always mounted; Apps opens Launchpad; app content opens in windows or narrow sheets. The document, shell, and Home do not scroll. Content-heavy app bodies may own bounded internal scrolling.

Keep Dexie as the only persistent store and route table access through repositories. New schema changes require a versioned migration, backup validation, defaults, and tests. Keep window state in windowStates; keep immediate chrome state in Zustand.

Use the shared geometry contract for every Home placement path. A committed tile cannot overlap another tile or escape the measured canvas. Use shared design tokens and the Glyph presentation layer. Do not add copied Apple/Figma assets, random per-app gradients, WebGL, or new UI frameworks for routine styling.

Run npm run lint, npm run typecheck, npm test, npm run build, and git diff --check before handoff. Run Playwright against a fresh production build when changing shell, responsive, PWA, window, widget, or embed behavior.
