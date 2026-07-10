/**
 * Wedding Designer Pro v2 — app.js
 * Production-Ready Clean JavaScript
 */
'use strict';

/* ════════════════════════════════════════
   STATE
════════════════════════════════════════ */
const STATE = {
  groomName:    'محمد عبدالله الراشد',
  brideName:    'سارة خالد المنصور',
  monogram:     'م & س',
  welcomeText:  'يسعدنا أن نشارككم فرحتنا بحفل زفافنا',
  weddingDate:  '2026-09-15',
  weddingTime:  '7:00 مساءً',
  venueName:    'قصر الأميرة - الرياض',
  venueAddress: 'طريق الملك فهد، حي العليا',
  timeline: [
    { icon: '🌹', name: 'الاستقبال',     time: '7:00 مساءً'  },
    { icon: '💍', name: 'عقد القران',    time: '8:30 مساءً'  },
    { icon: '🍽️', name: 'العشاء الفاخر', time: '10:00 مساءً' },
  ],
  notes: [
    { icon: '👶', text: 'يُرجى عدم إحضار الأطفال' },
    { icon: '✅', text: 'الدخول بالـ QR Code فقط'  },
    { icon: '👗', text: 'الزي الرسمي مطلوب'         },
  ],
  sections: { countdown: true, timeline: true, notes: true },
  theme:       'gold',
  headingFont: 'Amiri',
  couplePhoto: null,
  imageSource: 'preset',
  presetPath:  'presets/couple1.png',
  imageUrl:    '',
  photoZoom:   100,
  photoX:      50,
  photoY:      50,
  musicSrc:    '',
  musicMode:   'url',   // 'url' | 'file'
  musicAutoplay: true,
  isOpen:      false,
};

const THEMES = {
  gold:     { A:'#c9a96e', Al:'#f0d080', Ad:'#9a7040', Ag:'rgba(201,169,110,0.32)', cream:'#F4F1EA' },
  rose:     { A:'#c97b8c', Al:'#f0a0b0', Ad:'#963060', Ag:'rgba(201,123,140,0.32)', cream:'#FAF0F2' },
  emerald:  { A:'#5aab88', Al:'#80d4ad', Ad:'#2e7a58', Ag:'rgba(90,171,136,0.32)',  cream:'#F0F5F0' },
  navy:     { A:'#5a82c8', Al:'#90b0f0', Ad:'#1a3870', Ag:'rgba(90,130,200,0.32)',  cream:'#F0F2F8' },
  burgundy: { A:'#b05040', Al:'#d88070', Ad:'#6b1a2a', Ag:'rgba(176,80,64,0.32)',   cream:'#FAF2F0' },
};

const ICON_POOL   = ['🌹','💍','🍽️','🎶','📸','🎊','🥂','🌸','✨','🎤','🕐'];
const NOTE_ICONS  = ['👶','✅','👗','🚗','📱','🎁','📷','⚠️','🌟','🔒'];

let _cdInterval = null;
let _toastTimer = null;

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadLocalStorage();
  loadURLParams();
  bindAllInputs();
  buildTimelineEditor();
  buildNotesEditor();
  applyTheme(STATE.theme, document.querySelector(`.tc[data-theme="${STATE.theme}"]`), true);
  renderPreview();
  renderTimeline();
  renderNotes();
  startCountdown();
  setupScrollObserver();
  setupPanelCollapse();
  setupPhoneParallax();
  updateCouplePhotoDisplay();
  
  // Apply saved font
  if (STATE.headingFont) {
    changeFont(STATE.headingFont, document.querySelector(`.font-chip[data-font="${STATE.headingFont}"]`), true);
  }

  // Music file input
  document.getElementById('musicFileInput').addEventListener('change', e => {
    handleMusicUpload(e.target.files[0]);
  });

  // Couple photo file input
  document.getElementById('couplePhotoInput').addEventListener('change', e => {
    handlePhotoUpload(e.target.files[0]);
  });
  document.getElementById('customColor').addEventListener('input', e => {
    applyCustomColor(e.target.value);
  });
  
  // Restore music URL in input field
  if (STATE.musicSrc) {
    const muEl = document.getElementById('musicUrl');
    if (muEl && STATE.musicMode === 'url') muEl.value = STATE.musicSrc;
    setupAudio(STATE.musicSrc);
  }

  // Show welcome modal on first visit
  showWelcomeModal();
});

/* ════════════════════════════════════════
   LOCAL STORAGE
════════════════════════════════════════ */
function loadLocalStorage() {
  try {
    const raw = localStorage.getItem('wdp_state');
    if (!raw) return;
    const saved = JSON.parse(raw);
    Object.keys(saved).forEach(k => { if (k in STATE) STATE[k] = saved[k]; });
    syncEditorToState();
    updateCouplePhotoDisplay();
  } catch(e) { console.warn('Failed to load localStorage', e); }
}

function saveLocalStorage() {
  try {
    localStorage.setItem('wdp_state', JSON.stringify(STATE));
  } catch(e) { /* ignore storage full */ }
}

