# shadcn/ui Blocks & Component Patterns

> Companion to `default-tokens.md`. That file covers tokens and variant classes.
> This file covers what shadcn ships as installable blocks, what compositions exist,
> and what gaps require custom work. Use this before building any page or layout.
> Source: ui.shadcn.com/blocks, ui.shadcn.com/r/ registry API
>
> **Building the same layouts in Figma:** Use `figma-component-reference.md` for per-component frame structure and `knowledge/figma/canvas-building.md` for auto-layout build order; blocks here describe **composition** you still recreate as nested frames/instances.

---

## 1. Installable Blocks — Don't Rebuild These

shadcn ships complete, installable page blocks via `npx shadcn add <block-name>`.
**Always check if a block exists before building from scratch.**

### Sidebar Blocks (16 variants)

| Block | Description | Key patterns |
|-------|-------------|-------------|
| `sidebar-01` | Simple sidebar, navigation grouped by section | SidebarGroup, SidebarMenuItem |
| `sidebar-02` | Collapsible sections | Collapsible + SidebarGroup |
| `sidebar-03` | Submenus | SidebarMenuSub, nested nav |
| `sidebar-04` | Floating sidebar with submenus | Floating position variant |
| `sidebar-05` | Collapsible submenus | Collapsible + SidebarMenuSub |
| `sidebar-06` | Submenus as dropdowns | DropdownMenu inside sidebar |
| `sidebar-07` | Collapses to icons | Icon-only collapsed state |
| `sidebar-08` | Inset with secondary nav | Two-level navigation |
| `sidebar-09` | Collapsible nested sidebars | Sidebar within sidebar |
| `sidebar-10` | Sidebar in a popover | Popover trigger |
| `sidebar-11` | Collapsible file tree | Tree view pattern |
| `sidebar-12` | Sidebar with calendar | Calendar integration |
| `sidebar-13` | Sidebar in a dialog | Dialog wrapper |
| `sidebar-14` | Sidebar on the right | Right-aligned variant |
| `sidebar-15` | Left and right sidebars | Dual sidebar layout |
| `sidebar-16` | Sticky site header | Fixed header + sidebar |

### Authentication Blocks (10 variants)

| Block | Description |
|-------|-------------|
| `login-01` | Simple login form (card) |
| `login-02` | Two column with cover image |
| `login-03` | Muted background color |
| `login-04` | Form and image split |
| `login-05` | Email-only login |
| `signup-01` | Simple signup form |
| `signup-02` | Two column with cover image |
| `signup-03` | Muted background |
| `signup-04` | Form and image split |
| `signup-05` | Social providers |

### Dashboard Block

| Block | Description | Components |
|-------|-------------|------------|
| `dashboard-01` | Full app: sidebar + charts + data table | 11 files, 807-line data-table with sorting/filtering/column-toggle |

Components included: sidebar, breadcrumb, separator, chart, card, select, tabs, table, toggle-group, badge, button, checkbox, dropdown-menu, drawer, input, avatar, sheet, sonner

### Calendar Blocks (10 variants)

| Block | Description |
|-------|-------------|
| `calendar-01` | Simple single calendar |
| `calendar-02` | Multiple months, single selection |
| `calendar-03` | Multiple months, multiple selection |
| `calendar-04` | Single month, range selection |
| `calendar-05` | Multiple months, range selection |
| `calendar-06` | Range with minimum days |
| `calendar-07` | Range with min and max days |
| `calendar-08` | Disabled days |
| `calendar-09` | Disabled weekends |
| `calendar-10` | Today button |

### How to install

```bash
npx shadcn add sidebar-07      # single block
npx shadcn add dashboard-01    # full dashboard with all deps
npx shadcn add login-01        # auth page
```

The CLI pulls all component dependencies automatically.

---

## 2. Dashboard Data Table Pattern

The `dashboard-01` block includes an 807-line data-table component. This is the reference implementation for shadcn tables. Key patterns:

