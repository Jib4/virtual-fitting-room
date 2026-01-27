# AGENTS.md - Virtual Fitting Room

> Agent instructions for the 가상 피팅룸 (Virtual Fitting Room) project.
> A body measurement avatar renderer using vanilla HTML/CSS/JS with 8 sliders.

## Project Overview

Single-page web application that renders a simple 2D avatar based on body measurements.
Users input height/weight, select gender, and fine-tune 8 body measurements via sliders.
The avatar updates in real-time using SVG rendering.

### Key Files

| File | Purpose |
|------|---------|
| `index.html` | UI structure: gender dropdown, 8 sliders, avatar area |
| `script.js` | Rendering logic, slider bindings, gender-based defaults |
| `style.css` | Color palette and layout styles |
| `resource/` | Screenshots and reference data |

---

## Build / Lint / Test Commands

**This project has no build system, package manager, or test framework.**

### Running the App

```bash
# Option 1: VS Code Live Server extension (recommended)
# Open index.html → Right-click → "Open with Live Server"

# Option 2: Python simple server
python3 -m http.server 8000
# Then open http://localhost:8000

# Option 3: npx serve (if Node.js available)
npx serve .
```

### Cache Issues

Browser caching can cause stale script.js to load (304 status).
- Use **Shift+Refresh** (hard reload) after changes
- Or disable cache in DevTools (Network tab → "Disable cache")

### No Linting/Formatting Tools

Currently no ESLint, Prettier, or other tooling configured.
Follow the code style guidelines below manually.

### No Tests

No test framework exists. Manual testing only:
1. Open page with cache disabled
2. Check DevTools Console for `neck geometry` logs
3. Adjust sliders → verify avatar updates immediately
4. Change gender → verify measurements reset to gender-specific averages

---

## Code Style Guidelines

### JavaScript

#### Naming Conventions

```javascript
// Variables: camelCase
let currentSpec = null;
const avatarContainer = document.getElementById('avatarContainer');

// Constants: SCREAMING_SNAKE_CASE for config objects
const AVG = { M: {...}, F: {...} };

// Functions: camelCase, verb-first
function renderAvatarFromSpec(spec) { ... }
function applyGenderDefaults() { ... }
function bindSliders() { ... }

// DOM element IDs: camelCase (match HTML)
const neckCircumference = document.getElementById('neckCircumference');
```

#### DOM Access Pattern

```javascript
// Cache DOM elements at module level
const brand = document.getElementById('brand');
const genderSel = document.getElementById('gender');

// Null-check before adding listeners
brand && brand.addEventListener('click', () => location.reload());
```

#### Event Binding Pattern

```javascript
// Use DOMContentLoaded for initialization
document.addEventListener('DOMContentLoaded', bindAll);
document.addEventListener('DOMContentLoaded', bindSliders);

// Arrow functions for simple handlers
genderSel.addEventListener('change', () => { ... });

// Named functions for complex logic
function bindSliders() {
  sliders.forEach(s => {
    const el = document.getElementById(s.id);
    if (!el) return;  // Guard clause
    el.addEventListener('input', (e) => { ... });
  });
}
```

#### Number Handling

```javascript
// Always guard against NaN
if (Number.isNaN(value)) return;
if (!Number.isFinite(neckW) || neckW <= 0) { neckW = 12; }

// Use Math.max/min for bounds
let neckW = Math.max(6, spec.neckCircumference / Math.PI);
neckW = Math.min(neckW, maxNeckW);

// Parse with explicit radix
const h = parseInt(heightInput.value, 10);
```

#### Debug Logging

```javascript
// Use conditional console.log for debugging
if (typeof console !== 'undefined') {
  console.log('neck geometry', { neckW, neckH, shoulderW });
}
```

### HTML

#### Structure

```html
<!-- Korean language -->
<html lang="ko">

<!-- Semantic sections with aria-label -->
<section id="specInput" class="section" aria-label="스펙 입력">

<!-- Inline styles for quick layout tweaks (acceptable in this project) -->
<div style="display:flex; align-items:center; gap:12px;">
```

#### Slider Pattern

```html
<div class="slider-group">
  <label for="neckCircumference" style="width:180px; color:#fff;">목둘레</label>
  <input type="range" id="neckCircumference" min="28" max="60" value="38" step="0.01" />
  <span id="neckCircumferenceValue" class="val">38.00</span>
</div>
```

### CSS

#### Color Palette (STRICT)

Only use these 4 colors:

```css
:root {
  --peach: #ff9a76;   /* Buttons, avatar torso */
  --beige: #ffeadb;   /* Input backgrounds, skin tone */
  --teal:  #679b9b;   /* Body background */
  --slate: #637373;   /* Section backgrounds, borders */
}
```

#### CSS Conventions

```css
/* Use CSS variables for palette colors */
background: #679b9b;  /* or var(--teal) */

/* Flexbox for layouts */
.layout { display: flex; gap: 16px; padding: 12px; }

/* Responsive: mobile-first with min-width breakpoints */
@media (min-width: 900px) { ... }
@media (max-width: 900px) { ... }
```

---

## Architecture Notes

### State Management

- `currentSpec`: Global object holding current body measurements
- Set to `null` initially, populated on "Generate Avatar" or first slider input
- Gender change resets `currentSpec` to `null`

### Rendering Flow

1. User clicks "아바타 생성" (Generate Avatar)
2. `currentSpec` initialized from `AVG[gender]` defaults
3. `renderAvatarFromSpec(spec)` creates SVG programmatically
4. Slider input → updates `currentSpec[key]` → re-renders

### SVG Drawing Order

Parts are drawn in this order (last = on top):
1. Torso (polygon)
2. Arms (rects)
3. Legs (rects)
4. **Neck (ellipse)** - drawn LAST to stay visible

---

## Common Tasks

### Adding a New Slider

1. Add HTML in `index.html` (copy existing slider-group pattern)
2. Add DOM bindings in `script.js` (cache element and value span)
3. Add to `AVG` object for both M and F genders
4. Add to `sliders` array in `bindSliders()`
5. Update `applyGenderDefaults()` to set min/max/value
6. Use new value in `renderAvatarFromSpec()`

### Changing Avatar Proportions

Edit calculations in `renderAvatarFromSpec()`:
- Body widths derived from circumferences using `/ (2*Math.PI)`
- Y positions calculated as fractions of `heightPx`
- All values should use `Math.max()` for minimum bounds

---

## Known Issues

1. **7 sliders not updating**: Sometimes sliders other than neck don't immediately reflect changes. Initialization path may need debugging.
2. **Neck rendering edge cases**: Certain values cause micro-rendering differences. Boundary values for neckW/neckH may need adjustment.

---

## Do NOT

- Add npm/yarn dependencies (keep it vanilla)
- Use TypeScript (plain JS only)
- Use colors outside the 4-color palette
- Suppress errors with empty catch blocks
- Use `var` (use `const`/`let`)