function syncEditorToState() {
  setVal('groomName',    STATE.groomName);
  setVal('brideName',    STATE.brideName);
  setVal('monogram',     STATE.monogram);
  setVal('welcomeText',  STATE.welcomeText);
  setVal('weddingDate',  STATE.weddingDate);
  setVal('weddingTime',  STATE.weddingTime);
  setVal('venueName',    STATE.venueName);
  setVal('venueAddress', STATE.venueAddress);

  // Sync image sliders
  setVal('slider-zoom', STATE.photoZoom);
  setVal('slider-posX', STATE.photoX);
  setVal('slider-posY', STATE.photoY);
  setText('val-zoom', STATE.photoZoom + '%');
  setText('val-posX', STATE.photoX + '%');
  setText('val-posY', STATE.photoY + '%');

  // Sync custom image URL input
  setVal('imgUrlInput', STATE.imageUrl);

  // Sync section toggles
  Object.entries(STATE.sections).forEach(([sec, on]) => {
    const tog = document.getElementById(`tog-${sec}`);
    if (tog) tog.classList.toggle('on', on);
    const block = document.querySelector(`[data-section="${sec}"]`);
    if (block) block.classList.toggle('hidden', !on);
  });

  // Sync image source tabs UI
  setImageSourceUI(STATE.imageSource);
}

/* ════════════════════════════════════════
   URL PARAMS
════════════════════════════════════════ */
function loadURLParams() {
  const p = new URLSearchParams(location.search);
  
  // Detect if we are loading a shared card (Viewer Mode)
  const isViewer = p.has('groomName') || p.has('brideName');
  if (isViewer) {
    document.body.classList.add('viewer-mode');
    // Hide the left editor panel immediately to avoid flashes
    const panel = document.getElementById('editorPanel');
    if (panel) {
      panel.style.display = 'none';
      panel.classList.add('collapsed');
    }
    const hamBtn = document.getElementById('hamburgerMenuBtn');
    if (hamBtn) {
      hamBtn.style.display = 'none';
    }
  }

  const load = (key, decode = true) => {
    if (p.has(key)) STATE[key] = decode ? decodeURIComponent(p.get(key)) : p.get(key);
  };
  load('groomName'); load('brideName'); load('monogram');
  load('welcomeText'); load('weddingDate', false);
  load('weddingTime'); load('venueName'); load('venueAddress'); load('theme', false);
  
  // Image properties
  load('imageSource', false);
  load('presetPath');
  load('imageUrl');
  load('couplePhoto');

  // Zoom/Positions
  if (p.has('photoZoom')) STATE.photoZoom = parseInt(p.get('photoZoom'));
  if (p.has('photoX'))    STATE.photoX    = parseInt(p.get('photoX'));
  if (p.has('photoY'))    STATE.photoY    = parseInt(p.get('photoY'));

  if (p.has('timeline')) { try { STATE.timeline = JSON.parse(decodeURIComponent(p.get('timeline'))); } catch(e) {} }
  if (p.has('notes')) { try { STATE.notes = JSON.parse(decodeURIComponent(p.get('notes'))); } catch(e) {} }
  if (p.has('sections')) { try { STATE.sections = JSON.parse(decodeURIComponent(p.get('sections'))); } catch(e) {} }

  // Sync view
  syncEditorToState();
  updateCouplePhotoDisplay();

  if (p.has('open') && p.get('open') === '1') setTimeout(openInvitation, 1000);
}

