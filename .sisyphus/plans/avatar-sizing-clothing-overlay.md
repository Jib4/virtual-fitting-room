# Avatar Sizing + Clothing Overlay Work Plan

## Context

### Original Request
"적어도 옷에 대한 인풋을 제대로 처리할 수 있도록 아바타 생성과 사이즈 반영 기능을 완성 단계로 만들어" + 아래 4개 작업(슬라이더 완전 반영 / 비율 현실화 / 옷 오버레이 / 사이즈 추천)까지 포함한 상세 실행 계획.

### Current State (observed)
- UI: `index.html` has 8 sliders + gender/height/weight + "아바타 생성".
- State: `script.js` uses `currentSpec` and `AVG` defaults per gender.
- Rendering: `renderAvatarFromSpec(spec)` draws torso polygon, arms rects, legs rects, neck ellipse.
- Gaps:
  - `armInsideLength`, `legInsideLength`, `neckToWaistVertical` exist in state/UI but are not actually driving arm length / leg length / torso proportions.
  - Clothing overlays do not exist.
  - Weight is displayed but not used in geometry (treat as optional).
- Constraints: vanilla JS only; no deps; 4-color palette only; no TS; no test framework (manual verification).

### Metis Review
- Not available in this environment (agent/tooling limitation). Plan includes an explicit self-review + decision points to compensate.

---

## Work Objectives

### Core Objective
Make the avatar geometry + sizing reliable enough that clothing selection/overlays and size recommendation can be computed from the same measurement inputs.

### Concrete Deliverables
- All 8 sliders have visible, direct impact on the avatar silhouette.
- Avatar includes head + more realistic torso silhouette.
- Clothing overlay system with at least 2 tops + 2 bottoms that scale with measurements.
- Size recommendation module (S/M/L/XL) per garment type using chest/waist/hip.

### Definition of Done
- [ ] Manual verification checklist passes on desktop + mobile widths.
- [ ] All 8 sliders demonstrably affect avatar/clothing (no “no-op” inputs).
- [ ] Clothing overlays stay aligned (no obvious drift) across slider min/max ranges.
- [ ] Size recommendation updates deterministically when measurements change.

### Must NOT Have (Guardrails)
- No npm/yarn/bun deps; keep vanilla.
- No colors outside palette (`#ff9a76`, `#ffeadb`, `#679b9b`, `#637373`).
- No TypeScript.
- Avoid over-engineering (keep everything in `script.js` unless a clear split is needed).

---

## Verification Strategy (Manual QA Only)

### Run App
- `python3 -m http.server 8000` then open `http://localhost:8000`

### Manual QA Scenarios (repeat after each major task)
1) Baseline render
   - Set gender M/F, set height/weight, click "아바타 생성" -> avatar appears.
2) Slider coverage (8/8)
   - Move each slider from mid -> min -> max.
   - Verify a visible change is produced each time (body or clothing), and the value label updates.
3) Extreme geometry sanity
   - Test min/max combos for:
     - narrow waist + wide hips
     - wide shoulders + narrow chest
     - shortest torso (`neckToWaistVertical` min) + longest legs (`legInsideLength` max)
   - Verify nothing disappears or goes outside SVG viewBox.
4) Clothing overlay alignment
   - Toggle each garment on/off.
   - Verify overlays remain centered and attached to body.
5) Responsive layout
   - Resize browser to <900px width (mobile layout) and verify controls + avatar still usable.

Evidence (recommended for executor)
- Save screenshots to `.sisyphus/evidence/` with names like `t3-arm-minmax.png`.

---

## Dependency Order / Task Flow

Sequential backbone:
1) Geometry refactor + reliable derived measurements
2) Wire 8 sliders into geometry (arm/leg/torso)
3) Upgrade silhouette + add head
4) Add clothing overlay system (layering + scaling)
5) Add size recommendation + UI output

Parallel opportunities (safe):
- While geometry refactor is in progress, UI additions (garment selectors + size output) can be prepared in `index.html`/`style.css` as long as IDs are stable.

---

## TODOs

> Notes for executor
> - Primary implementation files will be `index.html`, `script.js`, `style.css`.
> - Keep existing patterns: `DOMContentLoaded` init, `currentSpec` single source of truth.
> - Maintain SVG part ordering; overlays should sit above body parts but below info text.

### 1) Refactor rendering into “spec -> geometry -> SVG” pipeline

**Category**: Refactor / Maintainability
**Recommended skills**: `explore` (find patterns), `sisyphus-junior` (execution)
**Parallelizable**: NO

