# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-file mobile-first web application for tracking telecom department expenses and fuel consumption. The entire app lives in `Expense-Fuel Tracking.html` — no build tools, no dependencies to install, no server required. Open it directly in any browser including Android via file manager.

**Version: V1.0**

## Running the App

Open `Expense-Fuel Tracking.html` directly in a browser. For local dev with live-reload:
```
npx serve .
# or
python -m http.server 8080
```

## Architecture

Everything is in `Expense-Fuel Tracking.html` as a single self-contained file.

**`<head>`** — Base64-embedded favicon + apple-touch-icon (`budget (1).png`), theme-color `#0070C0`.

**`<style>`** — CSS custom properties (`--blue:#0070C0`, `--green:#00B050`, `--orange:#FF6600`). Mobile-first, fixed bottom nav, sticky header. No external CSS framework.

**HTML body — 5 pages** toggled via `display:none/block`:
- `#page-expenses` — expense form + accordion record list
- `#page-fuel` — fuel form + accordion record list
- `#page-analytics` — stat cards, balance card, Chart.js charts
- `#page-cash` — petty cash form + record list
- `#page-export` — date filter, export buttons

Fixed bottom `<nav>` — 5 buttons in order: **Cash → Expenses → Fuel → Analytics → Export**.
Active colors: Cash=orange, Expenses=blue (default), Fuel=green, Analytics=brown `#92400e`, Export=black `#111`.
Cash icon has ▼ polygon (money in); Expenses icon has ▲ polygon (money out).

**`<script>`** — Vanilla JS, no framework. Key sections marked with `// === SECTION ===` comments:

- **DATA STORE** — `expenses[]`, `fuels[]`, `cashEntries[]`, `settings{}`. Persisted via `save()` to localStorage keys `ef_expenses`, `ef_fuels`, `ef_cash`, `ef_settings`.
- **EXPENSE/FUEL FORMS** — `submitExpense()` / `submitFuel()`. Records include `trackingno` field. Project Name is a `<select>` with options: ROT, TRX, ATN, PTN, RD EXP.
- **RENDER** — `renderExpenses()` / `renderFuels()`: groups records by `trackingno` (or `—`) into accordion UI. `.track-group` → `.track-header` (onclick `toggleTrackGroup(this)`) → `.track-body`.
- **DELETE** — All delete functions (`deleteExpense`, `deleteFuel`, `deleteCash`) show `confirm()` before deleting.
- **ANALYTICS** — `renderAnalytics()`: stat cards show unique tracking # counts (not record counts). Balance = Petty Cash − (Expenses + Fuel). Destroys/recreates 3 Chart.js instances.
- **TRACKING EXPORT MODAL** — `openTrackingExportModal()` builds checkbox list. `exportByTracking()` filters by selected tracking numbers + date range then exports Excel.
- **EXCEL EXPORT** — `buildSheet(wb, logoId, ...)` shared async helper using ExcelJS. Called by `exportFiltered()` and `exportByTracking()`.
- **BALANCE SHEET PDF** — `exportBalanceSheet()` uses jsPDF + autotable. A4 portrait PDF with logo, tracking-number table, summary rows, signature footer.
- **EDIT/DELETE** — `editExpense(id)` / `saveExpenseEdit()` and fuel equivalents. Modals use `fpEditExp.setDate(r.date, true)`.
- **PETTY CASH** — `submitCash()`, `renderCash()`, `editCash()`, `saveCashEdit()`, `deleteCash()`.
- **SETTINGS** — Settings modal: Name + Account fields, Backup/Restore JSON, Clear All Data button. Copyright shows "© 2026 LMP Expense & Fuel Tracker V1.0".

## External CDN Dependencies

- **flatpickr** `https://cdn.jsdelivr.net/npm/flatpickr` + CSS — date picker (`altInput:true`, `altFormat:'j-M-Y'`, stored as `YYYY-MM-DD`)
- **ExcelJS** `https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js` — Excel export with full cell styling
- **FileSaver.js** `https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js` — browser file download
- **Chart.js** `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js` — Analytics charts
- **jsPDF** `https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js` — PDF export
- **jsPDF-autotable** `https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js` — table rendering in PDF

## Excel Export Format

`buildSheet(wb, logoId, sheetName, sheetTitle, headers, rows, amtTotal, fuelTotal, kartaTotal, colWidths, empName, account, period)` — async.

ARGB colors: `NAVY=FF002060`, `GREEN=FF92D050`, `WHITE=FFFFFFFF`, `LGRAY=FFD9D9D9`, `LBLUE=FFEBF3FA`, `DGRAY=FF595959`.

Sheet structure: Logo (cols 1-3) + green title → Account row → navy separator → info row → navy separator → column headers (navy/white/autoFilter) → data rows (alt white/gray) → navy footer → Arabic signature footer (إعتماد | مدير الحسابات | المدير المسؤول | Tracking#) → date row.

## Balance Sheet PDF Format

`exportBalanceSheet()` — uses `window.jspdf.jsPDF` + `doc.autoTable(...)`. A4 portrait, 14mm margins.

Layout: LMP logo (36×22mm) + green title bar + LBLUE account row → navy separator → info row (Name/Date/Period) → navy separator → Petty Cash Received (LGREEN) → autoTable (Tracking# | Expenses | Fuel | Total, NAVY header) → summary rows (LRED: Total Expenses, Total Fuel, Total Spending) → balance row (LGREEN/LRED) → navy separator → 4 signature boxes (Approval | Accounts Mgr | Manager | Tracking#).

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

- `img[alt="Expense & Fuel Tracker"]` — banner (`Banner new.jpg`)
- `img[alt="Landmark Plus"]` — settings logo (`LMP Big Logo.jpg`, `width:40%;max-width:130px`), also used as PDF/Excel logo
- Favicon + apple-touch-icon — `budget (1).png` (embedded in `<head>`)

To swap: `$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes('path.jpg'))`

## Key Dropdown Values

- **Project Name** (select): ROT, TRX, ATN, PTN, RD EXP — sourced from `List.xlsx`
- Area: Cairo, Giza, Alex, Delta, Upper
- Category: Labors, Accommodation, Mobile & Communication, Logistic, Site Guard, Material, Other
- Sub Category: Fuel, Karta, Transportation, Car Rent, Copy, Labor, Medical, Car Oil, WH Rent, Allowance, Team Rent, Internet
- Coordinators: Mahmoud El-Gendy, Mahmoud Amien, Abd El Al, Ashraf Fathy, Farouk Atef, Ahmed Abd El-Aziz, Saad El-Dweik
- Driver: free-text input (not a dropdown)

## Reference File

`Expense-Fuel Tracking.xlsm` — original Excel template. Three sheets:
- **List** (hidden) — dropdown source data (also saved as `List.xlsx`)
- **Expenses Tracking** — blue-themed, 12 columns
- **Fuel Tracking** — green-themed, 13 columns

## PowerShell Notes

- Write scripts to `C:\tmp\*.ps1`, run with `powershell -ExecutionPolicy Bypass -File "C:\\tmp\\script.ps1"`
- Use `[IO.File]::ReadAllText` / `WriteAllText` with `[Text.Encoding]::UTF8`
- **Avoid em-dashes (—) in PS string literals** — causes `TerminatorExpectedAtEndOfString` parse error
- Use `[regex]::Replace($content, '(?s)pattern', replacement)` for multiline find/replace