### Table structure
```
DataTable
├── Toolbar (filters, search, view options)
│   ├── Input (search/filter)
│   ├── Faceted filters (badges)
│   └── ViewOptions (column toggle dropdown)
├── Table
│   ├── TableHeader
│   │   └── TableHead × N (sortable, with sort icons)
│   ├── TableBody
│   │   └── TableRow × N
│   │       └── TableCell × N (various content types)
│   └── TableFooter (optional)
└── Pagination
    ├── Selected count
    ├── Rows per page (Select)
    └── Page navigation (prev/next with page count)
```

### Column features
- **Sortable headers**: Click to toggle asc/desc, sort icon indicates direction
- **Selectable rows**: Checkbox in first column, `data-[state=selected]` styling
- **Column visibility**: Toggle dropdown to show/hide columns
- **Faceted filters**: Badge-based multi-select filtering

---

## 3. Table Cell Compositions — Custom Work Required

These cell types are common in production tables but NOT in the shadcn registry. Build them as compositions of shadcn primitives.

### Avatar Cell
```jsx
<TableCell>
  <div className="flex items-center gap-2">
    <Avatar className="size-8">
      <AvatarImage src={row.avatar} />
      <AvatarFallback>{row.initials}</AvatarFallback>
    </Avatar>
    <div>
      <p className="text-sm font-medium">{row.name}</p>
      <p className="text-xs text-muted-foreground">{row.email}</p>
    </div>
  </div>
</TableCell>
```

### Badge Cell
```jsx
<TableCell>
  <Badge variant={row.status === "active" ? "default" : "secondary"}>
    {row.status}
  </Badge>
</TableCell>
```

### Status Dot Cell
```jsx
<TableCell>
  <div className="flex items-center gap-2">
    <div className={cn("size-2 rounded-full", row.active ? "bg-chart-1" : "bg-destructive")} />
    <span className={row.active ? "text-muted-foreground" : "text-destructive"}>
      {row.statusLabel}
    </span>
  </div>
</TableCell>
```
Note: Use `bg-chart-1` for active dots (accessible on dark bg), NOT `bg-primary`.

### Progress Cell
```jsx
<TableCell>
  <div className="flex items-center gap-2">
    <Progress value={row.progress} className="h-2 w-16" />
    <span className="text-xs font-mono text-muted-foreground">{row.progress}%</span>
  </div>
</TableCell>
```

### Action Cell (dropdown)
```jsx
<TableCell className="w-[52px] text-right">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.name}`}>
        <MoreVertical aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem>Edit</DropdownMenuItem>
      <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</TableCell>
```

### Toggle Cell
```jsx
<TableCell>
  <Switch checked={row.enabled} onCheckedChange={(v) => handleToggle(row.id, v)} />
</TableCell>
```

### Input Cell (inline edit)
```jsx
<TableCell>
  <Input defaultValue={row.value} className="h-8 w-20" onBlur={(e) => handleUpdate(row.id, e.target.value)} />
</TableCell>
```

### Image Cell
```jsx
<TableCell>
  <img src={row.image} alt={row.name} className="size-10 rounded-md object-cover" />
</TableCell>
```

---

## 4. Loading Button Pattern — Custom Work Required

Not a CSS pseudo-class. Requires adding a spinner component.

```jsx
<Button disabled>
  <Loader2 className="animate-spin" />
  Loading...
</Button>
```

Pattern: `disabled` + spinner icon with `animate-spin` + optional text change. The button's `disabled:opacity-50 disabled:pointer-events-none` handles the visual dimming.

For icon-only loading:
```jsx
<Button size="icon" disabled>
  <Loader2 className="animate-spin" />
</Button>
```

---

## 5. Input States Reference

All states are CSS-driven from the base Input classes. Document for design reference:

| State | How it triggers | Visual treatment |
|-------|----------------|-----------------|
| **Default** | Initial render | `border-input bg-transparent` (light), `dark:bg-input/30` (dark) |
| **Focus** | `:focus-visible` | `border-ring ring-[3px] ring-ring/50` |
| **Filled** | Has value (no special CSS) | Same as default — text appears |
| **Disabled** | `disabled` attribute | `opacity-50 pointer-events-none cursor-not-allowed` |
| **Error** | `aria-invalid="true"` | `border-destructive ring-destructive/20` (light), `dark:ring-destructive/40` (dark) |
| **Error + Focus** | `aria-invalid` + `:focus-visible` | `border-destructive ring-[3px] ring-destructive/20` |
| **Placeholder** | No value | `text-muted-foreground` |

---

## 6. Custom Badge Variants — Common Additions

The registry ships: default, secondary, destructive, outline, ghost, link.

Teams commonly add:

### Verified Badge
```jsx
// Add to badgeVariants in badge.tsx
verified: "bg-chart-1/10 text-chart-1 dark:bg-chart-1/20"
```
Usage: trust indicators, verified accounts, confirmed status.

### Numbered Badge
```jsx
<Badge variant="destructive" className="size-5 justify-center rounded-full p-0 text-[10px]">
  {count}
