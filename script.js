// Final robust script: 8 sliders mapped to body parts, gender-based average initialisation, live rendering

// Average values by gender (cm) as given by request
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

let currentSpec = null;

// DOM bindings
const brand = document.getElementById('brand');
brand && brand.addEventListener('click', () => location.reload());

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

// Initialize defaults based on gender when page loads, and when gender changes
function applyGenderDefaults(){
  const g = (genderSel.value === 'F') ? 'F' : 'M';
  const avg = AVG[g];
  neckCircumference.min = avg.neckCircumference * 0.75; neckCircumference.max = avg.neckCircumference * 1.25; neckCircumference.value = avg.neckCircumference; neckCircumferenceValue.textContent = avg.neckCircumference.toFixed(2);
  shoulderSpan.min = avg.shoulderSpan * 0.75; shoulderSpan.max = avg.shoulderSpan * 1.25; shoulderSpan.value = avg.shoulderSpan; shoulderSpanValue.textContent = avg.shoulderSpan.toFixed(2);
  chestCircumference.min = avg.chestCircumference * 0.75; chestCircumference.max = avg.chestCircumference * 1.25; chestCircumference.value = avg.chestCircumference; chestCircumferenceValue.textContent = avg.chestCircumference.toFixed(2);
  waistCircumference.min = avg.waistCircumference * 0.75; waistCircumference.max = avg.waistCircumference * 1.25; waistCircumference.value = avg.waistCircumference; waistCircumferenceValue.textContent = avg.waistCircumference.toFixed(2);
  hipCircumference.min = avg.hipCircumference * 0.75; hipCircumference.max = avg.hipCircumference * 1.25; hipCircumference.value = avg.hipCircumference; hipCircumferenceValue.textContent = avg.hipCircumference.toFixed(2);
  armInsideLength.min = avg.armInsideLength * 0.75; armInsideLength.max = avg.armInsideLength * 1.25; armInsideLength.value = avg.armInsideLength; armInsideLengthValue.textContent = avg.armInsideLength.toFixed(2);
  legInsideLength.min = avg.legInsideLength * 0.75; legInsideLength.max = avg.legInsideLength * 1.25; legInsideLength.value = avg.legInsideLength; legInsideLengthValue.textContent = avg.legInsideLength.toFixed(2);
  neckToWaistVertical.min = avg.neckToWaistVertical * 0.75; neckToWaistVertical.max = avg.neckToWaistVertical * 1.25; neckToWaistVertical.value = avg.neckToWaistVertical; neckToWaistVerticalValue.textContent = avg.neckToWaistVertical.toFixed(2);
}

