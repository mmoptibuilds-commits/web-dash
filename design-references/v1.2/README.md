# Hearth v1.2 visual references

These images were extracted from the user-supplied **v1.2 requirements PDF** and compressed to WebP so implementation agents can inspect them quickly inside the repository. They are **reference-only** and must not be shipped as application assets unless separately reviewed and intentionally promoted.

## Reference map

1. `01-macos-menubar-anatomy.webp` — menubar/status-bar anatomy and low visual mass. Use it to guide the subtle transparent top bar: contextual identity/menu area on the left, compact system/status controls on the right, no large full-width glass card.
2. `02-macos-control-center-accessibility.webp` — macOS Control Center / settings-popover structure. Use it for compact grouped controls and outside-click/Escape dismissal behavior.
3. `03-macos-desktop-settings-control-center.webp` — whole-desktop composition: wallpaper, widgets, bounded Settings window, Control Center and dock. Use it to judge scale, density and whether Hearth reads as an OS rather than a website.
4. `04-macos-settings-sidebar-general.webp` — desktop System Settings sidebar + detail layout. Use it as the main responsive Settings-app reference.
5. `05-macos-settings-appearance-dark.webp` — dark Appearance settings hierarchy, native rows, segmented choices, toggles and compact sidebar proportions.
6. `06-macos-desktop-settings-light.webp` — light Desktop Settings / wallpaper and appearance layout. Use it to validate light theme spacing, content width and control density.

## How to use these references

- Compare Hearth **side by side** with these references during v1.2 implementation and final visual QA.
- Match hierarchy, proportions, spacing, material behavior and interaction patterns — **not Apple trademarks, copy, exact proprietary artwork or OS-only functionality**.
- Desktop should read as macOS-inspired; phone/touch layouts should deliberately adapt into an iOS-like interaction model rather than shrinking the desktop UI.
- The existing React application remains the functionality/architecture source of truth.
- For the exact v1.2 requirements that accompanied these images, use the current product brief supplied to the implementation agent; the images alone are not the complete specification.
