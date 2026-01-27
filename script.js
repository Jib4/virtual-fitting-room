// Virtual Fitting Room - Complete Avatar + Clothing System
// All 8 sliders affect rendering; clothing overlays scale with body measurements

// ============================================================================
// CONSTANTS AND SIZE CHARTS
// ============================================================================

// Average body measurements by gender (cm) - from SizeKorea data
const AVG = {
  M: {
    neckCircumference: 37.71,
    shoulderSpan: 45.135,
    chestCircumference: 99.16,
    waistCircumference: 83.64,
    hipCircumference: 95.73,
    armInsideLength: 47.399,
    legInsideLength: 107.389,
    neckToWaistVertical: 46.045
  },
  F: {
    neckCircumference: 31.74,
    shoulderSpan: 39.91,
    chestCircumference: 86.32,
    waistCircumference: 71.31,
    hipCircumference: 92.14,
    armInsideLength: 44.097,
    legInsideLength: 100.208,
    neckToWaistVertical: 42.786
  }
};

// Size charts for clothing recommendations (all measurements in cm)
const SIZE_CHARTS = {
  top: {
    // chest-based sizing with waist consideration
    S:  { chestMax: 88, waistMax: 74 },
    M:  { chestMax: 96, waistMax: 82 },
    L:  { chestMax: 104, waistMax: 90 },
    XL: { chestMax: 112, waistMax: 98 }
  },
  bottom: {
    // hip-based sizing with waist consideration
    S:  { hipMax: 92, waistMax: 70 },
    M:  { hipMax: 98, waistMax: 78 },
    L:  { hipMax: 104, waistMax: 86 },
    XL: { hipMax: 110, waistMax: 94 }
  }
};

// Fit adjustments (ease in pixels)
const FIT_EASE = {
  slim: -4,
  regular: 8,
  oversized: 20
};

// ============================================================================
// STATE
// ============================================================================

let currentSpec = null;
let currentClothing = { top: 'none', bottom: 'none' };
let currentFit = 'regular';

// ============================================================================
// DOM BINDINGS
// ============================================================================

const brand = document.getElementById('brand');
const genderSel = document.getElementById('gender');
const heightInput = document.getElementById('height');
const weightInput = document.getElementById('weight');
const generateBtn = document.getElementById('generateBtn');

const neckCircumference = document.getElementById('neckCircumference');
const shoulderSpan = document.getElementById('shoulderSpan');
const chestCircumference = document.getElementById('chestCircumference');
const waistCircumference = document.getElementById('waistCircumference');
const hipCircumference = document.getElementById('hipCircumference');
const armInsideLength = document.getElementById('armInsideLength');
const legInsideLength = document.getElementById('legInsideLength');
const neckToWaistVertical = document.getElementById('neckToWaistVertical');

const neckCircumferenceValue = document.getElementById('neckCircumferenceValue');
const shoulderSpanValue = document.getElementById('shoulderSpanValue');
const chestCircumferenceValue = document.getElementById('chestCircumferenceValue');
const waistCircumferenceValue = document.getElementById('waistCircumferenceValue');
const hipCircumferenceValue = document.getElementById('hipCircumferenceValue');
const armInsideLengthValue = document.getElementById('armInsideLengthValue');
const legInsideLengthValue = document.getElementById('legInsideLengthValue');
const neckToWaistVerticalValue = document.getElementById('neckToWaistVerticalValue');

const avatarArea = document.getElementById('avatarArea');
const avatarContainer = document.getElementById('avatarContainer');
const controls = document.getElementById('controls');

// Clothing controls (will be added to DOM)
let topSelector = null;
let bottomSelector = null;
let fitSelector = null;
let sizeOutput = null;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// GEOMETRY CALCULATION - All 8 sliders affect this
// ============================================================================

