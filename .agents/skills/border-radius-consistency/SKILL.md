---
name: border-radius-consistency
description: Enforces consistent border-radius usage across the dashboard UI. Use when adding or modifying any rounded container, card, row, or panel element. Prevents mixing rounded-md, rounded-lg, rounded-xl, and hardcoded pixel values within the same visual tier.
---

# Border Radius Consistency

This skill enforces a single border-radius convention per visual tier so that cards, rows, panels, and nested containers never show mismatched corners on the same page.

## Radius Token Map

The project defines CSS custom properties in `app/globals.css`:

| Token | Value | Use for |
|---|---|---|
| `--radius-xl` | 22px | Large page-level containers, modals |
| `--radius-lg` | 16px | Dialogs, large panels |
| `--radius-card` | 18px | Top-level dashboard cards (via `.dashboard-card`) |
| `--radius-ui` | 10px | Inner UI elements: rows, nested cards, input groups, list items |

## Rules

1. **Dashboard cards** already get `border-radius: 12px` from the `.dashboard-card` class. Do not override.

2. **Inner containers** (rows, list items, nested panels, info cards inside a dashboard card) must all share the same radius. Use `rounded-lg` (Tailwind 8px) as the default for these elements. Do not mix `rounded-md` (6px) and `rounded-lg` (8px) within the same parent card.

3. **Small inline elements** (pills, badges, buttons, inline code, tags) may use `rounded-md` or `rounded-full` — these are a different visual tier and are exempt.

4. **Never hardcode pixel values** like `rounded-[10px]`, `rounded-[14px]`, `rounded-[16px]` for inner containers. Use the Tailwind class or the CSS variable.

5. **When adding a new row or nested card**, check the sibling elements in the same parent and match their radius class.

## Audit Checklist

When reviewing or adding UI:

- [ ] All rows within the same list use the same `rounded-*` class
- [ ] All nested cards/panels within the same dashboard card use the same `rounded-*` class
- [ ] No mixing of `rounded-md` and `rounded-lg` at the container level within a single card
- [ ] Hardcoded `rounded-[Npx]` values are replaced with Tailwind classes or CSS variables

## Common Violations

| Violation | Fix |
|---|---|
| `rounded-md` on a nested card next to `rounded-lg` rows | Change to `rounded-lg` |
| `rounded-[10px]` on a container | Use `rounded-lg` or `rounded-[var(--radius-ui)]` |
| `py-4` on list rows when siblings use `py-2.5` | Match the sibling padding |
