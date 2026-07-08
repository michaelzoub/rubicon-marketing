---
name: frontend-visualize
version: 1.0.0
description: |
  Visualize and test frontend updates for the Rubicon marketing site.
  Use when the user wants to:
  - See what a page looks like after code changes
  - Verify layout, spacing, alignment, or styling fixes
  - Screenshot pages for visual QA
  - Check computed CSS styles for layout debugging
  - Compare before/after frontend changes
  This skill drives the browser via agent-browser and inspects the DOM
  to catch layout regressions.
---

# Frontend visualize

Visualize and test frontend changes on the Rubicon marketing Next.js app.

## Prerequisites

1. **Dev server running on port 3000.** Check with:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 3
   ```
   If not 200, start it:
   ```bash
   cd /Users/michaelzoubkoff/Documents/rubicon-marketing && npx next dev --port 3000 &
   ```
   Wait for it to be ready before proceeding. If port 3000 is in use by a stale `next-server` (production build), kill it first and start a dev server so CSS hot-reloads.

2. **agent-browser available.** If `FACTORY_DESKTOP_CDP_PORT` and `AGENT_BROWSER_CDP` env vars are set, use the embedded browser pane:
   ```bash
   agent-browser --cdp "$AGENT_BROWSER_CDP" open <url>
   ```
   Otherwise use headless:
   ```bash
   agent-browser open <url>
   ```

## Workflow

### 1. Open the page

```bash
agent-browser --cdp "$AGENT_BROWSER_CDP" open http://localhost:3000<page>
agent-browser --cdp "$AGENT_BROWSER_CDP" wait --load networkidle
```

### 2. Screenshot

```bash
agent-browser --cdp "$AGENT_BROWSER_CDP" screenshot /tmp/<page-name>.png
```

Then read the screenshot with the Read tool to view it.

### 3. Inspect computed styles

For layout debugging, use `eval --stdin` to check computed styles:

```bash
cat <<'EOF' | agent-browser --cdp "$AGENT_BROWSER_CDP" eval --stdin
(() => {
  const el = document.querySelector('<selector>');
  if (!el) return 'NOT FOUND';
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return JSON.stringify({
    width: cs.width,
    maxWidth: cs.maxWidth,
    margin: { left: cs.marginLeft, right: cs.marginRight },
    padding: { left: cs.paddingLeft, right: cs.paddingRight },
    display: cs.display,
    rect: { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) }
  }, null, 2);
})();
EOF
```

### 4. Check for common layout issues

- **Content stuck to left edge:** Check if `.container` has `margin-inline: auto` applied. If `marginLeft` and `marginRight` are both `0px`, the CSS isn't loading (stale build, missing import, or CSS file 404).
- **CSS not loading:** Fetch the compiled CSS URL from the `<link>` tag and `curl` it. If it returns "Not Found", the dev server needs restarting.
- **Override not working:** Check CSS specificity. If two rules have the same specificity, the later one in the file wins. Use a more specific selector (e.g., `.landing-page.faq-page .landing-faq` instead of `.faq-page .landing-faq`).
- **Elements not found:** The page may still be compiling. Wait and re-open the URL.

### 5. Verify fixes

After making CSS/code changes:
1. Re-open the page (don't use `reload` with CDP, use `open` with the same URL)
2. Wait for network idle
3. Screenshot again
4. Check computed styles to confirm the fix took effect

## Key pages

| Page | URL | Key selectors |
|------|-----|---------------|
| Home | `/` | `.landing-hero`, `.landing-product-section`, `.landing-faq` |
| FAQ | `/faq` | `.faq-page-header`, `.faq-page-title`, `.landing-faq-groups` |
| Developers | `/developers` | `.landing-*` sections |

## What not to do

- Don't use `agent-browser reload` with CDP -- it can reload the entire desktop app. Use `open <same-url>` instead.
- Don't use `agent-browser close` with CDP -- the pane is owned by the Factory desktop app.
- Don't start multiple dev servers on the same port. Kill stale ones first.
- Don't trust production `next-server` builds for visual testing -- they don't hot-reload CSS. Always use `next dev`.