function computeAvatarGeometry(spec) {
  const svgW = 320;
  const svgH = 480;
  const centerX = svgW / 2;
  
  // Scale: pixels per cm (based on height)
  const heightPx = clamp(spec.height * 2.2, 300, 500);
  const pxPerCm = heightPx / spec.height;
  
  // Head size (proportional, ~1/7.5 of height)
  const headHeight = heightPx / 7.5;
  const headWidth = headHeight * 0.75;
  const headY = 25;
  const headCenterY = headY + headHeight / 2;
  
  // Neck dimensions from neckCircumference (slider 1)
  // Neck should be clearly visible between head and shoulders
  let neckW = clamp(spec.neckCircumference / Math.PI, 10, 22);
  let neckH = clamp(neckW * 0.8, 12, 25); // Taller neck for visibility
  const neckY = headY + headHeight - 8; // Overlap with head bottom slightly
  
  // Shoulder width from shoulderSpan (slider 2)
  const shoulderW = clamp(spec.shoulderSpan * pxPerCm / 2, 35, 80);
  
  // Torso widths from circumferences (sliders 3, 4, 5)
  const chestW = clamp(spec.chestCircumference / (2 * Math.PI), 35, 70);
  const waistW = clamp(spec.waistCircumference / (2 * Math.PI), 25, 60);
  const hipW = clamp(spec.hipCircumference / (2 * Math.PI), 35, 70);
  
  // Torso vertical layout from neckToWaistVertical (slider 8)
  const torsoTopY = neckY + neckH;
  const torsoLen = clamp(spec.neckToWaistVertical * pxPerCm, 60, 140);
  
  // Distribute torso segments proportionally
  const shoulderY = torsoTopY + 5;
  const chestY = shoulderY + torsoLen * 0.25;
  const waistY = shoulderY + torsoLen * 0.65;
  const hipY = shoulderY + torsoLen;
  
  // Arm length from armInsideLength (slider 6)
  const armLen = clamp(spec.armInsideLength * pxPerCm * 0.7, 40, 120);
  const armWidth = 12;
  const armStartY = shoulderY;
  
  // Leg length from legInsideLength (slider 7) - reduced scale for balance
  const legLen = clamp(spec.legInsideLength * pxPerCm * 0.55, 60, 150);
  const legWidth = 14;
  const legStartY = hipY + 8;
  
  // Ensure legs fit within SVG
  const maxLegLen = svgH - legStartY - 10;
  const actualLegLen = Math.min(legLen, maxLegLen);
  
  return {
    svgW,
    svgH,
    centerX,
    pxPerCm,
    // Head
    headWidth,
    headHeight,
    headY,
    headCenterY,
    // Neck
    neckW,
    neckH,
    neckY,
    // Torso key points
    shoulderW,
    shoulderY,
    chestW,
    chestY,
    waistW,
    waistY,
    hipW,
    hipY,
    torsoLen,
    // Arms
    armLen,
    armWidth,
    armStartY,
    // Legs
    legLen: actualLegLen,
    legWidth,
    legStartY
  };
}

// ============================================================================
// SVG RENDERING - Body
// ============================================================================

function createSvgElement(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, val] of Object.entries(attrs)) {
    el.setAttribute(key, val);
  }
  return el;
}

function renderBodySvg(geo) {
  const { centerX, shoulderW, shoulderY, chestW, chestY, waistW, waistY, hipW, hipY } = geo;
  
  // Create smooth torso path using bezier curves
  // Left side: shoulder -> chest -> waist -> hip
  // Right side: hip -> waist -> chest -> shoulder
  const torsoPath = `
    M ${centerX - shoulderW},${shoulderY}
    C ${centerX - shoulderW},${shoulderY + 15}
      ${centerX - chestW - 5},${chestY - 10}
      ${centerX - chestW},${chestY}
    C ${centerX - chestW + 5},${chestY + 20}
      ${centerX - waistW - 3},${waistY - 15}
      ${centerX - waistW},${waistY}
    C ${centerX - waistW + 3},${waistY + 15}
      ${centerX - hipW - 5},${hipY - 10}
      ${centerX - hipW},${hipY}
    L ${centerX + hipW},${hipY}
    C ${centerX + hipW + 5},${hipY - 10}
      ${centerX + waistW - 3},${waistY + 15}
      ${centerX + waistW},${waistY}
    C ${centerX + waistW + 3},${waistY - 15}
      ${centerX + chestW - 5},${chestY + 20}
      ${centerX + chestW},${chestY}
    C ${centerX + chestW + 5},${chestY - 10}
      ${centerX + shoulderW},${shoulderY + 15}
      ${centerX + shoulderW},${shoulderY}
    Z
  `;
  
  return createSvgElement('path', {
    d: torsoPath,
    fill: '#ffeadb',
    stroke: '#637373',
    'stroke-width': '1'
  });
}