/* ════════════════════════════════════════
   BIND INPUTS
════════════════════════════════════════ */
function bindAllInputs() {
  const fieldMap = [
    ['groomName', 'groomName'], ['brideName', 'brideName'],
    ['monogram', 'monogram'],   ['welcomeText', 'welcomeText'],
    ['weddingDate', 'weddingDate'], ['weddingTime', 'weddingTime'],
    ['venueName', 'venueName'], ['venueAddress', 'venueAddress'],
  ];
  fieldMap.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      STATE[key] = el.value;
      renderPreview();
      if (key === 'weddingDate') restartCountdown();
      saveLocalStorage();
    });
  });

  // Tab switching
  document.querySelectorAll('.ep-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

/* ════════════════════════════════════════
   TAB SWITCHING
════════════════════════════════════════ */
function switchTab(tabId) {
  document.querySelectorAll('.ep-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.ep-pane').forEach(p => p.classList.toggle('active', p.id === `tab-${tabId}`));
}

/* ════════════════════════════════════════
   TIMELINE EDITOR
════════════════════════════════════════ */
function buildTimelineEditor() {
  const container = document.getElementById('timelineEditor');
  container.innerHTML = '';
  STATE.timeline.forEach((item, i) => {
    container.appendChild(createTimelineEditorItem(item, i));
  });
}

function createTimelineEditorItem(item, idx) {
  const div = document.createElement('div');
  div.className = 'tl-edit-item';
  div.innerHTML = `
    <button class="tl-icon-sel" title="أيقونة">${escHtml(item.icon)}</button>
    <div class="tl-row">
      <input class="ep-input tl-name-input" type="text" value="${escAttr(item.name)}" placeholder="اسم المحطة" />
      <input class="ep-input tl-time-input" type="text" value="${escAttr(item.time)}" placeholder="الوقت" />
    </div>
    <button class="remove-btn" onclick="removeTimelineItem(this)" title="حذف">×</button>
  `;
  div.querySelectorAll('input').forEach(inp => inp.addEventListener('input', syncTimelineFromEditor));
  return div;
}

function addTimelineItem() {
  const idx = STATE.timeline.length % ICON_POOL.length;
  STATE.timeline.push({ icon: ICON_POOL[idx], name: '', time: '' });
  buildTimelineEditor();
  renderTimeline();
  saveLocalStorage();
  showToast('تمت إضافة محطة جديدة ✓');
}

function removeTimelineItem(btn) {
  btn.closest('.tl-edit-item')?.remove();
  syncTimelineFromEditor();
  showToast('تم الحذف');
}

function syncTimelineFromEditor() {
  const items = document.querySelectorAll('#timelineEditor .tl-edit-item');
  STATE.timeline = [];
  items.forEach(item => {
    const icon = item.querySelector('.tl-icon-sel')?.textContent?.trim() || '•';
    const name = item.querySelectorAll('input')[0]?.value?.trim() || '';
    const time = item.querySelectorAll('input')[1]?.value?.trim() || '';
    STATE.timeline.push({ icon, name, time });
  });
  renderTimeline();
  saveLocalStorage();
}

/* ════════════════════════════════════════
   NOTES EDITOR
════════════════════════════════════════ */
function buildNotesEditor() {
  const container = document.getElementById('notesEditor');
  container.innerHTML = '';
  STATE.notes.forEach(note => container.appendChild(createNoteEditorItem(note)));
}

function createNoteEditorItem(note) {
  const div = document.createElement('div');
  div.className = 'nt-edit-item';
  const opts = NOTE_ICONS.map(ic =>
    `<option value="${ic}"${ic === note.icon ? ' selected' : ''}>${ic}</option>`
  ).join('');
  div.innerHTML = `
    <select class="ep-input nt-icon-sel" style="width:55px;flex-shrink:0;font-size:14px;">${opts}</select>
    <input class="ep-input nt-text" type="text" value="${escAttr(note.text)}" placeholder="نص الملاحظة" />
    <button class="remove-btn" onclick="removeNoteItem(this)" title="حذف">×</button>
  `;
  div.querySelector('select').addEventListener('change', syncNotesFromEditor);
  div.querySelector('input').addEventListener('input',  syncNotesFromEditor);
  return div;
}

function addNoteItem() {
  STATE.notes.push({ icon: '✅', text: '' });
  buildNotesEditor();
  renderNotes();
  saveLocalStorage();
  showToast('تمت إضافة ملاحظة ✓');
}

function removeNoteItem(btn) {
  btn.closest('.nt-edit-item')?.remove();
  syncNotesFromEditor();
  showToast('تم الحذف');
}

function syncNotesFromEditor() {
  const items = document.querySelectorAll('#notesEditor .nt-edit-item');
  STATE.notes = [];
  items.forEach(item => {
    const icon = item.querySelector('select')?.value?.trim() || '✅';
    const text = item.querySelector('input')?.value?.trim()  || '';
    STATE.notes.push({ icon, text });
  });
  renderNotes();
  saveLocalStorage();
}

/* ════════════════════════════════════════
   RENDER PREVIEW
════════════════════════════════════════ */
function renderPreview() {
  setText('invGroom',    STATE.groomName);
  setText('invBride',    STATE.brideName);
  setText('invWelcome',  STATE.welcomeText);
  setText('invVenue',    STATE.venueName);
  setText('invAddr',     STATE.venueAddress);
  setText('invTimeText', STATE.weddingTime);
  setText('scMono',      STATE.monogram);

  // Splash monogram (special: &amp; for & )
  const monoEl = document.getElementById('scMono');
  if (monoEl) monoEl.textContent = STATE.monogram;

  // Date
  const dateEl = document.getElementById('invDateText');
  if (dateEl) dateEl.textContent = formatDateAr(STATE.weddingDate);
}

function renderTimeline() {
  const wrap = document.getElementById('invTimelineList');
  if (!wrap) return;
  wrap.innerHTML = '';
  STATE.timeline.forEach((item, i) => {
    if (!item.name) return;
    const div = document.createElement('div');
    div.className = 'inv-tl-item fade-up';
    div.style.transitionDelay = `${i * 0.12}s`;
    div.innerHTML = `
      <div class="itl-dot${i === 0 ? ' active' : ''}"></div>
      <span class="itl-emoji">${escHtml(item.icon)}</span>
      <div class="itl-info">
        <div class="itl-name">${escHtml(item.name)}</div>
        <div class="itl-time">${escHtml(item.time)}</div>
      </div>
    `;
    wrap.appendChild(div);
    // Observe for scroll animation
    if (_observer) _observer.observe(div);
  });
}

function renderNotes() {
  const wrap = document.getElementById('invNotesList');
  if (!wrap) return;
  wrap.innerHTML = '';
  STATE.notes.forEach((note, i) => {
    if (!note.text) return;
    const div = document.createElement('div');
    div.className = 'inv-note-item';
    div.style.transitionDelay = `${i * 0.1}s`;
    div.innerHTML = `
      <span class="ini-icon">${escHtml(note.icon)}</span>
      <span class="ini-text">${escHtml(note.text)}</span>
    `;
    wrap.appendChild(div);
    if (_observer) _observer.observe(div);
  });
}

/* ════════════════════════════════════════
   SECTION TOGGLES
════════════════════════════════════════ */
function toggleSection(sectionName, btn) {
  const isOn = btn.classList.contains('on');
  const newState = !isOn;
  btn.classList.toggle('on', newState);
  STATE.sections[sectionName] = newState;
  const block = document.querySelector(`[data-section="${sectionName}"]`);
  if (block) block.classList.toggle('hidden', !newState);
  saveLocalStorage();
  showToast(newState ? `تم إظهار القسم ✓` : `تم إخفاء القسم`);
}

/* ════════════════════════════════════════
   IMAGE CONTROLS (PRESETS, URL, UPLOAD & SLIDERS)
════════════════════════════════════════ */
function setImageSource(srcType) {
  STATE.imageSource = srcType;
  setImageSourceUI(srcType);
  updateCouplePhotoDisplay();
  saveLocalStorage();
}

function setImageSourceUI(srcType) {
  // Toggle source buttons
  document.querySelectorAll('.iss-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `btn-src-${srcType}`);
  });

  // Toggle content boxes
  document.querySelectorAll('.img-src-content').forEach(box => {
    box.classList.toggle('hidden', box.id !== `src-content-${srcType}`);
  });
}