**What to do**
- In `script.js`, split `renderAvatarFromSpec(spec)` into:
  - `computeAvatarGeometry(spec)` returning a geometry object (widths, y positions, limb lengths, anchor points)
  - `renderAvatarSvg(geometry, options)` that only creates SVG elements
- Ensure all geometry is bounded (min/max) and depends only on `spec`.
- Add explicit “fit to canvas” behavior so extreme slider values stay visible:
  - Prefer using an SVG `viewBox` and centering around a computed avatar bounding box.
  - If keeping fixed `width/height`, clamp y positions and limb lengths so nothing renders outside.

**Files to change**
- `script.js`

**Acceptance Criteria**
- [ ] App still renders same avatar as before with default values.
- [ ] No console errors.
- [ ] Geometry object logged in console once (temporary) for debugging, then removed or gated.
- [ ] With slider extremes, avatar remains fully visible (no parts cut off).

### 2) Wire `armInsideLength` into arm length

**Category**: Feature / Avatar sizing
**Recommended skills**: `sisyphus-junior`
**Parallelizable**: YES (with Task 3 if geometry pipeline from Task 1 exists)

**What to do**
- Convert `armInsideLength` (cm) into pixel length via a consistent scale derived from `heightPx`.
  - Example: define `pxPerCm = heightPx / spec.height` (so 1cm maps consistently).
- Replace `heightPx * 0.6` arm length with `armLenPx = clamp(spec.armInsideLength * pxPerCm, minArmPx, maxArmPx)`.
- Keep arm anchored at torso top/shoulder region.

**Files to change**
- `script.js`

**Acceptance Criteria**
- [ ] Moving arm slider min->max visibly changes arm length.
- [ ] Arms never exceed SVG bottom or disappear.

### 3) Wire `legInsideLength` into leg length

**Category**: Feature / Avatar sizing
**Recommended skills**: `sisyphus-junior`
**Parallelizable**: YES (with Task 2 if geometry pipeline from Task 1 exists)

**What to do**
- Replace `legLen = heightPx * 0.45` with `legLenPx = clamp(spec.legInsideLength * pxPerCm, minLegPx, maxLegPx)`.
- Update hip/leg anchor points so legs start at hipY and end within SVG.

**Files to change**
- `script.js`

**Acceptance Criteria**
- [ ] Moving leg slider min->max visibly changes leg length.
- [ ] Legs remain attached to hips; no gaps.

### 4) Wire `neckToWaistVertical` into torso proportion (upper/lower ratio)

**Category**: Feature / Avatar sizing
**Recommended skills**: `sisyphus-junior`
**Parallelizable**: NO (depends on Task 1)

**What to do**
- Use `neckToWaistVertical` (cm) to compute torso segment lengths:
  - define `torsoLenPx = clamp(spec.neckToWaistVertical * pxPerCm, minTorsoPx, maxTorsoPx)`
  - re-derive `chestY`, `waistY`, `hipY` from `torsoTopY + torsoLenPx` (and a hip offset)
- Ensure overall height composition remains sane:
  - total = head + neck + torso + legs should fit SVG height; if not, proportionally compress (clamp).

**Files to change**
- `script.js`

**Acceptance Criteria**
- [ ] Changing `neckToWaistVertical` changes torso length and shifts waist/hip positions.
- [ ] Legs automatically adjust so feet remain within SVG.

### 5) Improve silhouette (curves + shoulder slope) and add head

**Category**: Feature / Visual realism
**Recommended skills**: `frontend-ui-ux` (shape design), `sisyphus-junior`
**Parallelizable**: NO (depends on Tasks 1-4)

**What to do**
- Replace torso polygon with a smoother path:
  - Use an SVG `path` with quadratic/cubic curves (still simple, no libs)
  - Incorporate shoulder slope using `shoulderSpan` and a small slope factor
  - Blend chest->waist->hip widths for curvature
- Add a head (circle/ellipse) above neck:
  - Scales modestly with height (or keep fixed with clamp)
- Keep palette: head/skin uses `--beige`; outline uses `--slate`.

**Files to change**
- `script.js`

**Acceptance Criteria**
- [ ] Head is visible and aligned with neck.
- [ ] Shoulder/chest/waist/hip transitions look smoother than polygon.
- [ ] No additional colors introduced (avoid `#000` strokes).

### 6) Add clothing overlay system (SVG groups + garment shapes)

**Category**: Feature / Clothing overlay
**Recommended skills**: `frontend-ui-ux` (garment silhouettes), `sisyphus-junior`
**Parallelizable**: YES (UI controls in Task 7 can be prepared in parallel)