function renderHeadSvg(geo) {
  const { centerX, headWidth, headHeight, headCenterY } = geo;
  
  return createSvgElement('ellipse', {
    cx: centerX,
    cy: headCenterY,
    rx: headWidth / 2,
    ry: headHeight / 2,
    fill: '#ffeadb',
    stroke: '#637373',
    'stroke-width': '1'
  });
}

function renderNeckSvg(geo) {
  const { centerX, neckW, neckH, neckY } = geo;
  
  return createSvgElement('ellipse', {
    cx: centerX,
    cy: neckY + neckH / 2,
    rx: neckW / 2,
    ry: neckH / 2,
    fill: '#ffeadb',
    stroke: '#637373',
    'stroke-width': '0.5'
  });
}

function renderArmsSvg(geo) {
  const { centerX, shoulderW, armStartY, armLen, armWidth } = geo;
  const arms = [];
  
  // Left arm
  const leftArmPath = `
    M ${centerX - shoulderW - 2},${armStartY}
    L ${centerX - shoulderW - armWidth - 2},${armStartY + 5}
    L ${centerX - shoulderW - armWidth - 5},${armStartY + armLen}
    Q ${centerX - shoulderW - armWidth / 2 - 2},${armStartY + armLen + 8}
      ${centerX - shoulderW + 2},${armStartY + armLen}
    L ${centerX - shoulderW + 2},${armStartY + 10}
    Z
  `;
  arms.push(createSvgElement('path', {
    d: leftArmPath,
    fill: '#ffeadb',
    stroke: '#637373',
    'stroke-width': '0.5'
  }));
  
  // Right arm
  const rightArmPath = `
    M ${centerX + shoulderW + 2},${armStartY}
    L ${centerX + shoulderW + armWidth + 2},${armStartY + 5}
    L ${centerX + shoulderW + armWidth + 5},${armStartY + armLen}
    Q ${centerX + shoulderW + armWidth / 2 + 2},${armStartY + armLen + 8}
      ${centerX + shoulderW - 2},${armStartY + armLen}
    L ${centerX + shoulderW - 2},${armStartY + 10}
    Z
  `;
  arms.push(createSvgElement('path', {
    d: rightArmPath,
    fill: '#ffeadb',
    stroke: '#637373',
    'stroke-width': '0.5'
  }));
  
  return arms;
}

function renderLegsSvg(geo) {
  const { centerX, hipW, legStartY, legLen, legWidth } = geo;
  const legs = [];
  
  // Left leg
  const leftLegPath = `
    M ${centerX - hipW + 5},${legStartY}
    L ${centerX - legWidth - 3},${legStartY}
    L ${centerX - legWidth - 5},${legStartY + legLen - 10}
    Q ${centerX - legWidth / 2 - 3},${legStartY + legLen + 3}
      ${centerX - 3},${legStartY + legLen - 10}
    L ${centerX - 3},${legStartY}
    Z
  `;
  legs.push(createSvgElement('path', {
    d: leftLegPath,
    fill: '#ffeadb',
    stroke: '#637373',
    'stroke-width': '0.5'
  }));
  
  // Right leg
  const rightLegPath = `
    M ${centerX + 3},${legStartY}
    L ${centerX + 3},${legStartY + legLen - 10}
    Q ${centerX + legWidth / 2 + 3},${legStartY + legLen + 3}
      ${centerX + legWidth + 5},${legStartY + legLen - 10}
    L ${centerX + legWidth + 3},${legStartY}
    L ${centerX + hipW - 5},${legStartY}
    Z
  `;
  legs.push(createSvgElement('path', {
    d: rightLegPath,
    fill: '#ffeadb',
    stroke: '#637373',
    'stroke-width': '0.5'
  }));
  
  return legs;
}