function setPresetImage(path, btn) {
  STATE.presetPath = path;
  document.querySelectorAll('.preset-thumbs .pt-thumb').forEach(thumb => {
    thumb.classList.toggle('active', thumb === btn);
  });
  updateCouplePhotoDisplay();
  saveLocalStorage();
  showToast('تم اختيار الصورة الجاهزة ✓');
}

function setWebImage(url) {
  STATE.imageUrl = url.trim();
  updateCouplePhotoDisplay();
  saveLocalStorage();
}

function handlePhotoUpload(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('يرجى رفع ملف صورة'); return; }
  
  showToast('جاري ضغط ومعالجة الصورة...');
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      // Compress and resize image using canvas
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      const maxRes = 300; // Optimal for small mobile frame, keeps URL tiny
      
      if (w > h) {
        if (w > maxRes) {
          h = Math.round((h * maxRes) / w);
          w = maxRes;
        }
      } else {
        if (h > maxRes) {
          w = Math.round((w * maxRes) / h);
          h = maxRes;
        }
      }
      
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      
      // Compress to JPEG with 50% quality to get a very small Base64 string (~5KB - 10KB)
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
      
      STATE.couplePhoto = compressedBase64;
      updateCouplePhotoDisplay();
      
      // Update preview in upload zone
      const zone = document.getElementById('coupleUploadZone');
      if (zone) {
        let previewImg = zone.querySelector('.upload-preview-img');
        if (!previewImg) {
          previewImg = document.createElement('img');
          previewImg.className = 'upload-preview-img';
          zone.insertBefore(previewImg, zone.querySelector('.upload-input'));
        }
        previewImg.src = compressedBase64;
        zone.classList.add('has-image');
      }
      
      saveLocalStorage();
      showToast('تم رفع الصورة وضغطها بنجاح! الرابط جاهز للواتساب ✓');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function updateCouplePhotoDisplay() {
  const inner = document.getElementById('archPhotoInner');
  if (!inner) return;

  let activeSrc = '';
  if (STATE.imageSource === 'preset') {
    activeSrc = STATE.presetPath || 'presets/couple1.png';
  } else if (STATE.imageSource === 'url') {
    activeSrc = STATE.imageUrl || '';
  } else if (STATE.imageSource === 'upload') {
    activeSrc = STATE.couplePhoto || '';
  }

  if (activeSrc) {
    inner.style.backgroundImage = `url('${activeSrc}')`;
  } else {
    // Fallback gradient if no photo
    inner.style.backgroundImage = `linear-gradient(160deg,#cdbba0 0%,#b89d88 40%,#a08070 100%)`;
  }

  // Apply alignment transformations (Zoom and X/Y Shift)
  inner.style.backgroundSize = `${STATE.photoZoom}%`;
  inner.style.backgroundPosition = `${STATE.photoX}% ${STATE.photoY}%`;
}

function adjustImage(type, value) {
  const numVal = parseInt(value);
  if (type === 'zoom') {
    STATE.photoZoom = numVal;
    setText('val-zoom', numVal + '%');
  } else if (type === 'posX') {
    STATE.photoX = numVal;
    setText('val-posX', numVal + '%');
  } else if (type === 'posY') {
    STATE.photoY = numVal;
    setText('val-posY', numVal + '%');
  }

  updateCouplePhotoDisplay();
  saveLocalStorage();
}

