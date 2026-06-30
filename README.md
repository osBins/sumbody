# sumbody

A lightweight desktop app for managing membership records. Import, filter, search, edit, and export member data.

## Features

- Import `.xlsx` / `.csv` via drag-and-drop or file picker
- Multi-select filters with OR logic (city, state, category, qualification, region, salutation, pincode)
- Collapsible filter sections (Contact, Location, Member Info, Dates)
- Fuzzy search across name and location
- Inline edit via row edit button or right-click context menu
- Row highlighting in edit mode
- CSV export of filtered view
- Member selection with checkboxes, select all, bulk email and bulk delete
- Email compose dialog with Gmail, Yahoo, and copy-to-clipboard options
- Email All (To/Cc/Bcc) to filtered members
- WhatsApp per member with compose dialog
- SMS per member via Phone Link
- Phone call (tel:) per member
- Google Maps lookup for residential and professional addresses
- Call logging per member with date, time, type, and summary
- Call Log tab with pagination, name/date filters, and delete support
- Call logs filtered by same sidebar member filters
- Birthday tray on launch
- Sticky Name and Actions columns on horizontal scroll
- Right-click context menu with icons for all actions
- Columns ordered by importance (Name, Contact, Address, Membership)
- Click-outside and X button to dismiss all dialogs
- Clear all filters option
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
