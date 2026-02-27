// ===================== DATA STORE =====================
let expenses    = JSON.parse(localStorage.getItem('ef_expenses') || '[]');
let fuels       = JSON.parse(localStorage.getItem('ef_fuels')    || '[]');
let settings    = JSON.parse(localStorage.getItem('ef_settings') || '{"name":"","account":"VF"}');
let cashEntries = JSON.parse(localStorage.getItem('ef_cash')     || '[]');

function save() {
  localStorage.setItem('ef_expenses', JSON.stringify(expenses));
  localStorage.setItem('ef_fuels',    JSON.stringify(fuels));
  localStorage.setItem('ef_settings', JSON.stringify(settings));
  localStorage.setItem('ef_cash',     JSON.stringify(cashEntries));
}

// ===================== NAVIGATION =====================
function switchPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  if (name === 'analytics') renderAnalytics();
  if (name === 'export') updateExportPreview();
}

// ===================== DATE HELPER =====================
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function parseDate(dateStr) {
  if (!dateStr) return { year: '', month: '', day: '' };
  const parts = dateStr.split('-');
  return {
    year:  parts[0],
    month: MONTHS[parseInt(parts[1], 10) - 1] || '',
    day:   parseInt(parts[2], 10)
  };
}
function fmtDate(r) {
  return r.year ? `${r.day}-${r.month}-${r.year}` : `${r.month} ${r.day}`;
}

// ===================== EXPENSE FORM =====================
function submitExpense(e) {
  e.preventDefault();
  const { year, month, day } = parseDate(v('e_date'));
  const rec = {
    id: Date.now(),
    date:        v('e_date'),
    year,
    month,
    day,
    project:     v('e_project'),
    siteid:      v('e_siteid'),
    jobcode:     v('e_jobcode'),
    area:        v('e_area'),
    category:    v('e_category'),
    subcategory: v('e_subcategory'),
    description: document.getElementById('e_description').value.trim(),
    amount:      parseFloat(v('e_amount')) || 0,
    coordinator: v('e_coordinator'),
    comment:     document.getElementById('e_comment').value.trim(),
    trackingno:  v('e_trackingno'),
  };
  expenses.unshift(rec);
  save();
  renderExpenses();
  document.getElementById('expenseForm').reset();
  toast('Expense added!');
}

function deleteExpense(id) {
  if (!confirm('Delete this expense? This cannot be undone.')) return;
  expenses = expenses.filter(r => r.id !== id);
  save();
  renderExpenses();
  toast('Deleted');
}

function toggleTrackGroup(hdr) {
  hdr.closest('.track-group').classList.toggle('open');
}

