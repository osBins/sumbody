# sumbody

A lightweight desktop app for managing membership records. Import, filter, search, edit, and export member data.

## Features

- Import `.xlsx` / `.csv` via drag-and-drop or file picker
- Multi-select filters with OR logic (city, state, category, qualification, region, salutation)
- Fuzzy search across name and location
- Inline edit via row edit button or right-click context menu
- CSV export of filtered view
- Email All (To/Cc/Bcc) to filtered members
- WhatsApp per member with compose dialog
- Birthday tray on launch
- Virtualized table — handles 10,000+ records
- Auto-updater via GitHub Releases
- Offline — SQLite, no internet needed (except update checks)

## Install

Download from [Releases](../../releases):
- `SumBody_x.x.x_x64-setup.exe` — installer (recommended, auto-updates)
- `sumbody.exe` — portable (Windows 10 21H2+ with WebView2)

## Dev

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run tauri build
```

## Stack

Tauri 2 · React · TypeScript · TailwindCSS · Shadcn UI · SQLite · PapaParse · SheetJS · Fuse.js · @tanstack/react-virtual

---

Built for pitaji 👨