</Badge>
```
Usage: notification counts, unread indicators. Fixed size, circular.

### Warning Badge
```jsx
// Add to badgeVariants
warning: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
```
Usage: expiring items, approaching limits, caution states.

### Success Badge
```jsx
// Add to badgeVariants
success: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
```
Usage: completed, active, healthy status.

---

## 7. Dialog Patterns

### Confirmation Dialog (destructive action)
```
DialogContent (sm:max-w-md)
├── DialogHeader
│   ├── DialogTitle (with AlertTriangle icon for destructive)
│   └── DialogDescription
├── Warning box (border-destructive/20 bg-destructive/5)
│   └── Warning text (text-destructive)
└── DialogFooter
    ├── Button variant="outline" (Cancel)
    └── Button variant="destructive" (Confirm)
```

### Form Dialog (create/edit)
```
DialogContent (sm:max-w-md)
├── DialogHeader
│   ├── DialogTitle
│   └── DialogDescription
├── Form fields (flex flex-col gap-4 py-4)
│   └── Field (Label + Input)
└── DialogFooter
    ├── Button variant="outline" (Cancel)
    └── Button (Submit — disabled when invalid)
```

### Reveal Dialog (show-once secret)
```
DialogContent (sm:max-w-md)
├── DialogHeader
│   ├── DialogTitle
│   └── DialogDescription
├── Content section (flex flex-col gap-4 py-4)
│   ├── Display area (border bg-muted + code text + copy button)
│   └── Helper text (text-xs text-muted-foreground)
└── DialogFooter
    └── Button (Copy & Close — primary action copies before closing)
```

---

## 8. Page Layout Patterns

### Dashboard Layout
```
Page (bg-background)
├── Sidebar (transparent, inherits bg-background)
│   ├── Logo + brand
│   ├── Nav groups (collapsible)
│   ├── Settings section
│   └── User profile (bottom)
└── Main (bg-card, rounded-lg, border — floating panel)
    ├── Header (title + primary action)
    ├── Separator
    └── Content (overflow-auto, p-6)
        ├── KPI cards (grid 1→2→4 columns)
        └── Data table card (py-0 gap-0)
            ├── Title bar (p-4)
            ├── Separator
            ├── Table (bg-muted header)
            ├── Separator
            └── Pagination (px-4 py-4)
```

### Auth Layout
```
Page (flex min-h-screen)
├── Form side (flex-1, centered content)
│   └── Card (max-w-md)
│       ├── CardHeader (title + description)
│       ├── CardContent (form fields)
│       └── CardFooter (submit + links)
└── Image side (hidden lg:flex, flex-1)
    └── Cover image (object-cover)
```

---

## 9. When to Load This File

| Situation | Action |
|-----------|--------|
| About to build a page layout | Check section 1 — does a block already exist? |
| Building a data table | Check section 3 for cell composition patterns |
| Adding loading state to a button | Check section 4 |
| Need a confirmation/form/reveal dialog | Check section 7 for the exact pattern |
| Adding custom badge variants | Check section 6 |
| Planning page structure | Check section 8 for layout patterns |

**Rule: Always check if shadcn ships it before building from scratch.**
Install with `npx shadcn add <block-name>` — it pulls all dependencies automatically.

---

## Sources

- [shadcn/ui Blocks](https://ui.shadcn.com/blocks) — installable page blocks
- [shadcn/ui Registry API](https://ui.shadcn.com/r/) — component and block source files
- [dashboard-01 source](https://ui.shadcn.com/r/styles/new-york-v4/dashboard-01.json) — reference data table implementation
