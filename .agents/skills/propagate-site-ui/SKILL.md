---
name: propagate-site-ui
description: Apply styling, branding, layout, header, footer, navigation, typography, palette, component, and motion changes consistently across an entire website. Use whenever a user asks for a site-wide UI change, changes a shared visual rule, references the whole app or website, supplies a new design direction, or requests edits to shared chrome such as headers, footers, logos, navigation, colors, cards, buttons, or backgrounds.
---

# Propagate Site UI

Treat styling requests as system changes unless the user explicitly limits them to one route.

## Required workflow

1. Translate the request into explicit design rules before editing, such as “white is the primary surface,” “remove search,” or “header mark is a black circle.”
2. Inventory all user-facing routes and route groups. Start with framework route files, then identify shared layouts and components.
3. Search globally for every affected implementation:
   - shared headers, footers, navigation, logos, shells, and layouts
   - duplicated or route-specific variants
   - CSS variables, theme scopes, media-query overrides, and late cascade overrides
   - literal colors, assets, screenshots, and component-local styles
4. Prefer changing shared tokens and shared components. Patch route-specific exceptions only where they intentionally differ.
5. Re-run the global searches after editing. Do not assume the first matching component owns every surface.
6. Verify every affected route family, not only the route shown in the user’s screenshot.

## Scope rules

- “Website,” “app,” “everywhere,” or an unqualified visual direction means all public routes and authenticated product routes.
- Header changes require checking every route that renders a header or alternate header variant.
- Footer changes require checking every footer instance and color-scheme override.
- Palette changes require checking global tokens, scoped themes, hardcoded colors, charts, empty states, forms, previews, screenshots, and dark/light media queries.
- Logo or asset changes require checking direct image references, shared brand components, metadata icons, mobile chrome, and embedded previews.
- Dashboard changes require checking overview, articles, editor, earnings, settings, imports, dialogs, preview routes, and marketing screenshots of the dashboard.
- Landing changes require checking responsive breakpoints and any embedded product components.

## Route audit

Use `rg --files app` and derive routes from `page.*` and `layout.*` files. Record the affected route families before implementation. For this repository, always include at least:

- `/`
- `/creators`
- `/developers`
- `/agents`
- `/explore`
- `/docs`
- `/faq`
- `/dashboard` and all nested dashboard routes
- preview or recording routes that reuse production UI

If a route is intentionally excluded, state why.

## Verification gate

Do not report completion until all applicable checks pass:

1. Type-check or build the project with the repository’s non-interactive command.
2. Search for stale values and old asset references across the full app.
3. Render representative routes from every affected route family.
4. Check desktop and mobile for shared chrome changes.
5. Inspect the actual cascade at the end of global styles; late overrides must agree with the new rule.
6. When a screenshot asset represents live UI, regenerate it from the updated UI and verify the consuming page.

## Completion report

Name the route families verified and any intentionally retained exceptions. Never say “whole website” based on checking only one page.