// ============================================================================
// SVG RENDERING - Clothing Overlays
// ============================================================================

function renderTopClothing(geo, topType, fit) {
  if (topType === 'none') return null;
  
  const { centerX, shoulderW, shoulderY, chestW, chestY, waistW, waistY, armLen, armWidth } = geo;
  const ease = FIT_EASE[fit] || FIT_EASE.regular;
  
  // Adjust widths with ease
  const sw = shoulderW + ease / 2;
  const cw = chestW + ease;
  const ww = waistW + ease;
  
  let topPath;
  let sleeveLen;
  
  if (topType === 'tee') {
    // T-shirt: short sleeves, ends at waist
    sleeveLen = armLen * 0.25;
    topPath = `
      M ${centerX - sw},${shoulderY - 2}
      L ${centerX - sw - 15},${shoulderY + sleeveLen}
      L ${centerX - sw + 5},${shoulderY + sleeveLen + 5}
      L ${centerX - cw},${chestY}
      C ${centerX - cw + 3},${chestY + 15}
        ${centerX - ww - 2},${waistY - 10}
        ${centerX - ww},${waistY + 5}
      L ${centerX + ww},${waistY + 5}
      C ${centerX + ww + 2},${waistY - 10}
        ${centerX + cw - 3},${chestY + 15}
        ${centerX + cw},${chestY}
      L ${centerX + sw - 5},${shoulderY + sleeveLen + 5}
      L ${centerX + sw + 15},${shoulderY + sleeveLen}
      L ${centerX + sw},${shoulderY - 2}
      Q ${centerX},${shoulderY - 8}
        ${centerX - sw},${shoulderY - 2}
      Z
    `;
  } else if (topType === 'shirt') {
    // Dress shirt: longer sleeves, button line
    sleeveLen = armLen * 0.7;
    topPath = `
      M ${centerX - sw},${shoulderY - 2}
      L ${centerX - sw - 12},${shoulderY + 8}
      L ${centerX - sw - 15},${shoulderY + sleeveLen}
      L ${centerX - sw - 5},${shoulderY + sleeveLen + 3}
      L ${centerX - sw + 8},${shoulderY + 25}
      L ${centerX - cw},${chestY}
      C ${centerX - cw + 3},${chestY + 15}
        ${centerX - ww - 2},${waistY - 10}
        ${centerX - ww},${waistY + 10}
      L ${centerX + ww},${waistY + 10}
      C ${centerX + ww + 2},${waistY - 10}
        ${centerX + cw - 3},${chestY + 15}
        ${centerX + cw},${chestY}
      L ${centerX + sw - 8},${shoulderY + 25}
      L ${centerX + sw + 5},${shoulderY + sleeveLen + 3}
      L ${centerX + sw + 15},${shoulderY + sleeveLen}
      L ${centerX + sw + 12},${shoulderY + 8}
      L ${centerX + sw},${shoulderY - 2}
      L ${centerX + 8},${shoulderY - 5}
      L ${centerX - 8},${shoulderY - 5}
      Z
    `;
  }
  
  if (!topPath) return null;
  
  const group = createSvgElement('g', { class: 'clothing-top' });
  
  // Main garment
  group.appendChild(createSvgElement('path', {
    d: topPath,
    fill: '#679b9b',
    stroke: '#637373',
    'stroke-width': '1',
    opacity: '0.9'
  }));
  
  // Add collar for shirt
  if (topType === 'shirt') {
    const collarPath = `
      M ${centerX - 12},${shoulderY - 5}
      L ${centerX - 8},${shoulderY + 10}
      L ${centerX},${shoulderY + 5}
      L ${centerX + 8},${shoulderY + 10}
      L ${centerX + 12},${shoulderY - 5}
    `;
    group.appendChild(createSvgElement('path', {
      d: collarPath,
      fill: 'none',
      stroke: '#637373',
      'stroke-width': '1.5'
    }));
  }
  
  return group;
}