// render avatar
function renderAvatarFromSpec(spec){
  const svgW = 320, svgH = 420; const heightPx = spec.height * 2;
  // Neck width should reflect neck circumference but stay visually reasonable relative to shoulders
  let neckW = Math.max(6, spec.neckCircumference / Math.PI);
  const shoulderW = Math.max(40, spec.shoulderSpan / 2);
  const maxNeckW = Math.max(6, shoulderW * 0.9);
  neckW = Math.min(neckW, maxNeckW);
  // Guard against NaN/undefined leading to invisible neck
  let neckH = Math.max(6, neckW * 0.6);
  if (!Number.isFinite(neckW) || neckW <= 0) {
    neckW = 12; neckH = 7;
  }
  // Debug: observe neck geometry calculation path
  if (typeof console !== 'undefined') {
    console.log('neck geometry', { neckW, neckH, shoulderW, neckCircumference: spec.neckCircumference, heightPx });
  }
  const chestW = Math.max(50, spec.chestCircumference / (2*Math.PI));
  const waistW = Math.max(40, spec.waistCircumference / (2*Math.PI));
  const hipW = Math.max(50, spec.hipCircumference / (2*Math.PI));

  const neckY = 40;
  const torsoTopY = neckY + neckH + 6;
  const chestY = torsoTopY + heightPx * 0.18;
  const waistY = chestY + heightPx * 0.22;
  const hipY = waistY + heightPx * 0.20;
  const legLen = Math.min(heightPx * 0.45, svgH - hipY - 20);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', svgW); svg.setAttribute('height', svgH);
  svg.style.display='block'; svg.style.margin='0 auto';

  // 목 렌더링 포함
  // Neck will be drawn after other parts so it stays visible on top
  // 몸통
  const torso = document.createElementNS(svg.namespaceURI, 'polygon');
  const p1x = 160 - shoulderW, p1y = torsoTopY;
  const p2x = 160 + shoulderW, p2y = torsoTopY;
  const p3x = 160 + chestW, p3y = chestY;
  const p4x = 160 + hipW, p4y = hipY;
  const p5x = 160 - hipW, p5y = hipY;
  const p6x = 160 - chestW, p6y = chestY;
  torso.setAttribute('points', `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y} ${p5x},${p5y} ${p6x},${p6y}`);
  torso.setAttribute('fill', '#ff9a76');
  svg.appendChild(torso);

  // 팔
  const leftArm = document.createElementNS(svg.namespaceURI, 'rect'); leftArm.setAttribute('x', 160 - shoulderW - 24); leftArm.setAttribute('y', torsoTopY); leftArm.setAttribute('width', 12); leftArm.setAttribute('height', heightPx * 0.6); leftArm.setAttribute('fill', '#ffeadb'); svg.appendChild(leftArm);
  const rightArm = document.createElementNS(svg.namespaceURI, 'rect'); rightArm.setAttribute('x', 160 + shoulderW + 12); rightArm.setAttribute('y', torsoTopY); rightArm.setAttribute('width', 12); rightArm.setAttribute('height', heightPx * 0.6); rightArm.setAttribute('fill', '#ffeadb'); svg.appendChild(rightArm);

  // 다리
  const legLeft = document.createElementNS(svg.namespaceURI, 'rect'); legLeft.setAttribute('x', 160 - hipW/2 - 4); legLeft.setAttribute('y', hipY); legLeft.setAttribute('width', 6); legLeft.setAttribute('height', legLen); legLeft.setAttribute('fill', '#637373'); svg.appendChild(legLeft);
  const legRight = document.createElementNS(svg.namespaceURI, 'rect'); legRight.setAttribute('x', 160 + hipW/2 - 2); legRight.setAttribute('y', hipY); legRight.setAttribute('width', 6); legRight.setAttribute('height', legLen); legRight.setAttribute('fill', '#637373'); svg.appendChild(legRight);

  // Neck: drawn last to ensure visibility on top of other body parts
  const neck = document.createElementNS(svg.namespaceURI, 'ellipse');
  neck.setAttribute('cx', 160); neck.setAttribute('cy', neckY + neckH/2); neck.setAttribute('rx', neckW); neck.setAttribute('ry', neckH/2); neck.setAttribute('fill', '#ffeadb'); neck.setAttribute('stroke', '#000'); neck.setAttribute('stroke-width', '0.5'); svg.appendChild(neck);

  const info = document.createElement('div'); info.style.textAlign = 'center'; info.innerHTML = `<h3>나의 아바타</h3><p>키: ${spec.height}cm</p><p>몸무게: ${spec.weight}kg</p>`;
  const container = document.getElementById('avatarContainer'); container.innerHTML = ''; const wrapper = document.createElement('div'); wrapper.style.display='flex'; wrapper.style.alignItems='flex-start'; wrapper.style.gap='24px'; const svgWrap = document.createElement('div'); svgWrap.appendChild(svg); wrapper.appendChild(svgWrap); wrapper.appendChild(info); container.appendChild(wrapper);
}

