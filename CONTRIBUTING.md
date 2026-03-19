# Contributing to PDF Toolkit Pro

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
git clone https://github.com/concrete-sangminlee/pdfremover.git
cd pdfremover
npm install
npm run dev
```

## Project Principles

1. **No server-side processing** — All PDF operations must run entirely in the browser
2. **Keep the bundle small** — Use `await import()` for heavy libraries (pdf-lib, jszip)
3. **Bilingual** — All user-facing strings must exist in both Korean (`T.ko`) and English (`T.en`)
4. **Accessible** — WCAG AA contrast, `aria-labels`, keyboard navigable, 44px touch targets
5. **Mobile-first** — Test on 375px viewport before desktop

## Code Structure

| File | Purpose |
|------|---------|
| `app/components/toolkit-app.tsx` | Main UI component (all tools, views, state) |
| `app/lib/config.ts` | Shared types, tool definitions (server + client) |
| `app/globals.css` | Design system (Tailwind + custom classes) |
| `app/[tool]/page.tsx` | Per-tool SEO metadata |
| `app/layout.tsx` | Root layout, fonts, structured data |

## Adding a New Tool

1. Add the tool ID to the `Tool` type in `config.ts`
2. Add a `ToolDef` entry in the `TOOLS` array with icon, colors, label keys
3. Add Korean + English translations in `T.ko` and `T.en` in `toolkit-app.tsx`
4. Write the PDF operation function using lazy `getPdfLib()`
5. Add the tool's UI case in the `execute()` switch statement
6. Add tool-specific options UI in the tool view JSX
7. Add metadata in `app/[tool]/page.tsx`
8. Update the contextual related tools map

## Pull Request Process

1. Fork the repo and create a feature branch (`git checkout -b feat/my-feature`)
2. Make your changes following the principles above
3. Ensure `npm run build` passes with no errors
4. Write a clear PR description explaining what and why
5. Submit the PR — we'll review it promptly

## Reporting Issues

- Use [GitHub Issues](https://github.com/concrete-sangminlee/pdfremover/issues)
- Include: browser, OS, steps to reproduce, expected vs actual behavior
- For PDF-related bugs, describe the PDF characteristics (encrypted, large, etc.)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