function renderBottomClothing(geo, bottomType, fit) {
  if (bottomType === 'none') return null;
  
  const { centerX, waistW, waistY, hipW, hipY, legStartY, legLen, legWidth } = geo;
  const ease = FIT_EASE[fit] || FIT_EASE.regular;
  
  // Adjust widths with ease
  const ww = waistW + ease;
  const hw = hipW + ease;
  
  let bottomPath;
  
  if (bottomType === 'pants') {
    // Pants: follows leg shape
    const pantLen = legLen * 0.95;
    const pantLegW = legWidth + ease / 2;
    
    bottomPath = `
      M ${centerX - ww - 3},${waistY}
      L ${centerX - hw - 5},${hipY}
      L ${centerX - hw + 5},${legStartY}
      L ${centerX - pantLegW - 8},${legStartY}
      L ${centerX - pantLegW - 10},${legStartY + pantLen}
      L ${centerX - 5},${legStartY + pantLen}
      L ${centerX - 5},${legStartY + 15}
      L ${centerX + 5},${legStartY + 15}
      L ${centerX + 5},${legStartY + pantLen}
      L ${centerX + pantLegW + 10},${legStartY + pantLen}
      L ${centerX + pantLegW + 8},${legStartY}
      L ${centerX + hw - 5},${legStartY}
      L ${centerX + hw + 5},${hipY}
      L ${centerX + ww + 3},${waistY}
      Z
    `;
  } else if (bottomType === 'skirt') {
    // Skirt: A-line shape
    const skirtLen = legLen * 0.4;
    const skirtBottomW = hw + 20 + ease;
    
    bottomPath = `
      M ${centerX - ww - 3},${waistY}
      C ${centerX - ww - 5},${waistY + 15}
        ${centerX - hw - 10},${hipY - 5}
        ${centerX - hw - 8},${hipY}
      L ${centerX - skirtBottomW},${hipY + skirtLen}
      Q ${centerX},${hipY + skirtLen + 10}
        ${centerX + skirtBottomW},${hipY + skirtLen}
      L ${centerX + hw + 8},${hipY}
      C ${centerX + hw + 10},${hipY - 5}
        ${centerX + ww + 5},${waistY + 15}
        ${centerX + ww + 3},${waistY}
      Z
    `;
  }
  
  if (!bottomPath) return null;
  
  const group = createSvgElement('g', { class: 'clothing-bottom' });
  
  group.appendChild(createSvgElement('path', {
    d: bottomPath,
    fill: '#637373',
    stroke: '#637373',
    'stroke-width': '1',
    opacity: '0.9'
  }));
  
  // Add waistband
  const waistbandPath = `
    M ${centerX - ww - 5},${waistY - 2}
    L ${centerX - ww - 3},${waistY + 6}
    L ${centerX + ww + 3},${waistY + 6}
    L ${centerX + ww + 5},${waistY - 2}
    Z
  `;
  group.appendChild(createSvgElement('path', {
    d: waistbandPath,
    fill: '#637373',
    stroke: '#637373',
    'stroke-width': '1'
  }));
  
  return group;
}

// ============================================================================
// SIZE RECOMMENDATION ENGINE
// ============================================================================

