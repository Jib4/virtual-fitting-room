# Draft: Avatar Sizing + Clothing Overlay

## Requirements (confirmed)
- Complete avatar sizing so clothing inputs can be handled correctly.
- Ensure all 8 sliders affect rendering:
  - `legInsideLength` -> leg length
  - `armInsideLength` -> arm length
  - `neckToWaistVertical` -> torso proportion (upper/lower body balance)
- Improve realism of proportions:
  - smoother silhouette (shoulder slope, chest-waist-hip curve)
  - add head for overall proportion check
- Add clothing overlay system:
  - top layer (shirt/t-shirt)
  - bottom layer (pants/skirt)
  - clothing scales with body measurements
- Add size recommendation:
  - use chest/waist/hip
  - garment-type-specific size charts (S/M/L/XL)

## Constraints
- Vanilla JS only; no npm dependencies.
- Use only 4-color palette: `#ff9a76`, `#ffeadb`, `#679b9b`, `#637373`.
- No TypeScript.
- Project has no build/test framework; verification is manual.

## Codebase Facts (observed)
- Files: `index.html`, `script.js`, `style.css`.
- `script.js` has:
  - `AVG` defaults per gender
  - `currentSpec` state
  - `applyGenderDefaults()` sets slider min/max/value
  - `bindSliders()` binds 8 slider IDs to `currentSpec`
  - `renderAvatarFromSpec(spec)` renders SVG (torso polygon, arms rects, legs rects, neck ellipse)
- `neckToWaistVertical` is bound into `currentSpec` but not currently used in geometry calculations.

## Open Questions
- RESOLVED: Size chart baseline -> Generic S/M/L/XL (editable JSON charts).
- RESOLVED: Fit model -> Regular + Slim + Oversized.
- Clothing UI depth: keep initial UI as selectors (none/tee/shirt, none/pants/skirt) + fit selector.

## Scope Boundaries
- INCLUDE: avatar geometry completion, silhouette improvements, head, clothing overlays, size recommendation.
- EXCLUDE (for now): texture/photoreal clothing, 3D rendering, external libraries, backend.
