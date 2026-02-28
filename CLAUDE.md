# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-file mobile-first web application for tracking telecom department expenses and fuel consumption. The entire app lives in `index.html` — no build tools, no dependencies to install, no server required. Open it directly in any browser including Android via file manager.

## Running the App

Open `index.html` directly in a browser. For local dev with live-reload:
```
npx serve .
# or
python -m http.server 8080
```

## Architecture

Everything is in `index.html` as a single self-contained file.

**`<style>`** — CSS custom properties (`--blue:#0070C0`, `--green:#00B050`, `--orange:#FF6600`). Mobile-first, fixed bottom nav, sticky header. No external CSS framework.

**HTML body — 5 pages** toggled via `display:none/block`:
- `#page-expenses` — expense form + accordion record list
- `#page-fuel` — fuel form + accordion record list
- `#page-analytics` — stat cards, balance card, Chart.js charts
- `#page-cash` — petty cash form + record list
- `#page-export` — date filter, export buttons

Fixed bottom `<nav>` with 5 buttons. Active colors: Expenses=blue, Fuel=green (`#nav-fuel.active`), Analytics=brown `#92400e`, Cash=orange, Export=black `#111`.

**`<script>`** — Vanilla JS, no framework. Key sections marked with `// === SECTION ===` comments:

- **DATA STORE** — `expenses[]`, `fuels[]`, `cashEntries[]`, `settings{}`. Persisted via `save()` to localStorage keys `ef_expenses`, `ef_fuels`, `ef_cash`, `ef_settings`.
- **EXPENSE/FUEL FORMS** — `submitExpense()` / `submitFuel()`. Records include `trackingno` field.
- **RENDER** — `renderExpenses()` / `renderFuels()`: groups records by `trackingno` (or `—`) into accordion UI. `.track-group` → `.track-header` (onclick `toggleTrackGroup(this)`) → `.track-body`. `toggleTrackGroup(hdr)` toggles `.open` class.
- **ANALYTICS** — `renderAnalytics()`: destroys and recreates 3 Chart.js instances. Always destroy before re-creating. Balance = Petty Cash − (Expenses + Fuel).
- **TRACKING EXPORT MODAL** — `openTrackingExportModal()` builds checkbox list of all tracking numbers. `exportByTracking()` filters by selected tracking numbers + date range then exports.
- **EXCEL EXPORT** — `buildSheet(wb, logoId, ...)` shared async helper using ExcelJS. Called by `exportFiltered()` (date-filtered) and `exportByTracking()` (tracking # filtered). `exportBalanceSheet()` builds a 7-column per-tracking-number summary sheet.
- **EDIT/DELETE** — `editExpense(id)` / `saveExpenseEdit()` and fuel equivalents. Modals use `fpEditExp.setDate(r.date, true)`.
- **PETTY CASH** — `submitCash()`, `renderCash()`, `editCash()`, `saveCashEdit()`, `deleteCash()`.
- **SETTINGS** — Settings modal has Name, Account fields + Backup/Restore JSON + Clear All Data button.

## External CDN Dependencies

- **flatpickr** `https://cdn.jsdelivr.net/npm/flatpickr` + CSS — date picker (`altInput:true`, `altFormat:'j-M-Y'`, stored as `YYYY-MM-DD`)
- **ExcelJS** `https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js` — Excel export with full cell styling
- **FileSaver.js** `https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js` — browser file download for ExcelJS `writeBuffer()` output
- **Chart.js** `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js` — Analytics charts

## Excel Export Format

`buildSheet(wb, logoId, sheetName, sheetTitle, headers, rows, amtTotal, fuelTotal, kartaTotal, colWidths, empName, account, period)` — async, returns after awaiting.

ARGB colors used: `NAVY=FF002060`, `GREEN=FF92D050`, `WHITE=FFFFFFFF`, `LGRAY=FFD9D9D9`, `LBLUE=FFEBF3FA`, `DGRAY=FF595959`.

Sheet structure (both tabs):
- Row 1 (h=44): Logo placeholder (cols 1-3 white) + green title (cols 4-n, merged)
- Row 2 (h=20): Logo continues + Account label | account value
- `ws.mergeCells(1,1,2,3)` for logo area
- Navy separator (h=4)
- Info row: Name label/value + Total (fuel adds Fuel + Karta)
- Navy separator (h=4)
- Column headers (h=28): navy fill, white bold, `ws.autoFilter`
- Data rows (h=18): alternating white/gray, navy outer frame borders
- Footer separator (h=6, navy)
- Footer labels row: إعتماد | مدير الحسابات | المدير المسؤول | Tracking#
- Footer date row: التاريخ: + d-Mon-YY

Balance Sheet (`exportBalanceSheet`) uses 7 columns: cols 1-3=logo, col 4=Tracking# (merged 1-4 per row), cols 5-7 = Expenses | Fuel | Total per tracking number, then summary + balance rows.

## Data Schema

```js
// Expense record
{ id, date, year, month, day, project, siteid, jobcode, area,
  category, subcategory, description, amount, coordinator, comment, trackingno }

// Fuel record
{ id, date, year, month, day, project, siteid, jobcode, area,
  startkm, endkm, fuelamount, kartaamount, driver, city, coordinator, trackingno }

// Cash entry
{ id, date, year, month, day, amount }

// Settings
{ name, account }  // account defaults to "VF"
```

## Image Assets — Critical: Base64 Embedded

All images embedded as Base64 data URIs. **Never use relative file paths** — Android `content://` URIs break relative paths.

- `img[alt="Expense & Fuel Tracker"]` — banner (`Expense-Fuel Logo -2.jpg`)
- `img[alt="Landmark Plus"]` — settings logo (`LMP Big Logo.jpg`), also used as Excel logo by `exportExcel()` and `exportBalanceSheet()`

To swap: `$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes('path.jpg'))`

## Reference File

`Expense-Fuel Tracking.xlsm` — original Excel template. Three sheets:
- **List** (hidden) — dropdown source data
- **Expenses Tracking** — blue-themed, 12 columns
- **Fuel Tracking** — green-themed, 13 columns