function recommendSize(spec, garmentType) {
  const chart = SIZE_CHARTS[garmentType];
  if (!chart) return { size: '-', reason: '' };
  
  let primaryMeasure, secondaryMeasure, primaryName, secondaryName;
  
  if (garmentType === 'top') {
    primaryMeasure = spec.chestCircumference;
    secondaryMeasure = spec.waistCircumference;
    primaryName = '가슴둘레';
    secondaryName = '허리둘레';
  } else {
    primaryMeasure = spec.hipCircumference;
    secondaryMeasure = spec.waistCircumference;
    primaryName = '엉덩이둘레';
    secondaryName = '허리둘레';
  }
  
  const sizes = ['S', 'M', 'L', 'XL'];
  let recommendedSize = 'XL+';
  let limitingFactor = primaryName;
  
  for (const size of sizes) {
    const limits = chart[size];
    const primaryKey = garmentType === 'top' ? 'chestMax' : 'hipMax';
    
    if (primaryMeasure <= limits[primaryKey]) {
      if (secondaryMeasure <= limits.waistMax) {
        recommendedSize = size;
        limitingFactor = primaryMeasure > secondaryMeasure * 1.2 ? primaryName : secondaryName;
        break;
      } else {
        // Waist is limiting factor
        recommendedSize = size;
        limitingFactor = secondaryName;
      }
    }
  }
  
  // Apply fit adjustment
  if (currentFit === 'slim' && recommendedSize !== 'S') {
    const idx = sizes.indexOf(recommendedSize);
    if (idx > 0) {
      recommendedSize = sizes[idx - 1] + ' (슬림핏)';
    }
  } else if (currentFit === 'oversized' && recommendedSize !== 'XL' && recommendedSize !== 'XL+') {
    const idx = sizes.indexOf(recommendedSize);
    if (idx < sizes.length - 1 && idx >= 0) {
      recommendedSize = sizes[idx + 1] + ' (오버핏)';
    }
  }
  
  return {
    size: recommendedSize,
    reason: `${limitingFactor} 기준`
  };
}

// ============================================================================
// MAIN RENDER FUNCTION
// ============================================================================

function renderAvatarFromSpec(spec) {
  // 1. Compute geometry
  const geo = computeAvatarGeometry(spec);
  
  // 2. Create SVG
  const svg = createSvgElement('svg', {
    width: geo.svgW,
    height: geo.svgH,
    viewBox: `0 0 ${geo.svgW} ${geo.svgH}`
  });
  svg.style.display = 'block';
  svg.style.margin = '0 auto';
  
  // 3. Render body parts (order matters for layering)
  
  // Legs (back layer)
  const legs = renderLegsSvg(geo);
  legs.forEach(leg => svg.appendChild(leg));
  
  // Bottom clothing (if any)
  const bottomClothing = renderBottomClothing(geo, currentClothing.bottom, currentFit);
  if (bottomClothing) svg.appendChild(bottomClothing);
  
  // Torso
  svg.appendChild(renderBodySvg(geo));
  
  // Arms
  const arms = renderArmsSvg(geo);
  arms.forEach(arm => svg.appendChild(arm));
  
  // Top clothing (if any)
  const topClothing = renderTopClothing(geo, currentClothing.top, currentFit);
  if (topClothing) svg.appendChild(topClothing);
  
  // Neck
  svg.appendChild(renderNeckSvg(geo));
  
  // Head (top layer)
  svg.appendChild(renderHeadSvg(geo));
  
  // 4. Build info panel
  const info = document.createElement('div');
  info.className = 'avatar-info-panel';
  info.style.textAlign = 'left';
  info.style.color = '#fff';
  info.style.minWidth = '150px';
  
  let infoHtml = `
    <h3 style="margin:0 0 12px 0; color:var(--text-secondary);">나의 아바타</h3>
    <p style="margin:4px 0;"><strong>키:</strong> ${spec.height}cm</p>
    <p style="margin:4px 0;"><strong>몸무게:</strong> ${spec.weight}kg</p>
    <p style="margin:4px 0;"><strong>성별:</strong> ${spec.gender === 'M' ? '남성' : '여성'}</p>
  `;
  
  // Add size recommendations if clothing selected
  if (currentClothing.top !== 'none') {
    const topRec = recommendSize(spec, 'top');
    infoHtml += `
      <hr style="border-color:rgba(255,255,255,0.2); margin:12px 0;">
      <p style="margin:4px 0;"><strong>상의 사이즈:</strong> ${topRec.size}</p>
      <p style="margin:4px 0; font-size:0.85em; color:var(--teal);">${topRec.reason}</p>
    `;
  }
  
  if (currentClothing.bottom !== 'none') {
    const bottomRec = recommendSize(spec, 'bottom');
    infoHtml += `
      <p style="margin:4px 0;"><strong>하의 사이즈:</strong> ${bottomRec.size}</p>
      <p style="margin:4px 0; font-size:0.85em; color:var(--teal);">${bottomRec.reason}</p>
    `;
  }
  
  info.innerHTML = infoHtml;
  
  // 5. Assemble container
  const container = document.getElementById('avatarContainer');
  container.innerHTML = '';
  
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'flex-start';
  wrapper.style.gap = '24px';
  wrapper.style.flexWrap = 'wrap';
  wrapper.style.justifyContent = 'center';
  
  const svgWrap = document.createElement('div');
  svgWrap.appendChild(svg);
  wrapper.appendChild(svgWrap);
  wrapper.appendChild(info);
  container.appendChild(wrapper);
}

