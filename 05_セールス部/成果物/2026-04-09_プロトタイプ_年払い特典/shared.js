// ===== Shared utilities for all premium prompt pages =====

// ========================================
// Navigation
// ========================================
function goToStep(n, totalSteps) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('section' + n);
  if (el) el.classList.add('active');
  document.querySelectorAll('.prog-dot').forEach(d => {
    const s = parseInt(d.dataset.step);
    d.className = 'prog-dot' + (s === n ? ' active' : s < n ? ' done' : '');
  });
  document.querySelectorAll('.prog-line').forEach((l, i) => {
    l.className = 'prog-line' + (i + 1 < n ? ' done' : '');
  });
  const labelEl = document.getElementById('stepLabel');
  if (labelEl && window.stepLabels) labelEl.textContent = window.stepLabels[n] || '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// Clipboard
// ========================================
function copyText(elementId, successId) {
  const text = document.getElementById(elementId).textContent || document.getElementById(elementId).value;
  navigator.clipboard.writeText(text).then(() => {
    showCopySuccess(successId);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showCopySuccess(successId);
  });
}
function showCopySuccess(id) {
  const el = document.getElementById(id);
  if (el) { el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 2500); }
}

// ========================================
// Parse AI result with ---SECTION:name--- markers
// ========================================
function parseResult(text) {
  const sections = {};
  const regex = /---SECTION:(.+?)---/g;
  const parts = text.split(regex);
  for (let i = 1; i < parts.length; i += 2) {
    sections[parts[i].trim()] = (parts[i + 1] || '').trim();
  }
  return sections;
}

// ========================================
// HTML utilities
// ========================================
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function nl2br(str) {
  return str.replace(/\n/g, '<br>');
}
function makeReportCard(label, title, content, colorClass) {
  if (!content) return '';
  return `<div class="report-card ${colorClass || ''}">
    <div class="report-card-label">${escHtml(label)}</div>
    <h3>${title}</h3>
    <p>${nl2br(escHtml(content))}</p>
  </div>`;
}

// ========================================
// Confetti animation
// ========================================
function launchConfetti() {
  const canvas = document.getElementById('confetti');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#D4A574','#6B5B95','#7EB09B','#E8829B','#F5E6D3','#2C3E50'];
  const pieces = [];
  for (let i = 0; i < 80; i++) {
    pieces.push({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 8 + 4, h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: Math.random() * 3 + 2, vx: Math.random() * 2 - 1,
      rot: Math.random() * 360, vr: Math.random() * 6 - 3,
    });
  }
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.vy; p.x += p.vx; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color; ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); ctx.restore();
    });
    frame++;
    if (frame < 120) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}

// ========================================
// localStorage: Report save/load (cross-page)
// ========================================
function saveReport(key, text) {
  try { localStorage.setItem('icircle_' + key, text); } catch(e) {}
}
function loadReport(key) {
  try { return localStorage.getItem('icircle_' + key) || ''; } catch(e) { return ''; }
}

// ========================================
// AUTO-SAVE: Form inputs persist across page close/reopen
// ========================================
// Call initAutoSave('step1') on page load.
// It watches all <textarea> and <input> with an id, saving to localStorage on every keystroke.
// On page load, it restores all saved values.

function initAutoSave(pageKey) {
  const PREFIX = 'icircle_draft_' + pageKey + '_';

  // Restore saved values
  document.querySelectorAll('textarea[id], input[type="text"][id], select[id]').forEach(el => {
    const saved = localStorage.getItem(PREFIX + el.id);
    if (saved !== null && !el.value) {
      el.value = saved;
    }
  });

  // Show restoration notice if anything was restored
  const restoredCount = Array.from(document.querySelectorAll('textarea[id], input[type="text"][id], select[id]'))
    .filter(el => localStorage.getItem(PREFIX + el.id)).length;
  if (restoredCount > 0) {
    showAutoSaveNotice('前回の入力内容を復元しました ✅');
  }

  // Auto-save on input
  document.addEventListener('input', (e) => {
    const el = e.target;
    if ((el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text') || el.tagName === 'SELECT') && el.id) {
      localStorage.setItem(PREFIX + el.id, el.value);
      showAutoSaveIndicator();
    }
  });

  // Also save on change (for selects)
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.tagName === 'SELECT' && el.id) {
      localStorage.setItem(PREFIX + el.id, el.value);
      showAutoSaveIndicator();
    }
  });
}

function showAutoSaveNotice(msg) {
  // Insert a small banner at the top of the container
  const container = document.querySelector('.container');
  if (!container) return;
  const notice = document.createElement('div');
  notice.className = 'autosave-notice';
  notice.innerHTML = msg;
  container.insertBefore(notice, container.firstChild);
  setTimeout(() => notice.remove(), 4000);
}

