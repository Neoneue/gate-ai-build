# URL mode extraction protocol

Use when the user provides a public URL (no auth wall).

## 1. Fetch the page

`WebFetch` the URL. Read the returned HTML. A prompt to WebFetch can steer what to extract (e.g., "return all `<link rel=stylesheet>` hrefs, all inline `<style>` blocks, and the full class attribute of the first 5 buttons, inputs, and cards").

## 2. Find linked stylesheets

In the HTML, look for:

```html
<link rel="stylesheet" href="..."/>
<style>...</style>
<script type="module" src="..."/>   <!-- Next.js / Vite often inline CSS via JS -->
```

Fetch each stylesheet URL (WebFetch again). Keep the full CSS text in your scratch space for this session.

## 3. Detect the framework

Scan HTML and CSS for visual / structural tells. See [framework-fingerprints.md](framework-fingerprints.md). The framework tells you which token conventions are likely in play — shadcn uses `--primary` and `--foreground`, MUI uses emotion hashes with a theme object, Ant uses `--ant-color-primary`, etc.

## 4. Extract tokens

### CSS custom properties

Look for `:root { --primary: ...; --background: ...; --radius: ...; }` or a theme class scope like `.dark { --background: ...; }`. These are the semantic tokens — map them directly to template sections 2 (color) and 5 (radius / spacing) and 6 (elevation).

### Tailwind classes

If you see `bg-primary`, `text-[14px]`, `rounded-lg`:

- **Literal arbitrary values** (`bg-[#8674FB]`) — take as-is
- **Semantic** (`bg-primary`) — trace back to `--primary` in the CSS
- **Default-scale** (`text-xl`, `rounded-lg`, `p-6`) — resolve against Tailwind's default scale (document defaults if no `tailwind.config` override is visible)

### Inline styles

Less common in modern apps. Parse directly from the `style="..."` attribute.

### Styled-components / CSS-in-JS

Class names are hashed (`.sc-a1b2c3`, `.css-1a2b3c4`). Match the hash to its definition in the served CSS. Not all CSS-in-JS libraries expose this cleanly — if the mapping is obscured, fall back to screenshot mode.

## 5. Sample representative components

For each canonical component (button, input, card, nav, heading, modal if present):

1. Find a DOM example in the HTML (`<button>`, `role="button"`, a known component class)
2. Read its classes / inline styles
3. Resolve those to actual CSS values from the fetched stylesheets
4. Record: element selector → property → value → source file:line

## 6. Citation format

- `#8674FB ← globals.css:42 --primary`
- `10px ← .auth-card { border-radius } in styles.css:1089`
- `40px ← Tailwind default — h-10 utility`
- `0 1px 2px rgba(0,0,0,0.05) ← .btn-primary { box-shadow } in app.css:317`

## 7. Where URL mode fails

| Symptom | Diagnosis | Action |
|---|---|---|
| WebFetch returns login / paywall page | Auth-walled content | Switch to screenshot mode; tell the user |
| CSS is hashed and inscrutable | Obfuscated CSS-in-JS build | Ask for DevTools paste on a few representative components |
| Heavy JS rehydration (React shell + almost no initial HTML) | SPA without SSR | WebFetch returns empty shell; switch to screenshot mode |
| Site blocks WebFetch user-agent | Anti-bot | Ask the user for a screenshot or a saved HTML dump |
| Framework fetches CSS dynamically via JS | Code-split CSS | What's in the initial HTML is incomplete; ask user for screenshots of other routes |

When URL mode is partially successful, combine modes: extract what WebFetch can give you, then ask the user to fill specific gaps via screenshot or DevTools paste.

## 8. Stop conditions

- Got CSS variables + enough component examples → fill the template
- Hit auth wall or heavy CSS obfuscation → tell user, ask for screenshots
- Framer / Webflow export with heavy inline styles → warn user that extraction will be approximate; ask whether they'd rather screenshot the live published view

## 9. Performance notes

- Don't WebFetch dozens of stylesheet URLs unthinkingly. Read the first 2–3 that look load-bearing (global / app-wide names like `globals.css`, `app.css`, `main.css`, or the largest bundle).
- If the site has a single giant bundled CSS file, one WebFetch usually suffices.
- If you've pulled 3 stylesheets and still don't have the tokens, pivot to screenshots — more fetches rarely help.