// ============================================================================
// SLIDER AND UI BINDINGS
// ============================================================================

function applyGenderDefaults() {
  const g = (genderSel && genderSel.value === 'F') ? 'F' : 'M';
  const avg = AVG[g];
  
  const sliderConfigs = [
    { el: neckCircumference, val: neckCircumferenceValue, key: 'neckCircumference' },
    { el: shoulderSpan, val: shoulderSpanValue, key: 'shoulderSpan' },
    { el: chestCircumference, val: chestCircumferenceValue, key: 'chestCircumference' },
    { el: waistCircumference, val: waistCircumferenceValue, key: 'waistCircumference' },
    { el: hipCircumference, val: hipCircumferenceValue, key: 'hipCircumference' },
    { el: armInsideLength, val: armInsideLengthValue, key: 'armInsideLength' },
    { el: legInsideLength, val: legInsideLengthValue, key: 'legInsideLength' },
    { el: neckToWaistVertical, val: neckToWaistVerticalValue, key: 'neckToWaistVertical' }
  ];
  
  sliderConfigs.forEach(({ el, val, key }) => {
    if (!el || !val) return;
    const v = avg[key];
    el.min = v * 0.75;
    el.max = v * 1.25;
    el.value = v;
    val.textContent = v.toFixed(1) + ' cm';
  });
}

function enableSliders() {
  const sliderIds = [
    'neckCircumference', 'shoulderSpan', 'chestCircumference', 
    'waistCircumference', 'hipCircumference', 'armInsideLength', 
    'legInsideLength', 'neckToWaistVertical'
  ];
  sliderIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = false;
  });
}

function bindSliders() {
  const sliders = [
    { id: 'neckCircumference', key: 'neckCircumference' },
    { id: 'shoulderSpan', key: 'shoulderSpan' },
    { id: 'chestCircumference', key: 'chestCircumference' },
    { id: 'waistCircumference', key: 'waistCircumference' },
    { id: 'hipCircumference', key: 'hipCircumference' },
    { id: 'armInsideLength', key: 'armInsideLength' },
    { id: 'legInsideLength', key: 'legInsideLength' },
    { id: 'neckToWaistVertical', key: 'neckToWaistVertical' }
  ];
  
  sliders.forEach(s => {
    const el = document.getElementById(s.id);
    if (!el) return;
    
    el.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      if (Number.isNaN(value)) return;
      
      const sliderGroup = el.closest('.slider-group');
      if (sliderGroup) {
        sliderGroup.classList.add('active');
        setTimeout(() => sliderGroup.classList.remove('active'), 300);
      }
      
      if (!currentSpec) {
        const h = parseInt(heightInput.value, 10);
        const w = parseInt(weightInput.value, 10);
        const g = (genderSel && genderSel.value) ? genderSel.value : 'M';
        const base = AVG[g];
        currentSpec = {
          height: isNaN(h) ? 175 : h,
          weight: isNaN(w) ? 70 : w,
          gender: g,
          ...base
        };
        avatarArea.style.display = 'block';
        controls.style.display = 'block';
      }
      
      // Update spec and re-render
      currentSpec[s.key] = value;
      const disp = document.getElementById(s.id + 'Value');
      if (disp) disp.textContent = value.toFixed(1) + ' cm';
      renderAvatarFromSpec(currentSpec);
    });
  });
}