function showAutoSaveIndicator() {
  // Brief flash of "保存中..." indicator
  let ind = document.getElementById('autosave-indicator');
  if (!ind) {
    ind = document.createElement('div');
    ind.id = 'autosave-indicator';
    ind.style.cssText = 'position:fixed;bottom:16px;right:16px;background:rgba(107,91,149,0.9);color:white;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;z-index:1000;transition:opacity 0.3s;pointer-events:none;';
    document.body.appendChild(ind);
  }
  ind.textContent = '💾 自動保存中...';
  ind.style.opacity = '1';
  clearTimeout(window._autoSaveTimer);
  window._autoSaveTimer = setTimeout(() => {
    ind.textContent = '✅ 保存済み';
    setTimeout(() => { ind.style.opacity = '0'; }, 1000);
  }, 500);
}

function clearDrafts(pageKey) {
  const PREFIX = 'icircle_draft_' + pageKey + '_';
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach(k => localStorage.removeItem(k));
}

// ========================================
// SAVE OPTIONS: Image / PDF / Text copy
// Designed to replace Excel download. Works on mobile too!
// ========================================

function _loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.setAttribute('data-src', src);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load: ' + src));
    document.head.appendChild(s);
  });
}

async function saveReportAsImage(filename) {
  const btn = event && event.currentTarget;
  const originalLabel = btn ? btn.innerHTML : null;
  try {
    if (btn) btn.innerHTML = '<span class="icon">⏳</span><span class="label">生成中...</span>';
    await _loadScriptOnce('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
    const target = document.querySelector('.section.active') || document.body;
    const hidden = [];
    target.querySelectorAll('.no-print, .save-options, button.btn-outline, button.btn-excel').forEach(el => {
      hidden.push([el, el.style.visibility]);
      el.style.visibility = 'hidden';
    });
    const canvas = await html2canvas(target, {
      backgroundColor: '#FFF8F0',
      scale: Math.min(2, window.devicePixelRatio || 1.5),
      useCORS: true, logging: false,
    });
    hidden.forEach(([el, v]) => { el.style.visibility = v; });
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = (filename || 'report') + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showAutoSaveNotice('🖼️ 画像で保存しました！');
  } catch (e) {
    console.error(e);
    alert('画像の生成に失敗しました。時間をおいて再度お試しください。');
  } finally {
    if (btn && originalLabel) btn.innerHTML = originalLabel;
  }
}

function saveReportAsPDF() {
  showAutoSaveNotice('📄 印刷ダイアログが開きます。「PDFとして保存」を選んでください');
  setTimeout(() => window.print(), 400);
}

function copyReportAsText(reportKey) {
  const reportEl = document.getElementById('reportContent');
  let text = '';
  if (reportEl && reportEl.innerText) {
    text = reportEl.innerText.trim();
  } else {
    const raw = loadReport(reportKey + '_report') || '';
    text = raw;
  }
  if (!text) { alert('コピーできるレポートがありません'); return; }
  const title = document.querySelector('.report-header h2');
  const header = title ? title.innerText.trim() + '\n' + '='.repeat(20) + '\n\n' : '';
  const finalText = header + text;
  navigator.clipboard.writeText(finalText).then(() => {
    showAutoSaveNotice('📋 テキストをクリップボードにコピーしました！');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = finalText;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showAutoSaveNotice('📋 テキストをクリップボードにコピーしました！');
  });
}

// ========================================
// EXCEL EXPORT: Download data as .xlsx
// ========================================
// Uses a simple CSV-based approach that Excel can open.
// For true .xlsx we'd need a library, but CSV with BOM works great for Japanese Excel.

function downloadExcel(filename, sheetData) {
  // sheetData is an array of { label: 'セクション名', value: 'テキスト' }
  const BOM = '\uFEFF';
  let csv = BOM;

  // Header
  csv += '項目,内容\n';

  // Date
  const now = new Date();
  const dateStr = now.getFullYear() + '/' + (now.getMonth()+1) + '/' + now.getDate() + ' ' +
    now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0');
  csv += csvRow('作成日時', dateStr);
  csv += csvRow('', '');

  // Data rows
  sheetData.forEach(item => {
    csv += csvRow(item.label, item.value);
  });

  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename + '.csv';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvRow(label, value) {
  // Escape for CSV: wrap in quotes, double any existing quotes
  const escaped = (value || '').replace(/"/g, '""').replace(/\r\n/g, '\n');
  const escapedLabel = (label || '').replace(/"/g, '""');
  return '"' + escapedLabel + '","' + escaped + '"\n';
}

// Helper: Collect all form inputs + AI report into export data
function collectExportData(pageKey, extraFields) {
  const data = [];
  const PREFIX = 'icircle_draft_' + pageKey + '_';

  // Add extra fields (custom labels)
  if (extraFields) {
    extraFields.forEach(f => {
      const el = document.getElementById(f.id);
      const val = el ? el.value : (localStorage.getItem(PREFIX + f.id) || '');
      if (val) data.push({ label: f.label, value: val });
    });
  }

  // Add AI report if available
  const report = loadReport(pageKey + '_report');
  if (report) {
    data.push({ label: '', value: '' });
    data.push({ label: '━━━ AIレポート結果 ━━━', value: '' });

    const sections = parseResult(report);
    if (Object.keys(sections).length > 0) {
      Object.entries(sections).forEach(([key, val]) => {
        data.push({ label: key, value: val });
      });
    } else {
      data.push({ label: 'レポート全文', value: report });
    }
  }

  return data;
}