function bindAll(){
  if (genderSel){ genderSel.addEventListener('change', () => { updateCenterForGender(); currentSpec = null; }); }
  // Initialize defaults on first load
  applyGenderDefaults();
  if (generateBtn){ generateBtn.addEventListener('click', () => {
      let h = parseInt(heightInput.value, 10); let w = parseInt(weightInput.value, 10);
      if (isNaN(h)) h = 180; if (isNaN(w)) w = 80; const g = genderSel.value;
      const base = AVG[g];
      currentSpec = {
        height: h, weight: w, gender: g,
        neckCircumference: base.neckCircumference,
        shoulderSpan: base.shoulderSpan,
        chestCircumference: base.chestCircumference,
        waistCircumference: base.waistCircumference,
        hipCircumference: base.hipCircumference,
        armInsideLength: base.armInsideLength,
        legInsideLength: base.legInsideLength,
        neckToWaistVertical: base.neckToWaistVertical
      };
      renderAvatarFromSpec(currentSpec);
      avatarArea.style.display = 'block';
      controls.style.display = 'block';
      // 중앙값으로 초기화
      neckCircumference.value = currentSpec.neckCircumference;
      shoulderSpan.value = currentSpec.shoulderSpan;
      chestCircumference.value = currentSpec.chestCircumference;
      waistCircumference.value = currentSpec.waistCircumference;
      hipCircumference.value = currentSpec.hipCircumference;
      armInsideLength.value = currentSpec.armInsideLength;
      legInsideLength.value = currentSpec.legInsideLength;
      neckToWaistVertical.value = currentSpec.neckToWaistVertical;
    });
  }
}

document.addEventListener('DOMContentLoaded', bindAll);

// 슬라이더 바인딩
function bindSliders(){
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
      if (!currentSpec) {
        // Initialize currentSpec from current UI defaults so sliders work immediately
        const h = parseInt(heightInput.value, 10);
        const w = parseInt(weightInput.value, 10);
        const g = (typeof genderSel !== 'undefined' && genderSel.value) ? genderSel.value : 'M';
        const base = AVG[g];
        currentSpec = {
          height: isNaN(h) ? 180 : h,
          weight: isNaN(w) ? 80 : w,
          gender: g,
          neckCircumference: base.neckCircumference,
          shoulderSpan: base.shoulderSpan,
          chestCircumference: base.chestCircumference,
          waistCircumference: base.waistCircumference,
          hipCircumference: base.hipCircumference,
          armInsideLength: base.armInsideLength,
          legInsideLength: base.legInsideLength,
          neckToWaistVertical: base.neckToWaistVertical
        };
        neckCircumference.value = currentSpec.neckCircumference;
        shoulderSpan.value = currentSpec.shoulderSpan;
        chestCircumference.value = currentSpec.chestCircumference;
        waistCircumference.value = currentSpec.waistCircumference;
        hipCircumference.value = currentSpec.hipCircumference;
        armInsideLength.value = currentSpec.armInsideLength;
        legInsideLength.value = currentSpec.legInsideLength;
        neckToWaistVertical.value = currentSpec.neckToWaistVertical;
        renderAvatarFromSpec(currentSpec);
        avatarArea.style.display = 'block';
        controls.style.display = 'block';
      } else {
        currentSpec[s.key] = value;
        const disp = document.getElementById(s.id + 'Value'); if (disp) disp.textContent = value.toFixed(2);
        renderAvatarFromSpec(currentSpec);
      }
    });
  });
}
document.addEventListener('DOMContentLoaded', bindSliders);

// Robust gender-centering helper
function updateCenterForGender() {
  const g = (typeof genderSel !== 'undefined' && genderSel && genderSel.value) ? genderSel.value : 'M';
  // First, apply gender defaults to ensure min/max and center values
  applyGenderDefaults();
  // If there's a known updater, try to use it
  if (typeof updateSlidersToGenderCenter === 'function') {
    try {
      updateSlidersToGenderCenter(g);
    } catch (e) {
      try { updateSlidersToGenderCenter(); } catch (e2) { /* ignore */ }
    }
  }
  // Sync currentSpec to the center values
  if (currentSpec) {
    const avg = AVG[g];
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
      const val = avg[s.key];
      el.value = val;
      const disp = document.getElementById(s.id + 'Value');
      if (disp) disp.textContent = val.toFixed(2);
      currentSpec[s.key] = val;
    });
    renderAvatarFromSpec(currentSpec);
  }
}