function bindClothingControls() {
  topSelector = document.getElementById('topSelector');
  bottomSelector = document.getElementById('bottomSelector');
  fitSelector = document.getElementById('fitSelector');
  
  if (topSelector) {
    topSelector.addEventListener('change', (e) => {
      currentClothing.top = e.target.value;
      if (currentSpec) renderAvatarFromSpec(currentSpec);
    });
  }
  
  if (bottomSelector) {
    bottomSelector.addEventListener('change', (e) => {
      currentClothing.bottom = e.target.value;
      if (currentSpec) renderAvatarFromSpec(currentSpec);
    });
  }
  
  if (fitSelector) {
    fitSelector.addEventListener('change', (e) => {
      currentFit = e.target.value;
      if (currentSpec) renderAvatarFromSpec(currentSpec);
    });
  }
}

function updateCenterForGender() {
  const g = (genderSel && genderSel.value) ? genderSel.value : 'M';
  applyGenderDefaults();
  
  if (currentSpec) {
    const avg = AVG[g];
    currentSpec.gender = g;
      Object.keys(avg).forEach(key => {
        currentSpec[key] = avg[key];
        const el = document.getElementById(key);
        const disp = document.getElementById(key + 'Value');
        if (el) el.value = avg[key];
        if (disp) disp.textContent = avg[key].toFixed(1) + ' cm';
      });
    renderAvatarFromSpec(currentSpec);
  }
}


function toggleLoading(isLoading) {
  const loadingOverlay = document.getElementById('loadingState');
  if (loadingOverlay) {
    loadingOverlay.style.display = isLoading ? 'flex' : 'none';
  }
}

function bindAll() {
  // Brand click to reload
  if (brand) {
    brand.addEventListener('click', () => location.reload());
  }
  
  // Gender change
  if (genderSel) {
    genderSel.addEventListener('change', () => {
      updateCenterForGender();
      currentSpec = null; // Reset on gender change
      
      // Reset UI to placeholder state
      if (avatarArea) avatarArea.style.display = 'none';
      const placeholder = document.getElementById('placeholderState');
      if (placeholder) placeholder.style.display = 'flex';
    });
  }
  
  // Apply initial gender defaults
  applyGenderDefaults();
  
  // Generate button
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      toggleLoading(true);
      
      // Simulate processing delay for better UX
      setTimeout(() => {
        let h = parseInt(heightInput.value, 10);
        let w = parseInt(weightInput.value, 10);
        if (isNaN(h)) h = 175;
        if (isNaN(w)) w = 70;
        const g = genderSel ? genderSel.value : 'M';
        const base = AVG[g];
        
        currentSpec = {
          height: h,
          weight: w,
          gender: g,
          ...base
        };
        
        renderAvatarFromSpec(currentSpec);
        enableSliders();
        
        if (avatarArea) avatarArea.style.display = 'flex';
        const placeholder = document.getElementById('placeholderState');
        if (placeholder) placeholder.style.display = 'none';
        
        // Sync sliders to spec
        const keys = Object.keys(base);
        keys.forEach(key => {
          const el = document.getElementById(key);
          const disp = document.getElementById(key + 'Value');
          if (el) el.value = currentSpec[key];
          if (disp) disp.textContent = currentSpec[key].toFixed(1) + ' cm';
        });
        
        toggleLoading(false);
      }, 600);
    });
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  bindAll();
  bindSliders();
  bindClothingControls();
});