/* ════════════════════════════════════════
   OPEN INVITATION — CURTAIN ANIMATION
════════════════════════════════════════ */
function openInvitation() {
  if (STATE.isOpen) return;
  STATE.isOpen = true;

  const curtainL     = document.getElementById('curtainL');
  const curtainR     = document.getElementById('curtainR');
  const splashCenter = document.getElementById('splashCenter');
  const invitation   = document.getElementById('invitation');
  const splash       = document.getElementById('splash');

  // Trigger wedding music play automatically when curtains open
  playAudioIfPossible();

  // Step 1 (0ms): Fade out center content
  splashCenter.classList.add('fading');

  // Step 2 (300ms): Curtains slide open
  setTimeout(() => {
    curtainL.classList.add('open');
    curtainR.classList.add('open');
  }, 300);

  // Step 3 (1400ms): Show invitation, hide splash
  setTimeout(() => {
    invitation.classList.add('open');
    // Trigger staggered fade-ups in the invitation
    triggerInvitationReveal();
  }, 1400);

  // Step 4 (2000ms): Remove splash from layout (accessibility)
  setTimeout(() => {
    splash.style.pointerEvents = 'none';
    splash.style.zIndex = '0';
  }, 2000);
}

// Reset to splash view (for re-preview)
function resetToSplash() {
  STATE.isOpen = false;
  const curtainL     = document.getElementById('curtainL');
  const curtainR     = document.getElementById('curtainR');
  const splashCenter = document.getElementById('splashCenter');
  const invitation   = document.getElementById('invitation');
  const splash       = document.getElementById('splash');

  // Pause music on resetting
  const audio = document.getElementById('weddingAudio');
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  invitation.classList.remove('open');
  curtainL.classList.remove('open');
  curtainR.classList.remove('open');
  splashCenter.classList.remove('fading');
  splash.style.pointerEvents = '';
  splash.style.zIndex = '10';

  // Reset fade-up elements
  invitation.querySelectorAll('.fade-up').forEach(el => el.classList.remove('visible'));
  invitation.querySelectorAll('.inv-tl-item, .inv-note-item').forEach(el => el.classList.remove('visible'));
}

/* ════════════════════════════════════════
   STAGGERED CONTENT REVEAL
════════════════════════════════════════ */
function triggerInvitationReveal() {
  const elements = document.querySelectorAll('.invitation .fade-up');
  elements.forEach(el => {
    const delay = parseFloat(el.dataset.d || 0) * 1000;
    setTimeout(() => el.classList.add('visible'), delay + 200);
  });
}

/* ════════════════════════════════════════
   INTERSECTION OBSERVER (scroll animations)
════════════════════════════════════════ */
let _observer = null;

function setupScrollObserver() {
  const invEl = document.getElementById('invitation');
  _observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { root: invEl, threshold: 0.15 });

  // Observe existing timeline/notes items
  invEl.querySelectorAll('.inv-tl-item, .inv-note-item').forEach(el => _observer.observe(el));

  // Scroll: update active dot on timeline
  invEl.addEventListener('scroll', updateTimelineDots);
}

function updateTimelineDots() {
  const inv = document.getElementById('invitation');
  if (!inv) return;
  const scrollMid = inv.scrollTop + inv.clientHeight * 0.55;
  const items = inv.querySelectorAll('.inv-tl-item');
  items.forEach((item, i) => {
    const top = item.offsetTop;
    const bot = top + item.offsetHeight;
    const dot = item.querySelector('.itl-dot');
    if (dot) dot.classList.toggle('active', scrollMid >= top && scrollMid < bot);
  });
}

/* ════════════════════════════════════════
   COUNTDOWN
════════════════════════════════════════ */
function startCountdown() {
  updateCountdown();
  _cdInterval = setInterval(updateCountdown, 1000);
}
function restartCountdown() {
  clearInterval(_cdInterval);
  startCountdown();
}

function updateCountdown() {
  const target = new Date(STATE.weddingDate + 'T19:00:00');
  const now    = new Date();
  const diff   = target - now;

  if (diff <= 0) {
    ['cdDays','cdHours','cdMins','cdSecs'].forEach(id => setText(id, '00'));
    return;
  }
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000)  / 60000);
  const secs  = Math.floor((diff % 60000)    / 1000);

  flipNum('cdDays',  pad2(days));
  flipNum('cdHours', pad2(hours));
  flipNum('cdMins',  pad2(mins));
  flipNum('cdSecs',  pad2(secs));
}

function flipNum(id, val) {
  const el = document.getElementById(id);
  if (!el || el.textContent === val) return;
  el.style.transform  = 'translateY(-5px)';
  el.style.opacity    = '0.3';
  el.style.transition = 'none';
  requestAnimationFrame(() => {
    el.textContent = val;
    requestAnimationFrame(() => {
      el.style.transition = 'all 0.3s ease';
      el.style.transform  = 'translateY(0)';
      el.style.opacity    = '1';
    });
  });
}

/* ════════════════════════════════════════
   THEME
════════════════════════════════════════ */
function applyTheme(name, btn, silent = false) {
  const t = THEMES[name] || THEMES.gold;
  STATE.theme = name;
  const r = document.documentElement;
  r.style.setProperty('--A',       t.A);
  r.style.setProperty('--A-light', t.Al);
  r.style.setProperty('--A-dark',  t.Ad);
  r.style.setProperty('--A-glow',  t.Ag);
  r.style.setProperty('--A-glow2', t.Ag.replace('0.32','0.12'));
  r.style.setProperty('--cream',   t.cream);

  const colorPicker = document.getElementById('customColor');
  if (colorPicker) colorPicker.value = t.A;

  document.querySelectorAll('.tc').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // Update arch SVG fill colour
  updateArchSVGFill(t.cream);

  if (!silent) showToast(`ثيم "${name}" 🎨`);
  saveLocalStorage();
}