**What to do**
- In `script.js`, introduce a clothing state (e.g., `currentClothing = { top: 'tee', bottom: 'pants' }`).
- Add a fit state: `currentFit = 'regular' | 'slim' | 'oversized'`.
- Render clothing as separate SVG group(s) appended after body but before the neck/head if needed:
  - Suggested order: body -> clothing -> neck/head (or head above clothing for realism)
- Implement at least:
  - Tops: `tee`, `shirt`
  - Bottoms: `pants`, `skirt`
- Scale garment widths from chest/waist/hip widths and garment ease:
  - Define `easePx` from fit:
    - slim: small/near-zero ease
    - regular: baseline ease
    - oversized: larger ease
  - top width ~ max(chestW, waistW) + easePx
  - bottom width ~ hipW + easePx
- Keep colors within palette:
  - clothing fill can use `--slate` or `--peach` depending on contrast.

**Files to change**
- `script.js`

**Acceptance Criteria**
- [ ] Toggling garments on/off affects SVG layers (visible).
- [ ] Garments resize when chest/waist/hip sliders change.
- [ ] Garments stay aligned during torso/leg proportion changes.

### 7) Add clothing UI inputs + size recommendation output panel

**Category**: Feature / UI
**Recommended skills**: `frontend-ui-ux`, `sisyphus-junior`
**Parallelizable**: YES (with Task 6)

**What to do**
- In `index.html`, add UI controls:
  - top selector: none/tee/shirt
  - bottom selector: none/pants/skirt
- Add fit selector: slim/regular/oversized.
- Add a "추천 사이즈" output section near avatar info with:
  - top size (S/M/L/XL)
  - bottom size (S/M/L/XL)
  - short explanation (which measurement drove the decision)
- In `style.css`, style new controls using existing palette + layout patterns.

**Files to change**
- `index.html`
- `style.css`
- `script.js` (bindings + render)

**Acceptance Criteria**
- [ ] New controls render on desktop + mobile widths.
- [ ] Selecting garments immediately updates avatar overlay.
- [ ] No layout overflow at <900px.

### 8) Implement size recommendation engine (garment-type charts)

**Category**: Feature / Sizing logic
**Recommended skills**: `sisyphus-junior`
**Parallelizable**: NO (depends on Task 7 UI wiring)

**What to do**
- In `script.js`, define size charts as simple JSON objects:
  - `SIZE_CHARTS = { tee: [...], shirt: [...], pants: [...], skirt: [...] }`
  - Each entry defines max chest/waist/hip for S/M/L/XL
- Choose recommendation rule per garment:
  - top: primarily chest, secondary waist
  - bottom: primarily hip, secondary waist
- Apply fit adjustment to recommendation (simple + transparent):
  - slim: bias one size down when near a boundary (never below S)
  - oversized: bias one size up when near a boundary (never above XL+)
  - regular: no bias
- Output should include:
  - chosen size
  - which measurement was limiting (e.g., "hip 기준")
- Make charts easy to edit (single location).

**Files to change**
- `script.js`

**Acceptance Criteria**
- [ ] Changing chest/waist/hip updates recommended size deterministically.
- [ ] Switching garment type changes which chart is used.
- [ ] Edge case: above XL -> return "XL+" or "XXL" (explicit) rather than failing.

### 9) Optional: weight influence (only if it helps clothing input fidelity)

**Category**: Optional enhancement
**Recommended skills**: `sisyphus-junior`
**Parallelizable**: NO (only after core sizing is stable)

**What to do**
- If desired, use weight as a mild thickness/ease multiplier when computing garment widths.
- Keep effect bounded and predictable (avoid distorting body width directly without real mass distribution).

**Files to change**
- `script.js`

**Acceptance Criteria**
- [ ] Toggling weight values changes clothing ease slightly, not body geometry.
- [ ] Can be disabled by setting multiplier to 0.

---

## Commit Strategy (if the executor uses git)
- Suggested atomic commits:
  1) `refactor(render): split geometry from svg render`
  2) `feat(avatar): wire arm/leg/torso sliders`
  3) `feat(avatar): add head and curved torso path`
  4) `feat(clothing): add overlay system and UI selectors`
  5) `feat(size): add size charts and recommendation output`

---

## Defaults Applied (confirmed)
- Size chart baseline: Generic S/M/L/XL charts as editable JSON in `script.js`.
- Fit model: slim/regular/oversized (affects clothing ease + size recommendation bias).
