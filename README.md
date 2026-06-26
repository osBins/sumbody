# sumbody

A desktop app for managing memberships. Import, filter, search, edit, and export member data.

## Features

- **Import**: Drag-and-drop or browse for `.xlsx` / `.csv` files
- **Filter**: Multi-select dropdowns for city, state, category, qualification, region, salutation — with OR logic
- **Search**: Fuzzy search across name and location fields
- **Edit**: Right-click a cell or use the row edit button
- **Export**: One-click CSV export of the current filtered view
- **Offline**: All data stored locally in SQLite — no internet required

## Install

Download the latest `.exe` installer from [Releases](../../releases).

## Dev Setup

Requires: Node.js 20+, Rust (via rustup)

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run tauri build
```

Or trigger the GitHub Actions workflow for a Windows `.exe`.

## Tech Stack

Tauri 2 · React · TypeScript · TailwindCSS · Shadcn UI · SQLite · PapaParse · SheetJS · Fuse.js

---
Built for pitaji 🧔‍♂️.