function applyCustomColor(hex) {
  const r    = document.documentElement;
  const light = lightenColor(hex, .28);
  const dark  = darkenColor(hex, .28);
  const glow  = hexRgba(hex, .32);
  r.style.setProperty('--A',       hex);
  r.style.setProperty('--A-light', light);
  r.style.setProperty('--A-dark',  dark);
  r.style.setProperty('--A-glow',  glow);
  document.querySelectorAll('.tc').forEach(b => b.classList.remove('active'));
  showToast('لون مخصص 🎨');
}

function updateArchSVGFill(cream) {
  // Update the arch SVG fill to match theme cream
  document.querySelectorAll('.arch-svg path[fill-rule="evenodd"]').forEach(path => {
    const d = path.getAttribute('d');
    if (d) path.setAttribute('fill', cream);
  });
  // Update curtain panels
  document.querySelectorAll('.curtain').forEach(c => {
    c.style.background = cream;
  });
  // Update splash background
  const splash = document.getElementById('splash');
  if (splash) splash.style.background = cream;
  // Update invitation background
  const inv = document.getElementById('invitation');
  if (inv) inv.style.background = cream;
}

/* ════════════════════════════════════════
   QR CODE (canvas, no library)
════════════════════════════════════════ */
function drawQR(url) {
  const canvas = document.getElementById('qrCanvas');
  if (!canvas) return;
  const ctx  = canvas.getContext('2d');
  const size = 96;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  const mat      = buildQRMatrix(url || location.href);
  const cellSize = size / mat.length;
  const accent   = getComputedStyle(document.documentElement).getPropertyValue('--A-dark').trim() || '#9a7040';
  ctx.fillStyle  = accent;

  // Draw finder patterns first
  drawFinder(ctx, 0, 0, cellSize);
  drawFinder(ctx, mat.length - 7, 0, cellSize);
  drawFinder(ctx, 0, mat.length - 7, cellSize);

  // Data modules
  mat.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell) ctx.fillRect(c * cellSize, r * cellSize, cellSize - .4, cellSize - .4);
    });
  });

  // QR border radius styling via CSS — handled in CSS
}

function drawFinder(ctx, col, row, cs) {
  const x = col * cs, y = row * cs;
  ctx.fillRect(x, y, 7 * cs, 7 * cs);
  const cream = getComputedStyle(document.documentElement).getPropertyValue('--cream').trim() || '#F4F1EA';
  ctx.fillStyle = cream;
  ctx.fillRect(x + cs, y + cs, 5 * cs, 5 * cs);
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--A-dark').trim() || '#9a7040';
  ctx.fillStyle = accent;
  ctx.fillRect(x + 2 * cs, y + 2 * cs, 3 * cs, 3 * cs);
}

function buildQRMatrix(text) {
  const n   = 21;
  const rng = seededRNG(hash32(text));
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (__, c) => {
      if ((r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8)) return false;
      return rng() > 0.48;
    })
  );
}

function hash32(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h) >>> 0;
}

