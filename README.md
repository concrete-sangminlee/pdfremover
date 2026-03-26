<div align="center">

# FileForge

**The open-source, privacy-first document toolkit that runs entirely in your browser.**

No server uploads. No sign-ups. No limits. Just fast, secure document processing.

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Bundle Size](https://img.shields.io/badge/First_Load-104KB-green)](/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[**Live Demo**](https://pdfcontrol.vercel.app) · [Report Bug](https://github.com/concrete-sangminlee/pdfremover/issues) · [Request Feature](https://github.com/concrete-sangminlee/pdfremover/issues)

</div>

---

## Why FileForge?

Most online document tools upload your files to remote servers. **FileForge processes everything locally in your browser** using WebAssembly-powered libraries. Your files never leave your device.

| | FileForge | iLovePDF / SmallPDF |
|---|:---:|:---:|
| **100% Browser Processing** | ✅ | ❌ |
| **No Server Upload** | ✅ | ❌ |
| **No Sign-up Required** | ✅ | ❌ (limited) |
| **Completely Free** | ✅ | ❌ (freemium) |
| **Open Source** | ✅ | ❌ |
| **Works Offline** | ✅ | ❌ |
| **First Load Size** | 104 KB | 2+ MB |

---

## 20 Professional Tools

### PDF Tools (10)

<table>
<tr>
<td align="center" width="20%">🔓<br><b>Unlock</b><br><sub>Remove passwords & restrictions<br>Batch support</sub></td>
<td align="center" width="20%">📋<br><b>Merge</b><br><sub>Combine multiple PDFs<br>Drag to reorder</sub></td>
<td align="center" width="20%">✂️<br><b>Split</b><br><sub>Divide by page ranges<br>or individual pages</sub></td>
<td align="center" width="20%">📄<br><b>Extract</b><br><sub>Pick specific pages<br>Custom ranges</sub></td>
<td align="center" width="20%">🔄<br><b>Rotate</b><br><sub>90° / 180° / 270°<br>All or specific pages</sub></td>
</tr>
<tr>
<td align="center">📦<br><b>Optimize</b><br><sub>Strip metadata<br>Reduce file size</sub></td>
<td align="center">💧<br><b>Watermark</b><br><sub>Text watermarks<br>Tiled / Center / Diagonal</sub></td>
<td align="center">🔢<br><b>Page Numbers</b><br><sub>Auto-numbering<br>5 positions, 2 formats</sub></td>
<td align="center">🗑️<br><b>Delete Pages</b><br><sub>Remove unwanted pages<br>With confirmation</sub></td>
<td align="center">ℹ️<br><b>PDF Info</b><br><sub>Metadata viewer<br>One-click copy</sub></td>
</tr>
</table>

### Image Tools (6)

<table>
<tr>
<td align="center" width="25%">🖼️<br><b>Image → PDF</b><br><sub>JPG/PNG to PDF<br>Batch support</sub></td>
<td align="center" width="25%">📷<br><b>PDF → Image</b><br><sub>Pages to PNG<br>High-quality 2x render</sub></td>
<td align="center" width="25%">🗜️<br><b>Image Compress</b><br><sub>Reduce file size<br>Quality control</sub></td>
<td align="center" width="25%">🔍<br><b>Image Resize</b><br><sub>Scale 10%–200%<br>Batch support</sub></td>
</tr>
<tr>
<td align="center">🧩<br><b>Image Stitch</b><br><sub>Combine images<br>Vertical / Horizontal</sub></td>
<td align="center">🎨<br><b>Image Convert</b><br><sub>PNG ↔ JPG ↔ WebP<br>Batch support</sub></td>
<td align="center" colspan="2"></td>
</tr>
</table>

### Document & Text Tools (4)

<table>
<tr>
<td align="center" width="25%">📝<br><b>DOCX Viewer</b><br><sub>Preview Word docs<br>in browser</sub></td>
<td align="center" width="25%">📋<br><b>PDF Text</b><br><sub>Extract text content<br>from PDF files</sub></td>
<td align="center" width="25%">📝<br><b>Text → PDF</b><br><sub>Type text, create PDF<br>Instant conversion</sub></td>
<td align="center" width="25%">🌐<br><b>HTML → PDF</b><br><sub>Convert HTML files<br>to PDF documents</sub></td>
</tr>
</table>

---

## Architecture

**Key design decisions:**

- **Dynamic imports** — `pdf-lib` (225KB), `pdfjs-dist`, `jszip` (100KB), and `mammoth` are lazy-loaded only when a tool is actually used, keeping the initial bundle at just **104KB**
- **Static Site Generation** — All 21 pages are pre-rendered at build time for instant loading
- **Zero backend** — No API routes, no database, no server-side processing. Deploy anywhere that serves static files
- **SEO-first routing** — Each tool has its own URL (`/unlock`, `/merge`, etc.) with dedicated meta tags, Open Graph, and structured data

---

## Features

### User Experience
- 🌐 **Bilingual** — Full Korean + English support with auto-detection from `navigator.language`
- 🌙 **Dark mode** — System preference auto-detection + manual toggle, fully themed across all pages
- 📱 **Mobile-first** — Fixed bottom CTA bar, responsive layout, touch-friendly 44px targets
- ⌨️ **Keyboard shortcuts** — `Esc` to go home (guarded during processing)
- 🔄 **Batch processing** — Upload multiple files for batch operations with progress indicator
- 📊 **Smart context** — Page count hints, file size warnings (>50MB), processing time display
- 🔗 **Share** — Native share API on mobile, clipboard fallback on desktop
- 🎯 **Contextual suggestions** — Related tools based on what you just used
- 🖱️ **Drag & drop** — Full drag-and-drop support for all file types (PDF, images, DOCX, HTML)

### Technical
- ⚡ **111KB First Load** — Optimized through dynamic imports and tree-shaking
- 🏗️ **21 static pages** — Pre-rendered with `generateStaticParams`
- 🔍 **Full SEO** — Sitemap, robots.txt, per-tool meta tags, JSON-LD structured data
- 📲 **PWA ready** — Web app manifest, SVG favicon, Apple mobile web app support
- ♿ **Accessible** — `aria-labels`, `focus-visible` rings, semantic HTML, WCAG AA contrast, `prefers-reduced-motion`
- 🛡️ **Error boundaries** — Graceful error recovery with custom error and 404 pages
- 💾 **Persistent state** — Language, theme, history, and processed count stored in `localStorage`
- 🔒 **Memory safe** — Proper cleanup of Object URLs to prevent memory leaks
- 🔤 **Optimized fonts** — Self-hosted Inter via `next/font` (no external requests)

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Development

```bash
# Clone the repository
git clone https://github.com/concrete-sangminlee/pdfremover.git
cd pdfremover

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/concrete-sangminlee/pdfremover)

One-click deploy. No configuration needed.

---

## Project Structure

```
app/
├── page.tsx                 # Home page (tool grid)
├── [tool]/page.tsx          # Dynamic tool routes with per-tool SEO
├── components/
│   └── toolkit-app.tsx      # Main client component (all UI + logic)
├── lib/
│   └── config.ts            # Shared types, tool definitions, colors
├── layout.tsx               # Root layout, meta tags, next/font
├── globals.css              # Design system (Tailwind + custom)
├── sitemap.ts               # Dynamic sitemap generation
├── robots.ts                # Robots.txt generation
├── error.tsx                # Error boundary
└── not-found.tsx            # 404 page
public/
├── manifest.json            # PWA manifest
├── pdf.worker.min.mjs       # PDF.js web worker
└── icon.svg                 # SVG favicon
```

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| [Next.js 14](https://nextjs.org) | Framework (Static Site Generation) |
| [React 18](https://react.dev) | UI library |
| [TypeScript 5](https://typescriptlang.org) | Type safety |
| [Tailwind CSS 3](https://tailwindcss.com) | Styling |
| [pdf-lib](https://pdf-lib.js.org) | PDF processing (client-side) |
| [pdfjs-dist](https://mozilla.github.io/pdf.js/) | PDF rendering & text extraction |
| [mammoth](https://github.com/mwilliamson/mammoth.js) | DOCX to HTML conversion |
| [JSZip](https://stuk.github.io/jszip/) | ZIP packaging for batch downloads |

---

## Contributing

Contributions are welcome! Here are some ways you can help:

- 🐛 **Report bugs** — [Open an issue](https://github.com/concrete-sangminlee/pdfremover/issues)
- 💡 **Suggest features** — [Start a discussion](https://github.com/concrete-sangminlee/pdfremover/issues)
- 🔧 **Submit PRs** — Fork, branch, commit, and open a pull request
- 🌍 **Add translations** — Help us support more languages
- 📝 **Improve docs** — Fix typos, add examples, clarify instructions

### Development Guidelines

1. **No server-side processing** — All document operations must run in the browser
2. **Keep bundle small** — Use dynamic imports for heavy libraries
3. **Bilingual** — All user-facing strings must be in both Korean and English
4. **Accessible** — Follow WCAG AA guidelines
5. **Mobile-first** — Test on mobile viewports
6. **Memory safe** — Always revoke Object URLs after use

---

## Roadmap

- [x] ~~Dark mode~~ — Complete with system preference + manual toggle
- [ ] PDF password protection (encryption)
- [ ] More languages (Japanese, Chinese, Spanish)
- [ ] Service worker for full offline support
- [ ] PDF preview before processing
- [ ] Unit tests for all tools
- [ ] Performance benchmarks vs competitors
- [ ] PDF form filling
- [ ] PDF annotation tools

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built with privacy in mind for users worldwide.**

If you find this useful, please consider giving it a star.

</div>