function renderExpenses() {
  const total = expenses.reduce((s, r) => s + r.amount, 0);
  document.getElementById('expTotal').textContent = 'Total: ' + fmt(total);
  document.getElementById('expCount').textContent = expenses.length + ' record' + (expenses.length !== 1 ? 's' : '');

  const list = document.getElementById('expenseList');
  if (!expenses.length) {
    list.innerHTML = '<div class="empty-state">No expenses yet. Add your first expense above.</div>';
    return;
  }

  // Group by tracking number (preserve insertion order)
  const groups = {};
  expenses.forEach(r => {
    const key = r.trackingno || '—';
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  list.innerHTML = Object.entries(groups).map(([key, recs]) => {
    const grpTotal = recs.reduce((s, r) => s + r.amount, 0);
    const items = recs.map(r => `
      <div class="record-item">
        <div class="record-main">
          <div class="record-title"><span class="month-badge">${esc(fmtDate(r))}</span></div>
          <div class="record-sub">${esc(r.category)}${r.subcategory ? ' › ' + esc(r.subcategory) : ''} · ${esc(r.project)}${r.area ? ' · ' + esc(r.area) : ''}</div>
          ${r.comment ? `<div class="record-sub" style="font-style:italic">${esc(r.comment.split('\n')[0])}</div>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:2px">
          <span class="record-amount">${fmt(r.amount)}</span>
          <button class="edit-btn" onclick="editExpense(${r.id})" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="delete-btn" onclick="deleteExpense(${r.id})" title="Delete">&#x2715;</button>
        </div>
      </div>`).join('');
    return `<div class="track-group">
      <div class="track-header" onclick="toggleTrackGroup(this)">
        <span class="track-label">${esc(key)}</span>
        <span class="track-meta">${recs.length} record${recs.length !== 1 ? 's' : ''}</span>
        <span class="track-amount">&nbsp;${fmt(grpTotal)}</span>
        <span class="track-chev">▼</span>
      </div>
      <div class="track-body">${items}</div>
    </div>`;
  }).join('');
}

// ===================== FUEL FORM =====================
function submitFuel(e) {
  e.preventDefault();
  const { year, month, day } = parseDate(v('f_date'));
  const rec = {
    id: Date.now(),
    date:        v('f_date'),
    year,
    month,
    day,
    project:     v('f_project'),
    siteid:      v('f_siteid'),
    jobcode:     v('f_jobcode'),
    area:        v('f_area'),
    startkm:     parseFloat(v('f_startkm')) || 0,
    endkm:       parseFloat(v('f_endkm')) || 0,
    fuelamount:  parseFloat(v('f_fuelamount')) || 0,
    kartaamount: parseFloat(v('f_kartaamount')) || 0,
    driver:      v('f_driver'),
    city:        v('f_city'),
    coordinator: v('f_coordinator'),
    trackingno:  v('f_trackingno'),
  };
  fuels.unshift(rec);
  save();
  renderFuels();
  document.getElementById('fuelForm').reset();
  toast('Fuel entry added!');
}

function deleteFuel(id) {
  if (!confirm('Delete this fuel entry? This cannot be undone.')) return;
  fuels = fuels.filter(r => r.id !== id);
  save();
  renderFuels();
  toast('Deleted');
}

function renderFuels() {
  const total = fuels.reduce((s, r) => s + r.fuelamount + r.kartaamount, 0);
  document.getElementById('fuelTotal').textContent = 'Total: ' + fmt(total);
  document.getElementById('fuelCount').textContent = fuels.length + ' record' + (fuels.length !== 1 ? 's' : '');

  const list = document.getElementById('fuelList');
  if (!fuels.length) {
    list.innerHTML = '<div class="empty-state">No fuel entries yet. Add your first entry above.</div>';
    return;
  }

  // Group by tracking number
  const groups = {};
  fuels.forEach(r => {
    const key = r.trackingno || '—';
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  list.innerHTML = Object.entries(groups).map(([key, recs]) => {
    const grpTotal = recs.reduce((s, r) => s + r.fuelamount + r.kartaamount, 0);
    const items = recs.map(r => `
      <div class="record-item">
        <div class="record-main">
          <div class="record-title">
            <span class="month-badge green">${esc(fmtDate(r))}</span>
          </div>
          <div class="record-sub">${esc(r.project)}${r.area ? ' · ' + esc(r.area) : ''}${r.city ? ' · ' + esc(r.city) : ''}${r.coordinator ? ' · ' + esc(r.coordinator) : ''}</div>
          <div class="record-sub">KM: ${r.startkm} → ${r.endkm} (${r.endkm - r.startkm} km)${r.kartaamount ? ' · Karta: ' + fmt(r.kartaamount) : ''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:2px">
          <span class="record-amount green">${fmt(r.fuelamount)}</span>
          <button class="edit-btn" onclick="editFuel(${r.id})" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="delete-btn" onclick="deleteFuel(${r.id})" title="Delete">&#x2715;</button>
        </div>
      </div>`).join('');
    return `<div class="track-group">
      <div class="track-header" onclick="toggleTrackGroup(this)">
        <span class="track-label green">${esc(key)}</span>
        <span class="track-meta">${recs.length} record${recs.length !== 1 ? 's' : ''}</span>
        <span class="track-amount green">&nbsp;${fmt(grpTotal)}</span>
        <span class="track-chev">▼</span>
      </div>
      <div class="track-body">${items}</div>
    </div>`;
  }).join('');
}

// ===================== ANALYTICS =====================
let catChartInst = null, monthChartInst = null, areaChartInst = null;

function renderAnalytics() {
  const expTotal  = expenses.reduce((s, r) => s + r.amount, 0);
  const fuelTotal = fuels.reduce((s, r) => s + r.fuelamount + r.kartaamount, 0);
  const cashTotal = cashEntries.reduce((s, r) => s + r.amount, 0);
  const balance   = cashTotal - (expTotal + fuelTotal);
  document.getElementById('stat-exp-total').textContent  = fmt(expTotal);
  document.getElementById('stat-fuel-total').textContent = fmt(fuelTotal);
  document.getElementById('stat-exp-count').textContent  = new Set(expenses.map(function(r){ return r.trackingno||'\u2014'; })).size;
  document.getElementById('stat-fuel-count').textContent = new Set(fuels.map(function(r){ return r.trackingno||'\u2014'; })).size;
  document.getElementById('stat-cash-total').textContent    = fmt(cashTotal);
  document.getElementById('stat-spending-total').textContent = fmt(expTotal + fuelTotal);
  const balEl = document.getElementById('stat-balance');
  balEl.textContent = fmt(balance);
  const balCard = document.getElementById('balance-card');
  if (balance >= 0) {
    balEl.style.color = 'var(--green)';
    balCard.style.borderLeftColor = 'var(--green)';
  } else {
    balEl.style.color = '#ef4444';
    balCard.style.borderLeftColor = '#ef4444';
  }

  // Category chart
  const catMap = {};
  expenses.forEach(r => { catMap[r.category || 'Other'] = (catMap[r.category || 'Other'] || 0) + r.amount; });
  const catLabels = Object.keys(catMap);
  const catData   = catLabels.map(k => catMap[k]);
  const catColors = ['#0070C0','#00B050','#FF6600','#9333ea','#ec4899','#f59e0b','#14b8a6'];

  if (catChartInst) catChartInst.destroy();
  const catCtx = document.getElementById('catChart').getContext('2d');
  catChartInst = new Chart(catCtx, {
    type: 'doughnut',
    data: { labels: catLabels, datasets: [{ data: catData, backgroundColor: catColors, borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } } } }
  });

  // Monthly chart
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const expMonth  = Array(12).fill(0);
  const fuelMonth = Array(12).fill(0);
  expenses.forEach(r => { const i = months.indexOf(r.month); if (i >= 0) expMonth[i] += r.amount; });
  fuels.forEach(r => { const i = months.indexOf(r.month); if (i >= 0) fuelMonth[i] += r.fuelamount + r.kartaamount; });

  if (monthChartInst) monthChartInst.destroy();
  const monthCtx = document.getElementById('monthChart').getContext('2d');
  monthChartInst = new Chart(monthCtx, {
    type: 'bar',
    data: { labels: months, datasets: [
      { label: 'Expenses', data: expMonth,  backgroundColor: '#0070C0cc', borderRadius: 4 },
      { label: 'Fuel',     data: fuelMonth, backgroundColor: '#00B050cc', borderRadius: 4 }
    ]},
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } } },
      scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#f1f5f9' } } }
    }
  });

  // Area chart
  const areaMap = {};
  expenses.forEach(r => { if (r.area) areaMap[r.area] = (areaMap[r.area] || 0) + r.amount; });
  fuels.forEach(r =>    { if (r.area) areaMap[r.area] = (areaMap[r.area] || 0) + r.fuelamount; });
  const areaEntries = Object.entries(areaMap).sort((a,b) => b[1]-a[1]).slice(0,8);
  const areaLabels = areaEntries.map(e => e[0]);
  const areaData   = areaEntries.map(e => e[1]);

  if (areaChartInst) areaChartInst.destroy();
  const areaCtx = document.getElementById('areaChart').getContext('2d');
  areaChartInst = new Chart(areaCtx, {
    type: 'bar',
    data: { labels: areaLabels, datasets: [{
      label: 'Amount', data: areaData,
      backgroundColor: areaLabels.map((_,i) => catColors[i % catColors.length] + 'cc'),
      borderRadius: 4
    }]},
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, grid: { color: '#f1f5f9' } }, y: { grid: { display: false } } }
    }
  });
}

// ===================== EXPORT TO EXCEL =====================

async function buildSheet(wb, logoId, sheetName, sheetTitle, headers, rows, amtTotal, fuelTotal, kartaTotal, colWidths, empName, account, period) {
  var isFuel = (fuelTotal !== null && fuelTotal !== undefined);
  var n      = headers.length;
  var ws     = wb.addWorksheet(sheetName);

  var NAVY  = 'FF002060';
  var GREEN = 'FF92D050';
  var LGRAY = 'FFD9D9D9';
  var WHITE = 'FFFFFFFF';
  var DGRAY = 'FF595959';
  var LBLUE = 'FFEBF3FA';

  var today  = new Date();
  var MN     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var dateStr= today.getDate() + '-' + MN[today.getMonth()] + '-' + String(today.getFullYear()).slice(2);

  function bs(argb, style) { return { style: style||'thin', color:{argb:argb} }; }

  ws.columns = colWidths.map(function(w){ return {width:w}; });

  // ── Logo ─────────────────────────────────────────────────────────────
  if (logoId !== null && logoId !== undefined) {
    ws.addImage(logoId, { tl:{col:0,row:0}, br:{col:3,row:2} });
  }

  // ── Row 1: logo placeholder (cols 1-3) + green title (cols 4-n) ──────
  ws.getRow(1).height = 44;
  for (var c = 1; c <= 3; c++) {
    var cl = ws.getRow(1).getCell(c);
    cl.fill   = {type:'pattern',pattern:'solid',fgColor:{argb:WHITE}};
    cl.border = {top:bs(NAVY,'medium'), left: c===1 ? bs(NAVY,'medium') : null};
  }
  ws.getRow(1).getCell(4).value = sheetTitle;
  for (var c = 4; c <= n; c++) {
    var cl = ws.getRow(1).getCell(c);
    cl.fill      = {type:'pattern',pattern:'solid',fgColor:{argb:GREEN}};
    cl.font      = {color:{argb:NAVY},bold:true,size:16,name:'Calibri'};
    cl.alignment = {horizontal:'center',vertical:'middle'};
    cl.border    = {top:bs(NAVY,'medium'),bottom:bs(NAVY,'thin'),right: c===n ? bs(NAVY,'medium') : null};
  }
  ws.mergeCells(1, 4, 1, n);

  // ── Row 2: logo placeholder (cols 1-3) + Account/value (cols 4-n) ────
  ws.getRow(2).height = 20;
  for (var c = 1; c <= 3; c++) {
    var cl = ws.getRow(2).getCell(c);
    cl.fill   = {type:'pattern',pattern:'solid',fgColor:{argb:WHITE}};
    if (c===1) cl.border = {left:bs(NAVY,'medium')};
  }
  var mid = 3 + Math.ceil((n - 3) / 2);
  ws.getRow(2).getCell(4).value = 'Account';
  for (var c = 4; c <= mid; c++) {
    var cl = ws.getRow(2).getCell(c);
    cl.fill      = {type:'pattern',pattern:'solid',fgColor:{argb:LBLUE}};
    cl.font      = {bold: c===4, size:11, name:'Calibri', color:{argb:NAVY}};
    cl.alignment = {horizontal:'center',vertical:'middle'};
    cl.border    = {bottom:bs(NAVY,'thin')};
  }
  ws.mergeCells(2, 4, 2, mid);
  ws.getRow(2).getCell(mid+1).value = account;
  for (var c = mid+1; c <= n; c++) {
    var cl = ws.getRow(2).getCell(c);
    cl.fill      = {type:'pattern',pattern:'solid',fgColor:{argb:WHITE}};
    cl.font      = {bold: c===mid+1, size:11, name:'Calibri', color:{argb:NAVY}};
    cl.alignment = {horizontal:'center',vertical:'middle'};
    cl.border    = {bottom:bs(NAVY,'thin'), right: c===n ? bs(NAVY,'medium') : null};
  }
  ws.mergeCells(2, mid+1, 2, n);

  // Merge logo placeholder rows 1-2, cols 1-3
  ws.mergeCells(1, 1, 2, 3);

  var curRow = 3;

  // ── Period row (optional) ────────────────────────────────────────────
  if (period) {
    ws.getRow(curRow).height = 16;
    ws.getRow(curRow).getCell(1).value = 'Period: ' + period;
    for (var c = 1; c <= n; c++) {
      var cl = ws.getRow(curRow).getCell(c);
      cl.fill      = {type:'pattern',pattern:'solid',fgColor:{argb:LBLUE}};
      cl.font      = {size:10,name:'Calibri',color:{argb:NAVY}};
      if (c===1) cl.alignment = {horizontal:'left',vertical:'middle'};
    }
    ws.mergeCells(curRow, 1, curRow, n);
    curRow++;
  }

  // ── Navy separator 1 ─────────────────────────────────────────────────
  ws.getRow(curRow).height = 4;
  for (var c = 1; c <= n; c++) {
    ws.getRow(curRow).getCell(c).fill = {type:'pattern',pattern:'solid',fgColor:{argb:NAVY}};
  }
  ws.mergeCells(curRow, 1, curRow, n);
  curRow++;

  // ── Name / Total info row ─────────────────────────────────────────────
  var infoR = curRow;
  ws.getRow(infoR).height = 22;
  for (var c = 1; c <= n; c++) {
    ws.getRow(infoR).getCell(c).fill = {type:'pattern',pattern:'solid',fgColor:{argb:WHITE}};
  }
  function lbl(col, txt) {
    var cl = ws.getRow(infoR).getCell(col);
    cl.value     = txt;
    cl.font      = {bold:true,size:10,name:'Calibri',color:{argb:NAVY}};
    cl.alignment = {horizontal:'center',vertical:'middle'};
    cl.border    = {top:bs(DGRAY,'thin'),bottom:bs(DGRAY,'thin'),left:bs(DGRAY,'thin'),right:bs(DGRAY,'thin')};
  }
  function val(colS, colE, txt) {
    var cl = ws.getRow(infoR).getCell(colS);
    cl.value     = txt;
    cl.font      = {size:10,name:'Calibri',color:{argb:DGRAY}};
    cl.alignment = {horizontal:'left',vertical:'middle'};
    cl.border    = {top:bs(DGRAY,'thin'),bottom:bs(DGRAY,'thin'),left:bs(DGRAY,'thin'),right:bs(DGRAY,'thin')};
    for (var c = colS+1; c <= colE; c++) {
      var cc = ws.getRow(infoR).getCell(c);
      cc.fill   = {type:'pattern',pattern:'solid',fgColor:{argb:WHITE}};
      cc.border = {top:bs(DGRAY,'thin'),bottom:bs(DGRAY,'thin'),right: c===colE ? bs(DGRAY,'thin') : null};
    }
    if (colE > colS) ws.mergeCells(infoR, colS, infoR, colE);
  }
  function fmt(v) { return 'EGP ' + (v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }

  lbl(1, 'Name');
  if (!isFuel) {
    // Expense (n=12): Name(1) | val(2-6) | gap(7) | Total(8) | EGP(9-10)
    val(2, 6, empName);
    lbl(8, 'Total');
    val(9, 10, fmt(amtTotal));
  } else {
    // Fuel (n=13): Name(1) | val(2-3) | Total(4) | EGP(5) | gap(6) | Fuel(7) | EGP(8) | Karta(9) | EGP(10-n)
    val(2, 3, empName);
    lbl(4, 'Total');
    val(5, 5, fmt(amtTotal));
    lbl(7, 'Fuel');
    val(8, 8, fmt(fuelTotal));
    lbl(9, 'Karta');
    val(10, n, fmt(kartaTotal));
  }
  curRow++;

  // ── Navy separator 2 ─────────────────────────────────────────────────
  ws.getRow(curRow).height = 4;
  for (var c = 1; c <= n; c++) {
    ws.getRow(curRow).getCell(c).fill = {type:'pattern',pattern:'solid',fgColor:{argb:NAVY}};
  }
  ws.mergeCells(curRow, 1, curRow, n);
  curRow++;

  // ── Column headers ────────────────────────────────────────────────────
  var hdrR = curRow;
  ws.getRow(hdrR).height = 28;
  headers.forEach(function(h, idx) {
    var c  = idx + 1;
    var cl = ws.getRow(hdrR).getCell(c);
    cl.value     = h;
    cl.fill      = {type:'pattern',pattern:'solid',fgColor:{argb:NAVY}};
    cl.font      = {color:{argb:WHITE},bold:true,size:10,name:'Calibri'};
    cl.alignment = {horizontal:'center',vertical:'middle',wrapText:true};
    cl.border    = {
      top:    bs(NAVY,'medium'),
      bottom: bs(NAVY,'thin'),
      left:   c===1 ? bs(NAVY,'medium') : bs(WHITE,'thin'),
      right:  c===n ? bs(NAVY,'medium') : bs(WHITE,'thin')
    };
  });
  ws.autoFilter = {from:{row:hdrR,column:1}, to:{row:hdrR,column:n}};
  curRow++;

  // ── Data rows ─────────────────────────────────────────────────────────
  rows.forEach(function(row, ri) {
    ws.getRow(curRow).height = 18;
    var isAlt  = ri % 2 === 1;
    var isLast = ri === rows.length - 1;
    row.forEach(function(v, idx) {
      var c  = idx + 1;
      var cl = ws.getRow(curRow).getCell(c);
      cl.value = (v !== null && v !== undefined) ? v : '';
      cl.fill  = {type:'pattern',pattern:'solid',fgColor:{argb: isAlt ? LGRAY : WHITE}};
      cl.font  = {size:10,name:'Calibri'};
      var h    = headers[idx];
      var isNum = typeof v === 'number';
      cl.alignment = {horizontal: isNum?'right':'left', vertical:'middle',
        wrapText: h.indexOf('Description')>=0||h.indexOf('Comment')>=0};
      if (isNum && h.indexOf('Amount')>=0) cl.numFmt = '#,##0.00';
      cl.border = {
        top:    isAlt ? bs(LGRAY,'thin') : bs(WHITE,'thin'),
        bottom: isLast ? bs(NAVY,'medium') : bs(LGRAY,'thin'),
        left:   c===1 ? bs(NAVY,'medium') : bs(LGRAY,'thin'),
        right:  c===n ? bs(NAVY,'medium') : bs(LGRAY,'thin')
      };
    });
    curRow++;
  });
  if (rows.length === 0) {
    ws.getRow(curRow).height = 18;
    for (var c = 1; c <= n; c++) {
      var cl = ws.getRow(curRow).getCell(c);
      cl.fill   = {type:'pattern',pattern:'solid',fgColor:{argb:WHITE}};
      cl.border = {bottom:bs(NAVY,'medium'), left:c===1?bs(NAVY,'medium'):null, right:c===n?bs(NAVY,'medium'):null};
    }
    curRow++;
  }

  // ── Footer separator ─────────────────────────────────────────────────
  ws.getRow(curRow).height = 6;
  for (var c = 1; c <= n; c++) {
    ws.getRow(curRow).getCell(c).fill = {type:'pattern',pattern:'solid',fgColor:{argb:NAVY}};
  }
  ws.mergeCells(curRow, 1, curRow, n);
  curRow++;

  // ── Footer label row (4 Arabic sections) ─────────────────────────────
  ws.getRow(curRow).height = 30;
  var fc1=1, fc2=Math.round(n*0.25)+1, fc3=Math.round(n*0.55)+1, fc4=Math.round(n*0.82)+1;
  var fSecs = [[fc1,fc2-1],[fc2,fc3-1],[fc3,fc4-1],[fc4,n]];
  var fLbls = ['\u0625\u0639\u062A\u0645\u0627\u062F','\u0645\u062F\u064A\u0631 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A','\u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0633\u0624\u0648\u0644','Tracking#'];
  var footL = curRow;
  fSecs.forEach(function(sec, si) {
    ws.getRow(footL).getCell(sec[0]).value = fLbls[si];
    for (var c = sec[0]; c <= sec[1]; c++) {
      var cl = ws.getRow(footL).getCell(c);
      cl.fill      = {type:'pattern',pattern:'solid',fgColor:{argb:WHITE}};
      cl.font      = {bold:si<3, size:11, name:'Calibri'};
      cl.alignment = {horizontal:'center',vertical:'middle',readingOrder: si<3?2:1};
      cl.border    = {
        top:    bs(NAVY,'thin'),
        bottom: bs(NAVY,'thin'),
        left:   c===1 ? bs(NAVY,'medium') : (c===sec[0] ? bs(NAVY,'thin') : null),
        right:  c===n ? bs(NAVY,'medium') : (c===sec[1] ? bs(NAVY,'thin') : null)
      };
    }
    if (sec[1]>sec[0]) ws.mergeCells(footL, sec[0], footL, sec[1]);
  });
  curRow++;

  // ── Footer date/sig row ───────────────────────────────────────────────
  ws.getRow(curRow).height = 26;
  var footS = curRow;
  fSecs.forEach(function(sec, si) {
    if (si===0) {
      ws.getRow(footS).getCell(sec[0]).value = '\u0627\u0644\u062A\u0627\u0631\u064A\u062E: ' + dateStr;
      ws.getRow(footS).getCell(sec[0]).alignment = {horizontal:'right',vertical:'middle',readingOrder:2};
    }
    for (var c = sec[0]; c <= sec[1]; c++) {
      var cl = ws.getRow(footS).getCell(c);
      cl.fill   = {type:'pattern',pattern:'solid',fgColor:{argb:WHITE}};
      cl.font   = {size:10,name:'Calibri',bold:si===0};
      cl.border = {
        top:    bs(NAVY,'thin'),
        bottom: bs(NAVY,'medium'),
        left:   c===1 ? bs(NAVY,'medium') : (c===sec[0] ? bs(NAVY,'thin') : null),
        right:  c===n ? bs(NAVY,'medium') : (c===sec[1] ? bs(NAVY,'thin') : null)
      };
    }
    if (sec[1]>sec[0]) ws.mergeCells(footS, sec[0], footS, sec[1]);
  });
}

async function exportExcel() {
  if (!expenses.length && !fuels.length) { toast('No data to export!'); return; }
  try {
    var wb      = new ExcelJS.Workbook();
    var empName = settings.name    || 'N/A';
    var account = settings.account || 'VF';
    var logoId  = null;
    try {
      var logoEl = document.querySelector('img[alt="Landmark Plus"]');
      if (logoEl && logoEl.src.indexOf('base64,') >= 0) {
        logoId = wb.addImage({base64: logoEl.src.split(',')[1], extension:'jpeg'});
      }
    } catch(e2) {}

    var expHeaders = ['Month','Day','Project Name','Site ID','Job Code','Category','Sub Category','Item Description','Amount (EGP)','Comment','Coordinator','Area'];
    var expRows = expenses.map(function(r){ return [r.month,r.day,r.project,r.siteid,r.jobcode,r.category,r.subcategory,r.description,r.amount,r.comment,r.coordinator,r.area]; });
    var expTotal = expenses.reduce(function(s,r){ return s+r.amount; }, 0);
    await buildSheet(wb, logoId, 'Expenses Tracking', 'Expenses Tracking', expHeaders, expRows, expTotal, null, null, [7,5,20,12,10,16,14,30,13,22,16,10], empName, account, null);

    var fuelHeaders = ['Month','Day','Project Name','Site ID','Job Code','Start KM','End KM','Fuel Amount','Area','Driver','City','Karta Amount','Coordinator'];
    var fuelRows = fuels.map(function(r){ return [r.month,r.day,r.project,r.siteid,r.jobcode,r.startkm,r.endkm,r.fuelamount,r.area,r.driver,r.city,r.kartaamount,r.coordinator]; });
    var fuelTotal  = fuels.reduce(function(s,r){ return s+r.fuelamount;  }, 0);
    var kartaTotal = fuels.reduce(function(s,r){ return s+r.kartaamount; }, 0);
    await buildSheet(wb, logoId, 'Fuel Tracking', 'Fuel Tracking', fuelHeaders, fuelRows, fuelTotal+kartaTotal, fuelTotal, kartaTotal, [7,5,20,12,10,10,10,14,12,22,12,13,16], empName, account, null);

    var buf = await wb.xlsx.writeBuffer();
    var ds  = new Date().toISOString().slice(0,10);
    saveAs(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), 'Expense-Fuel_'+ds+'.xlsx');
    toast('Excel file exported!');
  } catch(e) { toast('Export error: ' + e.message); }
}

// ===================== TRACKING EXPORT MODAL =====================
function openTrackingExportModal() {
  if (!expenses.length && !fuels.length) { toast('No data to export!'); return; }

  // Collect all unique tracking numbers with counts
  var map = {};
  expenses.forEach(function(r) {
    var k = r.trackingno || '—';
    if (!map[k]) map[k] = { exp: 0, fuel: 0 };
    map[k].exp++;
  });
  fuels.forEach(function(r) {
    var k = r.trackingno || '—';
    if (!map[k]) map[k] = { exp: 0, fuel: 0 };
    map[k].fuel++;
  });

  var keys = Object.keys(map);
  var list = document.getElementById('trkList');
  list.innerHTML = keys.map(function(k) {
    var d = map[k];
    var meta = [];
    if (d.exp)  meta.push(d.exp  + ' expense'  + (d.exp  !== 1 ? 's' : ''));
    if (d.fuel) meta.push(d.fuel + ' fuel'      + (d.fuel !== 1 ? 's' : ''));
    return '<label class="trk-item"><input type="checkbox" class="trk-chk" value="' + k.replace(/"/g,'&quot;') + '" checked onchange="updateTrkSelCount()"><span class="trk-item-label">' + esc(k) + '</span><span class="trk-item-meta">' + meta.join(' · ') + '</span></label>';
  }).join('');

  updateTrkSelCount();
  document.getElementById('trackingExportModal').classList.add('open');
}

function updateTrkSelCount() {
  var total   = document.querySelectorAll('.trk-chk').length;
  var checked = document.querySelectorAll('.trk-chk:checked').length;
  document.getElementById('trkSelCount').textContent = checked + ' / ' + total + ' selected';
}

function trkSelectAll(val) {
  document.querySelectorAll('.trk-chk').forEach(function(cb) { cb.checked = val; });
  updateTrkSelCount();
}

function closeTrackingExportModal(e) {
  if (!e || e.target === document.getElementById('trackingExportModal'))
    document.getElementById('trackingExportModal').classList.remove('open');
}

async function exportByTracking() {
  var selected = Array.from(document.querySelectorAll('.trk-chk:checked')).map(function(cb) { return cb.value; });
  if (!selected.length) { toast('Select at least one tracking number.'); return; }

  // Apply date range filter first, then tracking number filter
  var filtered   = getFilteredData();
  var filteredExp  = filtered.filteredExp.filter(function(r)  { return selected.indexOf(r.trackingno || '—') >= 0; });
  var filteredFuel = filtered.filteredFuel.filter(function(r) { return selected.indexOf(r.trackingno || '—') >= 0; });
  var from = filtered.from, to = filtered.to;

  if (!filteredExp.length && !filteredFuel.length) { toast('No records match selection!'); return; }

  document.getElementById('trackingExportModal').classList.remove('open');

  try {
    var wb      = new ExcelJS.Workbook();
    var empName = settings.name    || 'N/A';
    var account = settings.account || 'VF';
    var allKeys = {}; expenses.concat(fuels).forEach(function(r){ allKeys[r.trackingno||'—']=1; });
    var isAll   = selected.length === Object.keys(allKeys).length;
    var period  = isAll ? ((from||'All')+(to?' to '+to:'')) : 'Tracking: ' + selected.join(', ');
    var logoId  = null;
    try {
      var logoEl = document.querySelector('img[alt="Landmark Plus"]');
      if (logoEl && logoEl.src.indexOf('base64,') >= 0)
        logoId = wb.addImage({base64: logoEl.src.split(',')[1], extension:'jpeg'});
    } catch(e2) {}

    var expHeaders  = ['Month','Day','Project Name','Site ID','Job Code','Category','Sub Category','Item Description','Amount (EGP)','Comment','Coordinator','Area'];
    var expRows     = filteredExp.map(function(r){ return [r.month,r.day,r.project,r.siteid,r.jobcode,r.category,r.subcategory,r.description,r.amount,r.comment,r.coordinator,r.area]; });
    var expTotal    = filteredExp.reduce(function(s,r){ return s+r.amount; }, 0);
    await buildSheet(wb, logoId, 'Expenses Tracking', 'Expenses Tracking', expHeaders, expRows, expTotal, null, null, [7,5,20,12,10,16,14,30,13,22,16,10], empName, account, period);

    var fuelHeaders = ['Month','Day','Project Name','Site ID','Job Code','Start KM','End KM','Fuel Amount','Area','Driver','City','Karta Amount','Coordinator'];
    var fuelRows    = filteredFuel.map(function(r){ return [r.month,r.day,r.project,r.siteid,r.jobcode,r.startkm,r.endkm,r.fuelamount,r.area,r.driver,r.city,r.kartaamount,r.coordinator]; });
    var fuelTotal   = filteredFuel.reduce(function(s,r){ return s+r.fuelamount;  }, 0);
    var kartaTotal  = filteredFuel.reduce(function(s,r){ return s+r.kartaamount; }, 0);
    await buildSheet(wb, logoId, 'Fuel Tracking', 'Fuel Tracking', fuelHeaders, fuelRows, fuelTotal+kartaTotal, fuelTotal, kartaTotal, [7,5,20,12,10,10,10,14,12,22,12,13,16], empName, account, period);

    var buf = await wb.xlsx.writeBuffer();
    var ds  = new Date().toISOString().slice(0,10);
    saveAs(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), 'LMP-Report_'+ds+'.xlsx');
    toast('Report exported!');
  } catch(err) { toast('Export error: ' + err.message); }
}

async function exportFiltered() {
  var filtered     = getFilteredData();
  var filteredExp  = filtered.filteredExp;
  var filteredFuel = filtered.filteredFuel;
  var from = filtered.from;
  var to   = filtered.to;
  if (!filteredExp.length && !filteredFuel.length) { toast('No records in selected range!'); return; }
  try {
    var wb      = new ExcelJS.Workbook();
    var empName = settings.name    || 'N/A';
    var account = settings.account || 'VF';
    var period  = (from||'All') + (to ? ' to '+to : '');
    var logoId  = null;
    try {
      var logoEl = document.querySelector('img[alt="Landmark Plus"]');
      if (logoEl && logoEl.src.indexOf('base64,') >= 0) {
        logoId = wb.addImage({base64: logoEl.src.split(',')[1], extension:'jpeg'});
      }
    } catch(e2) {}

    var expHeaders = ['Month','Day','Project Name','Site ID','Job Code','Category','Sub Category','Item Description','Amount (EGP)','Comment','Coordinator','Area'];
    var expRows = filteredExp.map(function(r){ return [r.month,r.day,r.project,r.siteid,r.jobcode,r.category,r.subcategory,r.description,r.amount,r.comment,r.coordinator,r.area]; });
    var expTotal = filteredExp.reduce(function(s,r){ return s+r.amount; }, 0);
    await buildSheet(wb, logoId, 'Expenses Tracking', 'Expenses Tracking', expHeaders, expRows, expTotal, null, null, [7,5,20,12,10,16,14,30,13,22,16,10], empName, account, period);

    var fuelHeaders = ['Month','Day','Project Name','Site ID','Job Code','Start KM','End KM','Fuel Amount','Area','Driver','City','Karta Amount','Coordinator'];
    var fuelRows = filteredFuel.map(function(r){ return [r.month,r.day,r.project,r.siteid,r.jobcode,r.startkm,r.endkm,r.fuelamount,r.area,r.driver,r.city,r.kartaamount,r.coordinator]; });
    var fuelTotal  = filteredFuel.reduce(function(s,r){ return s+r.fuelamount;  }, 0);
    var kartaTotal = filteredFuel.reduce(function(s,r){ return s+r.kartaamount; }, 0);
    await buildSheet(wb, logoId, 'Fuel Tracking', 'Fuel Tracking', fuelHeaders, fuelRows, fuelTotal+kartaTotal, fuelTotal, kartaTotal, [7,5,20,12,10,10,10,14,12,22,12,13,16], empName, account, period);

    var buf = await wb.xlsx.writeBuffer();
    var ds  = new Date().toISOString().slice(0,10);
    saveAs(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), 'LMP-Report_'+ds+'.xlsx');
    toast('Report exported!');
  } catch(e) { toast('Export error: ' + e.message); }
}




// ===================== EDIT EXPENSE =====================
function editExpense(id) {
  const r = expenses.find(x => x.id === id);
  if (!r) return;
  fpEditExp.setDate(r.date || null, true);
  document.getElementById('xe_project').value     = r.project     || '';
  document.getElementById('xe_siteid').value      = r.siteid      || '';
  document.getElementById('xe_jobcode').value     = r.jobcode     || '';
  document.getElementById('xe_area').value        = r.area        || '';
  document.getElementById('xe_category').value    = r.category    || '';
  document.getElementById('xe_subcategory').value = r.subcategory || '';
  document.getElementById('xe_description').value = r.description || '';
  document.getElementById('xe_amount').value      = r.amount      || '';
  document.getElementById('xe_coordinator').value = r.coordinator || '';
  document.getElementById('xe_comment').value     = r.comment     || '';
  document.getElementById('xe_trackingno').value  = r.trackingno  || '';
  document.getElementById('editExpenseModal').dataset.editId = id;
  document.getElementById('editExpenseModal').classList.add('open');
}
function saveExpenseEdit() {
  const id  = parseInt(document.getElementById('editExpenseModal').dataset.editId);
  const idx = expenses.findIndex(x => x.id === id);
  if (idx < 0) return;
  const dateVal = document.getElementById('xe_date').value;
  const { year, month, day } = parseDate(dateVal);
  expenses[idx] = { ...expenses[idx], date: dateVal, year, month, day,
    project:     document.getElementById('xe_project').value.trim(),
    siteid:      document.getElementById('xe_siteid').value.trim(),
    jobcode:     document.getElementById('xe_jobcode').value.trim(),
    area:        document.getElementById('xe_area').value,
    category:    document.getElementById('xe_category').value,
    subcategory: document.getElementById('xe_subcategory').value,
    description: document.getElementById('xe_description').value.trim(),
    amount:      parseFloat(document.getElementById('xe_amount').value) || 0,
    coordinator: document.getElementById('xe_coordinator').value,
    comment:     document.getElementById('xe_comment').value.trim(),
    trackingno:  document.getElementById('xe_trackingno').value.trim(),
  };
  save(); renderExpenses();
  document.getElementById('editExpenseModal').classList.remove('open');
  toast('Expense updated!');
}
function closeEditExpense(e) {
  if (!e || e.target === document.getElementById('editExpenseModal'))
    document.getElementById('editExpenseModal').classList.remove('open');
}

// ===================== EDIT FUEL =====================
function editFuel(id) {
  const r = fuels.find(x => x.id === id);
  if (!r) return;
  fpEditFuel.setDate(r.date || null, true);
  document.getElementById('xf_project').value     = r.project     || '';
  document.getElementById('xf_siteid').value      = r.siteid      || '';
  document.getElementById('xf_jobcode').value     = r.jobcode     || '';
  document.getElementById('xf_area').value        = r.area        || '';
  document.getElementById('xf_startkm').value     = r.startkm     || '';
  document.getElementById('xf_endkm').value       = r.endkm       || '';
  document.getElementById('xf_fuelamount').value  = r.fuelamount  || '';
  document.getElementById('xf_kartaamount').value = r.kartaamount || '';
  document.getElementById('xf_driver').value      = r.driver      || '';
  document.getElementById('xf_city').value        = r.city        || '';
  document.getElementById('xf_coordinator').value = r.coordinator || '';
  document.getElementById('xf_trackingno').value  = r.trackingno  || '';
  document.getElementById('editFuelModal').dataset.editId = id;
  document.getElementById('editFuelModal').classList.add('open');
}
function saveFuelEdit() {
  const id  = parseInt(document.getElementById('editFuelModal').dataset.editId);
  const idx = fuels.findIndex(x => x.id === id);
  if (idx < 0) return;
  const dateVal = document.getElementById('xf_date').value;
  const { year, month, day } = parseDate(dateVal);
  fuels[idx] = { ...fuels[idx], date: dateVal, year, month, day,
    project:     document.getElementById('xf_project').value.trim(),
    siteid:      document.getElementById('xf_siteid').value.trim(),
    jobcode:     document.getElementById('xf_jobcode').value.trim(),
    area:        document.getElementById('xf_area').value,
    startkm:     parseFloat(document.getElementById('xf_startkm').value)     || 0,
    endkm:       parseFloat(document.getElementById('xf_endkm').value)       || 0,
    fuelamount:  parseFloat(document.getElementById('xf_fuelamount').value)  || 0,
    kartaamount: parseFloat(document.getElementById('xf_kartaamount').value) || 0,
    driver:      document.getElementById('xf_driver').value.trim(),
    city:        document.getElementById('xf_city').value.trim(),
    coordinator: document.getElementById('xf_coordinator').value,
    trackingno:  document.getElementById('xf_trackingno').value.trim(),
  };
  save(); renderFuels();
  document.getElementById('editFuelModal').classList.remove('open');
  toast('Fuel entry updated!');
}
function closeEditFuel(e) {
  if (!e || e.target === document.getElementById('editFuelModal'))
    document.getElementById('editFuelModal').classList.remove('open');
}

// ===================== PETTY CASH =====================
function submitCash(e) {
  e.preventDefault();
  const dateVal = document.getElementById('c_date').value;
  if (!dateVal) { toast('Please select a date'); return; }
  const { year, month, day } = parseDate(dateVal);
  const rec = {
    id: Date.now(),
    date: dateVal,
    year, month, day,
    amount: parseFloat(document.getElementById('c_amount').value) || 0
  };
  cashEntries.unshift(rec);
  save();
  renderCash();
  document.getElementById('cashForm').reset();
  setTimeout(() => fpCash.clear(), 0);
  toast('Petty cash saved!');
}

function deleteCash(id) {
  if (!confirm('Delete this cash entry? This cannot be undone.')) return;
  cashEntries = cashEntries.filter(r => r.id !== id);
  save();
  renderCash();
  toast('Deleted');
}

function renderCash() {
  const total = cashEntries.reduce((s, r) => s + r.amount, 0);
  document.getElementById('cashTotal').textContent = 'Total: ' + fmt(total);
  document.getElementById('cashCount').textContent = cashEntries.length + ' record' + (cashEntries.length !== 1 ? 's' : '');
  const list = document.getElementById('cashList');
  if (!cashEntries.length) {
    list.innerHTML = '<div class="empty-state">No petty cash entries yet.</div>';
    return;
  }
  list.innerHTML = cashEntries.map(r => `
    <div class="record-item">
      <div class="record-main">
        <div class="record-title">
          <span class="month-badge" style="background:var(--orange)">${esc(fmtDate(r))}</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:2px">
        <span class="record-amount" style="color:var(--orange)">${fmt(r.amount)}</span>
        <button class="edit-btn" onclick="editCash(${r.id})" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="delete-btn" onclick="deleteCash(${r.id})" title="Delete">&#x2715;</button>
      </div>
    </div>`).join('');
}

function editCash(id) {
  const r = cashEntries.find(x => x.id === id);
  if (!r) return;
  fpEditCash.setDate(r.date || null, true);
  document.getElementById('xc_amount').value = r.amount || '';
  document.getElementById('xc_id').value = id;
  document.getElementById('editCashModal').classList.add('open');
}

function saveCashEdit() {
  const id  = parseInt(document.getElementById('xc_id').value);
  const idx = cashEntries.findIndex(x => x.id === id);
  if (idx < 0) return;
  const dateVal = document.getElementById('xc_date').value;
  const { year, month, day } = parseDate(dateVal);
  cashEntries[idx] = { ...cashEntries[idx], date: dateVal, year, month, day,
    amount: parseFloat(document.getElementById('xc_amount').value) || 0
  };
  save(); renderCash();
  document.getElementById('editCashModal').classList.remove('open');
  toast('Updated!');
}

function closeEditCash(e) {
  if (!e || e.target === document.getElementById('editCashModal'))
    document.getElementById('editCashModal').classList.remove('open');
}
// ===================== EXPORT WITH DATE FILTER =====================
function getFilteredData() {
  const from = document.getElementById('rpt_from').value;
  const to   = document.getElementById('rpt_to').value;
  const inRange = (r) => {
    if (!r.date) return true;
    if (from && r.date < from) return false;
    if (to   && r.date > to)   return false;
    return true;
  };
  return { filteredExp: expenses.filter(inRange), filteredFuel: fuels.filter(inRange), from, to };
}
function updateExportPreview() {
  const { filteredExp, filteredFuel } = getFilteredData();
  const expTotal  = filteredExp.reduce((s,r)  => s + r.amount, 0);
  const fuelTotal = filteredFuel.reduce((s,r) => s + r.fuelamount + r.kartaamount, 0);
  document.getElementById('rpt_exp_info').textContent  = `${filteredExp.length} records · ${fmt(expTotal)}`;
  document.getElementById('rpt_fuel_info').textContent = `${filteredFuel.length} records · ${fmt(fuelTotal)}`;
  document.getElementById('exportPreview').style.display = 'block';
}
// ===================== SETTINGS =====================
function openSettings() {
  document.getElementById('settingName').value    = settings.name;
  document.getElementById('settingAccount').value = settings.account || 'VF';
  document.getElementById('settingsModal').classList.add('open');
}
function closeSettings(e) {
  if (!e || e.target === document.getElementById('settingsModal'))
    document.getElementById('settingsModal').classList.remove('open');
}
function saveSettings() {
  settings.name    = document.getElementById('settingName').value.trim();
  settings.account = document.getElementById('settingAccount').value.trim() || 'VF';
  save();
  document.getElementById('settingsModal').classList.remove('open');
  toast('Settings saved!');
}

// ===================== BACKUP / RESTORE =====================
function backupData() {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    expenses: expenses,
    fuels: fuels,
    settings: settings,
    cash: cashEntries
  };
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'EFTracker-Backup-' + new Date().toISOString().slice(0,10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Backup exported!');
}
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const backup = JSON.parse(e.target.result);
      if (!backup.expenses || !backup.fuels) { toast('Invalid backup file!'); return; }
      if (!confirm('This will replace ALL current data. Continue?')) return;
      expenses    = backup.expenses;
      fuels       = backup.fuels;
      if (backup.settings) settings    = backup.settings;
      if (backup.cash)     cashEntries = backup.cash;
      save();
      renderExpenses();
      renderFuels();
      renderCash();
      toast('Data restored successfully!');
      document.getElementById('settingsModal').classList.remove('open');
    } catch(err) {
      toast('Failed to read backup file!');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ===================== BALANCE SHEET EXPORT =====================
async function exportBalanceSheet() {
  try {
    var from    = document.getElementById('rpt_from').value;
    var to      = document.getElementById('rpt_to').value;
    var empName = settings.name    || 'N/A';
    var account = settings.account || 'VF';

    var expData = expenses, fuelData = fuels, cashData = cashEntries;
    var period  = null;
    if (from || to) {
      var inRange = function(r) {
        if (!r.date) return true;
        if (from && r.date < from) return false;
        if (to   && r.date > to  ) return false;
        return true;
      };
      expData  = expenses.filter(inRange);
      fuelData = fuels.filter(inRange);
      cashData = cashEntries.filter(inRange);
      period   = (from || 'All') + (to ? ' to ' + to : '');
    }

    var trackMap = {};
    expData.forEach(function(r) {
      var k = r.trackingno || '\u2014';
      if (!trackMap[k]) trackMap[k] = { exp: 0, fuel: 0 };
      trackMap[k].exp += r.amount;
    });
    fuelData.forEach(function(r) {
      var k = r.trackingno || '\u2014';
      if (!trackMap[k]) trackMap[k] = { exp: 0, fuel: 0 };
      trackMap[k].fuel += r.fuelamount + r.kartaamount;
    });

    var expTotal  = expData.reduce(function(s,r){ return s + r.amount; }, 0);
    var fuelTotal = fuelData.reduce(function(s,r){ return s + r.fuelamount + r.kartaamount; }, 0);
    var cashTotal = cashData.reduce(function(s,r){ return s + r.amount; }, 0);
    var spending  = expTotal + fuelTotal;
    var balance   = cashTotal - spending;

    var today   = new Date();
    var MN      = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var dateStr = today.getDate() + '-' + MN[today.getMonth()] + '-' + String(today.getFullYear()).slice(2);
    function fn(n) { return (n||0).toLocaleString('en-EG',{minimumFractionDigits:2,maximumFractionDigits:2}); }

    var jsPDF = window.jspdf.jsPDF;
    var doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var W = doc.internal.pageSize.getWidth();
    var lm = 14, rm = 14, cw = W - lm - rm;

    var NAVY  = [0,32,96];
    var GREEN = [146,208,80];
    var WHITE = [255,255,255];
    var LGRAY = [220,220,220];
    var LBLUE = [235,243,250];
    var LGREEN= [226,240,217];
    var LRED  = [252,228,214];

    var y = 10;

    // --- Logo ---
    try {
      var logoEl = document.querySelector('img[alt="Landmark Plus"]');
      if (logoEl && logoEl.src.indexOf('base64,') >= 0) {
        doc.addImage(logoEl.src, 'JPEG', lm, y, 36, 22);
      }
    } catch(e2) {}

    // --- Title bar ---
    doc.setFillColor(...GREEN);
    doc.rect(lm + 38, y, cw - 38, 13, 'F');
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Balance Sheet', W - rm - 2, y + 9, { align: 'right' });

    // --- Account row ---
    doc.setFillColor(...LBLUE);
    doc.rect(lm + 38, y + 13, cw - 38, 9, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Account:', lm + 40, y + 19);
    doc.setFont('helvetica', 'normal');
    doc.text(account, lm + 60, y + 19);
    y += 26;

    // --- Navy separator ---
    doc.setFillColor(...NAVY);
    doc.rect(lm, y, cw, 1.5, 'F');
    y += 3;

    // --- Info row ---
    doc.setFillColor(255,255,255);
    doc.rect(lm, y, cw, 8, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...NAVY);
    doc.text('Name:', lm + 1, y + 5.5);
    doc.setFont('helvetica','normal');
    doc.text(empName, lm + 15, y + 5.5);
    doc.setFont('helvetica','bold');
    doc.text('Date:', lm + 90, y + 5.5);
    doc.setFont('helvetica','normal');
    doc.text(dateStr, lm + 103, y + 5.5);
    if (period) {
      doc.setFont('helvetica','bold');
      doc.text('Period:', lm + 130, y + 5.5);
      doc.setFont('helvetica','normal');
      doc.text(period, lm + 147, y + 5.5);
    }
    y += 10;

    // --- Navy separator ---
    doc.setFillColor(...NAVY);
    doc.rect(lm, y, cw, 1.5, 'F');
    y += 4;

    // --- Petty Cash row ---
    doc.setFillColor(...LGREEN);
    doc.rect(lm, y, cw, 8, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(0,112,60);
    doc.text('Petty Cash Received', lm + 2, y + 5.5);
    doc.text(fn(cashTotal) + ' EGP', W - rm - 2, y + 5.5, { align: 'right' });
    y += 11;

    // --- Tracking number table ---
    var trackKeys = Object.keys(trackMap);
    var tBody = trackKeys.map(function(k) {
      var d = trackMap[k];
      return [k, fn(d.exp), fn(d.fuel), fn(d.exp + d.fuel)];
    });
    if (tBody.length === 0) tBody = [['No records', '\u2014', '\u2014', '\u2014']];

    doc.autoTable({
      startY: y,
      head:   [['Tracking #', 'Expenses (EGP)', 'Fuel (EGP)', 'Total (EGP)']],
      body:   tBody,
      margin: { left: lm, right: rm },
      styles:     { fontSize: 10, cellPadding: 2.5, textColor: NAVY, valign: 'middle' },
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { halign: 'left',  cellWidth: 66 },
        1: { halign: 'right', cellWidth: 38 },
        2: { halign: 'right', cellWidth: 38 },
        3: { halign: 'right', cellWidth: 40 }
      },
      alternateRowStyles: { fillColor: LGRAY },
      tableLineColor: NAVY,
      tableLineWidth: 0.3
    });

    y = doc.lastAutoTable.finalY + 4;

    // --- Summary rows ---
    function sumRow(label, val, bg, fc, bold, h) {
      h = h || 8;
      doc.setFillColor(...bg);
      doc.rect(lm, y, cw, h, 'F');
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(10); doc.setTextColor(...fc);
      doc.text(label, lm + 2, y + h/2 + 1.5);
      doc.text(fn(val) + ' EGP', W - rm - 2, y + h/2 + 1.5, { align: 'right' });
      y += h + 1;
    }
    sumRow('Total Expenses',            expTotal, LRED,   [192,0,0],   false);
    sumRow('Total Fuel (Fuel + Karta)', fuelTotal,LRED,   [192,0,0],   false);
    sumRow('Total Spending',            spending, LRED,   [192,0,0],   true);
    var balBg = balance >= 0 ? LGREEN : LRED;
    var balFc = balance >= 0 ? [0,112,60] : [192,0,0];
    sumRow(balance >= 0 ? 'Balance (Surplus)' : 'Balance (Deficit)', balance, balBg, balFc, true, 11);

    // --- Footer separator ---
    doc.setFillColor(...NAVY);
    doc.rect(lm, y + 2, cw, 2, 'F');
    y += 7;

    // --- Signature boxes ---
    var boxW = (cw - 3) / 4;
    var boxH = 16;
    var labels  = ['Approval', 'Accounts Mgr', 'Manager', 'Tracking #'];
    var subLine = ['\u0627\u0644\u062A\u0627\u0631\u064A\u062E: ' + dateStr, '', '', ''];
    doc.setTextColor(...NAVY);
    for (var i = 0; i < 4; i++) {
      var bx = lm + i * (boxW + 1);
      doc.setDrawColor(...NAVY);
      doc.rect(bx, y, boxW, boxH);
      doc.setFont('helvetica','bold'); doc.setFontSize(9);
      doc.text(labels[i], bx + boxW/2, y + 6, { align: 'center' });
      if (subLine[i]) {
        doc.setFont('helvetica','normal'); doc.setFontSize(8);
        doc.text(subLine[i], bx + boxW/2, y + 12, { align: 'center' });
      }
    }

    var ds = new Date().toISOString().slice(0,10);
    doc.save('Balance-Sheet_' + ds + '.pdf');
    toast('Balance sheet exported as PDF!');
  } catch(e) { toast('Export error: ' + e.message); }
}// ===================== CONFIRM CLEAR =====================
function confirmClear() {
  if (confirm('Delete ALL expenses, fuel and petty cash records? This cannot be undone.')) {
    expenses = []; fuels = []; cashEntries = [];
    save();
    renderExpenses();
    renderFuels();
    renderCash();
    toast('All data cleared');
    switchPage('expenses');
  }
}

// ===================== HELPERS =====================
function v(id) { return document.getElementById(id).value.trim(); }
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fmt(n) { return (n||0).toLocaleString('en-EG', { minimumFractionDigits:0, maximumFractionDigits:2 }) + ' EGP'; }
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}
function updateSubCategory() {
  // Sub category is already generic, no change needed; kept for future logic
}

// ===================== INIT =====================
const fpConfig = { dateFormat: 'Y-m-d', altInput: true, altFormat: 'j-M-Y', allowInput: false };
let fpExpense, fpFuel, fpEditExp, fpEditFuel, fpRptFrom, fpRptTo, fpCash, fpEditCash;
fpExpense  = flatpickr('#e_date',   fpConfig);
fpFuel     = flatpickr('#f_date',   fpConfig);
fpEditExp  = flatpickr('#xe_date',  fpConfig);
fpEditFuel = flatpickr('#xf_date',  fpConfig);
fpCash     = flatpickr('#c_date',   fpConfig);
fpEditCash = flatpickr('#xc_date',  fpConfig);
fpRptFrom  = flatpickr('#rpt_from', { ...fpConfig, onChange: updateExportPreview });
fpRptTo    = flatpickr('#rpt_to',   { ...fpConfig, onChange: updateExportPreview });

// Clear flatpickr after form resets
document.getElementById('expenseForm').addEventListener('reset', () => setTimeout(() => fpExpense.clear(), 0));
document.getElementById('fuelForm').addEventListener('reset',    () => setTimeout(() => fpFuel.clear(),    0));
document.getElementById('cashForm').addEventListener('reset',    () => setTimeout(() => fpCash.clear(),    0));

renderExpenses();
renderFuels();
renderCash();