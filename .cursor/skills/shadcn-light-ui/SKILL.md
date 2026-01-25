---
name: shadcn-light-ui
description: Builds and refactors UI in this repo using shadcn-style Tailwind components (src/components/ui/*) with light-mode-only styling and lucide-react icons. Use when creating or updating pages/components, especially for forms and layouts.
---

# shadcn-style Light UI (repo-specific)

## Defaults

- **Light mode only**. Do not add `dark:` classes or dark-mode CSS.
- Use primitives from `src/components/ui/`:
  - `Button`, `Card`, `Input`, `Textarea`
- Use semantic color classes backed by CSS variables:
  - `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, `bg-accent`, etc.

## Patterns to follow

### Page shell

- Wrapper: `min-h-screen bg-background text-foreground`
- Use `Card` for primary sections and `shadow-sm` for elevation.

### Buttons

- Primary action: `<Button>…</Button>`
- Secondary: `<Button variant="secondary">…</Button>`
- Outline: `<Button variant="outline">…</Button>`
- Navigation links: `<Button asChild variant="outline"><Link …/></Button>`

### Forms

- Inputs should be `Input`/`Textarea` with clear placeholders.
- Errors: use `text-destructive`.
- Helper text: use `text-muted-foreground`.

## Validation checklist

- [ ] No `dark:` usage anywhere in `src/`
- [ ] Uses `src/components/ui/*` instead of large bespoke class strings
- [ ] Layout stays consistent with existing pages (`/login`, `/onboarding`)