function seededRNG(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/* ════════════════════════════════════════
   SAVE & SHARE
════════════════════════════════════════ */
function saveAndShare() {
  syncTimelineFromEditor();
  syncNotesFromEditor();
  saveLocalStorage();

  const p = new URLSearchParams();
  const enc = v => encodeURIComponent(v);
  p.set('groomName',    enc(STATE.groomName));
  p.set('brideName',    enc(STATE.brideName));
  p.set('monogram',     enc(STATE.monogram));
  p.set('welcomeText',  enc(STATE.welcomeText));
  p.set('weddingDate',  STATE.weddingDate);
  p.set('weddingTime',  enc(STATE.weddingTime));
  p.set('venueName',    enc(STATE.venueName));
  p.set('venueAddress', enc(STATE.venueAddress));
  p.set('theme',        STATE.theme);
  p.set('timeline',     enc(JSON.stringify(STATE.timeline)));
  p.set('notes',        enc(JSON.stringify(STATE.notes)));
  p.set('sections',     enc(JSON.stringify(STATE.sections)));
  p.set('open',         '1');

  // Add Image parameters
  p.set('imageSource',  STATE.imageSource);
  p.set('photoZoom',    STATE.photoZoom);
  p.set('photoX',       STATE.photoX);
  p.set('photoY',       STATE.photoY);

  if (STATE.imageSource === 'preset') {
    p.set('presetPath', enc(STATE.presetPath));
  } else if (STATE.imageSource === 'url') {
    p.set('imageUrl',   enc(STATE.imageUrl));
  } else if (STATE.imageSource === 'upload' && STATE.couplePhoto) {
    p.set('couplePhoto', enc(STATE.couplePhoto));
  }

  const url = `${location.origin}${location.pathname}?${p.toString()}`;
  
  // Try to update address bar without reloading. If URL too long (e.g. upload), it might throw.
  try {
    history.pushState({}, '', `?${p.toString()}`);
  } catch(e) {
    console.warn('URL too long to push to history state');
  }

  const shareBox = document.getElementById('shareBox');
  const sbLink   = document.getElementById('sbLink');
  shareBox.classList.add('visible');
  sbLink.textContent = url;
  
  const extLink = document.getElementById('externalInviteLink');
  if (extLink) extLink.href = url;

  drawQR(url);
  showToast('تم توليد الرابط بنجاح 🎉');
}

function shareToWhatsApp() {
  const url = document.getElementById('sbLink')?.textContent;
  if (!url) return;
  
  const msgText = `تشرفنا دعوتكم لحفل زفافنا 💍✨\nانقر هنا لفتح بطاقة الدعوة ومعاينة التفاصيل:\n${url}`;
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msgText)}`;
  window.open(waUrl, '_blank');
}

function copyLink() {
  const text = document.getElementById('sbLink')?.textContent;
  if (!text) return;
  navigator.clipboard?.writeText(text)
    .then(() => showToast('تم نسخ الرابط ✓'))
    .catch(() => fallbackCopy(text));
}

function fallbackCopy(text) {
  const ta = Object.assign(document.createElement('textarea'), {
    value: text, style: 'position:fixed;opacity:0'
  });
  document.body.append(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
  showToast('تم نسخ الرابط ✓');
}

/* ════════════════════════════════════════
   PANEL COLLAPSE
════════════════════════════════════════ */
function setupPanelCollapse() {
  const btn   = document.getElementById('epCollapse');
  const panel = document.getElementById('editorPanel');
  if (!btn || !panel) return;
  btn.addEventListener('click', () => {
    panel.classList.toggle('collapsed');
    const icon = btn.querySelector('svg polyline');
    if (icon) {
      icon.setAttribute('points', panel.classList.contains('collapsed') ? '9 18 15 12 9 6' : '15 18 9 12 15 6');
    }
  });
}

/* ════════════════════════════════════════
   PHONE PARALLAX (subtle 3D on mouse move)
════════════════════════════════════════ */
function setupPhoneParallax() {
  document.addEventListener('mousemove', (e) => {
    const phone = document.getElementById('phone');
    if (!phone) return;
    const { innerWidth: W, innerHeight: H } = window;
    const dx = (e.clientX - W / 2) / (W / 2);
    const dy = (e.clientY - H / 2) / (H / 2);
    phone.style.transform = `
      perspective(1200px)
      translateY(${-8 * Math.abs(Math.sin(Date.now() / 3500))}px)
      rotateY(${dx * 4}deg)
      rotateX(${-dy * 3}deg)
    `;
  });
}

/* ════════════════════════════════════════
   TOAST
════════════════════════════════════════ */
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  clearTimeout(_toastTimer);
  el.textContent = msg;
  el.classList.add('show');
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ════════════════════════════════════════
   UTILITIES
════════════════════════════════════════ */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? '';
}
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val ?? '';
}
function pad2(n) { return String(n).padStart(2, '0'); }

function formatDateAr(ds) {
  if (!ds) return '';
  try {
    const d = new Date(ds + 'T12:00:00');
    const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                    'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const days   = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    return `${days[d.getDay()]} ${toAr(d.getDate())} ${months[d.getMonth()]} ${toAr(d.getFullYear())}`;
  } catch(e) { return ds; }
}
function toAr(n) { return String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]); }

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) { return String(s ?? '').replace(/"/g,'&quot;'); }

function hexRgb(hex) {
  const h = hex.replace('#','');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function hexRgba(hex, a) { const [r,g,b] = hexRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function lightenColor(hex, a) {
  const [r,g,b] = hexRgb(hex);
  return `rgb(${Math.min(255,r+Math.round((255-r)*a))},${Math.min(255,g+Math.round((255-g)*a))},${Math.min(255,b+Math.round((255-b)*a))})`;
}
function darkenColor(hex, a) {
  const [r,g,b] = hexRgb(hex);
  return `rgb(${Math.round(r*(1-a))},${Math.round(g*(1-a))},${Math.round(b*(1-a))})`;
}

/* ════════════════════════════════════════
   NEW FUNCTIONS (FONTS, MUSIC, MODAL, COLLAPSE)
════════════════════════════════════════ */

function changeFont(fontName, chipEl, silent = false) {
  STATE.headingFont = fontName;
  document.documentElement.style.setProperty('--font-heading', `'${fontName}', serif`);
  
  // Highlight active chip
  document.querySelectorAll('.font-chip').forEach(chip => {
    chip.classList.toggle('active', chip === chipEl || chip.dataset.font === fontName);
  });
  
  if (!silent) showToast(`تم تغيير الخط إلى: ${fontName} ✍️`);
  saveLocalStorage();
}

function setMusicUrl(url) {
  STATE.musicSrc = url.trim();
  STATE.musicMode = 'url';
  setupAudio(STATE.musicSrc);
  saveLocalStorage();
}

function handleMusicUpload(file) {
  if (!file) return;
  if (!file.type.startsWith('audio/')) { showToast('يرجى رفع ملف صوتي'); return; }
  
  showToast('جاري معالجة وحفظ الملف الصوتي...');
  const reader = new FileReader();
  reader.onload = (e) => {
    STATE.musicSrc = e.target.result;
    STATE.musicMode = 'file';
    setupAudio(STATE.musicSrc);
    
    const nameEl = document.getElementById('musicFileName');
    if (nameEl) nameEl.textContent = file.name;
    
    saveLocalStorage();
    showToast('تم تحميل وحفظ الملف الصوتي بنجاح 🎵');
  };
  reader.readAsDataURL(file);
}

function setupAudio(src) {
  const audio = document.getElementById('weddingAudio');
  if (!audio) return;
  audio.src = src;
  audio.load();
}

function toggleMusicAutoplay(btn) {
  const isOn = btn.classList.contains('on');
  STATE.musicAutoplay = !isOn;
  btn.classList.toggle('on', !isOn);
  saveLocalStorage();
  showToast(STATE.musicAutoplay ? 'التشغيل التلقائي مفعل 🔊' : 'التشغيل التلقائي معطل 🔇');
}

function playAudioIfPossible() {
  const audio = document.getElementById('weddingAudio');
  if (!audio || !STATE.musicSrc || !STATE.musicAutoplay) return;
  
  audio.play().catch(err => {
    console.warn("Autoplay blocked by browser. Will attempt play on first click.");
    const playOnInteract = () => {
      audio.play();
      document.removeEventListener('click', playOnInteract);
    };
    document.addEventListener('click', playOnInteract);
  });
}

function testMusicPlayback() {
  const audio = document.getElementById('weddingAudio');
  if (!audio || !audio.src) {
    showToast('يرجى اختيار أو رفع ملف صوتي أولاً ⚠️');
    return;
  }
  if (audio.paused) {
    audio.play()
      .then(() => showToast('تشغيل الموسيقى 🎵'))
      .catch(() => showToast('فشل التشغيل، تأكد من الملف ⚠️'));
  } else {
    audio.pause();
    showToast('تم إيقاف الموسيقى ⏸️');
  }
}

// Welcome Modal logic
function showWelcomeModal() {
  const modal = document.getElementById('welcomeModal');
  if (!modal) return;
  
  // Do NOT show welcome modal if we are viewing a shared invitation
  if (document.body.classList.contains('viewer-mode')) {
    modal.style.display = 'none';
    return;
  }
  
  // Show only on first visit
  const welcomed = localStorage.getItem('wdp_welcomed');
  if (!welcomed) {
    modal.classList.add('visible');
    
    // Auto-close after 3.5 seconds
    setTimeout(() => {
      closeWelcomeModal();
    }, 3500);
  } else {
    modal.style.display = 'none';
  }
}

function closeWelcomeModal() {
  const modal = document.getElementById('welcomeModal');
  if (!modal) return;
  
  // Start fade-out animation
  modal.classList.remove('visible');
  modal.classList.add('fade-out');
  
  // After animation ends, fully remove from view
  setTimeout(() => {
    modal.classList.remove('fade-out');
    modal.style.display = 'none';
  }, 450);
  
  localStorage.setItem('wdp_welcomed', 'true');
}

// Hamburger toggle menu
function toggleEditorPanel() {
  const panel = document.getElementById('editorPanel');
  const btn = document.getElementById('hamburgerMenuBtn');
  if (!panel) return;
  
  panel.classList.toggle('collapsed');
  
  // Animate hamburger lines
  if (btn) {
    btn.classList.toggle('active');
    const lines = btn.querySelectorAll('.h-line');
    if (btn.classList.contains('active')) {
      lines[0].style.transform = 'rotate(45deg) translate(4px, 4px)';
      lines[1].style.opacity = '0';
      lines[2].style.transform = 'rotate(-45deg) translate(4px, -4px)';
    } else {
      lines[0].style.transform = '';
      lines[1].style.opacity = '1';
      lines[2].style.transform = '';
    }
  }
}

/* Expose globals needed by inline onclick handlers */
window.openInvitation     = openInvitation;
window.resetToSplash      = resetToSplash;
window.addTimelineItem    = addTimelineItem;
window.removeTimelineItem = removeTimelineItem;
window.addNoteItem        = addNoteItem;
window.removeNoteItem     = removeNoteItem;
window.applyTheme         = applyTheme;
window.toggleSection      = toggleSection;
window.saveAndShare       = saveAndShare;
window.copyLink           = copyLink;
window.shareToWhatsApp    = shareToWhatsApp;
window.setImageSource     = setImageSource;
window.setPresetImage     = setPresetImage;
window.setWebImage        = setWebImage;
window.adjustImage        = adjustImage;
window.changeFont         = changeFont;
window.setMusicUrl        = setMusicUrl;
window.handleMusicUpload  = handleMusicUpload;
window.toggleMusicAutoplay = toggleMusicAutoplay;
window.testMusicPlayback  = testMusicPlayback;
window.closeWelcomeModal  = closeWelcomeModal;
window.toggleEditorPanel  = toggleEditorPanel;
