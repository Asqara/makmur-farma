# DESIGN.md

Design system and interface rules for **Makmur Farma**.

Read this file before making any UI, UX, layout, responsive, component, chart, form, or copywriting change.

This document is the visual source of truth for the project. When the existing implementation differs from this document, inspect the surrounding code and update it carefully without introducing inconsistent one-off styles.

---

## 1. Project Design Identity

**Makmur Farma** is a web-based e-commerce and pharmacy management system for **Klinik Makmur Jaya**.

The interface serves two main environments:

1. **Operational application**
   - Used by Admin, Pharmacist, and Cashier.
   - Uses a dashboard shell with a fixed sidebar and topbar.
   - Optimized for data, transactions, monitoring, prescription review, and stock operations.

2. **Customer application**
   - Used by patients and customers.
   - Uses a storefront layout without the operational sidebar.
   - Shares the same colors, typography, components, and interaction principles.

The attached dashboard reference is the primary visual direction for the operational application.

The design must feel:

- Clean.
- Calm.
- Professional.
- Modern.
- Light.
- Data-focused.
- Trustworthy.
- Easy to scan.
- Comfortable for long operational use.
- Appropriate for pharmacy and healthcare commerce.
- Not visually heavy.
- Not playful.
- Not sterile like a hospital administration form.
- Not crowded like a legacy enterprise application.

---

## 2. Design Goal

The interface should help users answer important questions quickly.

Operational users should be able to identify:

1. How many orders are waiting or being processed?
2. Which prescriptions need review?
3. Which medicines are low in stock?
4. Which medicine batches are near expiry?
5. What is today's sales value?
6. Which payments are pending or failed?
7. Which orders are ready for pickup or delivery?
8. What changes were made and by whom?
9. Is the application, database, Redis, and worker healthy?
10. What action should be taken next?

Customers should be able to identify:

1. Which medicines are available?
2. Whether a medicine requires a prescription.
3. How to upload a prescription.
4. How much an order costs.
5. What the current order status is.
6. Whether the order is ready for pickup or delivery.
7. What to do when payment or prescription verification fails.

If information is visible but the next action is unclear, the design is incomplete.

---

## 3. Primary Visual Direction

The operational application follows a modern light analytics dashboard style.

The dominant visual characteristics are:

- White fixed sidebar.
- Light gray-lilac application background.
- White cards.
- Thin neutral borders.
- Soft and restrained shadow.
- Bright blue primary accent.
- Pale blue active navigation state.
- Dark navy text.
- Muted gray metadata.
- Orange used only as a supporting chart accent or warning.
- Compact line icons.
- Generous horizontal alignment.
- Tight but readable vertical rhythm.
- Card grids that feel connected but not crowded.
- Small corner radius, not overly rounded.
- Minimal decoration.

The layout should resemble a professional analytics workspace, adapted for pharmacy operations.

Do not reproduce the reference image literally. Reuse its visual principles and adapt them to Makmur Farma's domain.

---

## 4. Non-Negotiable Visual Rules

Always:

- Use a light operational dashboard.
- Use a white sidebar.
- Use a subtle gray-lilac page background.
- Use blue as the primary interactive color.
- Use pale blue for active navigation.
- Use white cards with subtle borders.
- Use thin line icons.
- Use consistent spacing.
- Use consistent card headers.
- Keep status colors meaningful.
- Keep charts visually restrained.
- Use Bahasa Indonesia for the UI.
- Keep the interface responsive.
- Show loading, empty, error, and permission states.
- Use permission-aware navigation.

Never:

- Add a search field to the operational topbar.
- Use a dark sidebar as the default.
- Use glassmorphism.
- Use neon colors.
- Use large gradients.
- Use heavy shadows.
- Use oversized rounded cards.
- Use random colors for each card.
- Use decorative illustrations inside data-heavy operational pages.
- Put all modules on one screen.
- Use color as the only status indicator.
- hide critical warnings inside a generic notification list.
- Show actions the current user cannot perform.
- Create a different visual language for each module.
- Use a marketing landing-page style inside the dashboard.

---

## 5. Brand and Naming

Use these names consistently:

```text
Product name: Makmur Farma
Organization: Klinik Makmur Jaya
Full name: Makmur Farma — Sistem E-Commerce dan Manajemen Farmasi Klinik Makmur Jaya
```

Recommended operational page title format:

```text
Dashboard | Makmur Farma
Pesanan | Makmur Farma
Verifikasi Resep | Makmur Farma
Stok Obat | Makmur Farma
Laporan | Makmur Farma
```

Recommended customer page title format:

```text
Belanja Obat | Makmur Farma
Detail Obat | Makmur Farma
Keranjang | Makmur Farma
Pesanan Saya | Makmur Farma
```

---

## 6. Logo

Use logo assets from `@public/` when available.

Recommended assets:

```text
/public/logo.svg
/public/logomark.svg
/public/favicon.png
```

Rules:

- Use the full logo in the expanded desktop sidebar.
- Use the logomark in the collapsed sidebar.
- Use the full logo or wordmark on authentication pages.
- Do not stretch or recolor the official logo.
- Do not add glow or shadow to the logo.
- Do not place the logo on a noisy background.
- Keep at least 16px of clear space around the logo.
- Full logo recommended height: 28px to 32px.
- Logomark recommended size: 28px to 32px.
- Always provide meaningful alternative text.

When no final asset exists, use a temporary text wordmark:

```text
Makmur Farma
```

Temporary wordmark style:

- Font weight: 700.
- Font size: 18px.
- Letter spacing: -0.02em.
- Text color: strong navy.
- Optional blue logomark placeholder.
- No decorative medical cross unless it is part of the approved logo.

---

## 7. Color System

The palette is inspired by the attached analytics dashboard reference.

Use CSS variables or Tailwind semantic tokens. Avoid hardcoding the same color repeatedly inside components.

### 7.1 Core Brand Colors

```text
Primary Blue:          #3366FF
Primary Blue Hover:    #2855D9
Primary Blue Pressed:  #2047BD
Primary Blue Soft:     #EAF0FF
Primary Blue Subtle:   #F3F6FF
Primary Blue Border:   #C9D6FF
Primary Blue Ring:     #9DB6FF
```

Use Primary Blue for:

- Primary buttons.
- Active navigation text.
- Active navigation icon.
- Links.
- Selected tabs.
- Selected filters.
- Chart primary series.
- Focus rings.
- Pagination active state.
- Progress indicators.
- Interactive calendar selection.

Do not use blue for every number or heading.

### 7.2 Supporting Accent

```text
Accent Orange:         #FF8A00
Accent Orange Hover:   #E87900
Accent Orange Soft:    #FFF3E0
Accent Orange Border:  #FFD49A
```

Use orange for:

- Secondary chart comparison.
- Expiry warning.
- Pending operational attention.
- A highlighted category in a chart.

Orange is not a second primary button color.

### 7.3 Application Surfaces

```text
App Background:        #F4F5FA
Sidebar Surface:       #FFFFFF
Topbar Surface:        #FFFFFF
Card Surface:          #FFFFFF
Elevated Surface:      #FFFFFF
Muted Surface:         #F8F9FC
Subtle Surface:        #F1F3F8
Selected Surface:      #EAF0FF
Hover Surface:         #F6F8FD
Overlay:               rgba(15, 23, 42, 0.40)
```

Use App Background for the operational content canvas.

Use white for the sidebar, topbar, cards, popovers, dialogs, and drawers.

Do not use pure gray `#F5F5F5` when the defined application background is available.

### 7.4 Text Colors

```text
Text Strong:           #171C2C
Text Default:          #3F4759
Text Secondary:        #687084
Text Muted:            #8A92A6
Text Disabled:         #AEB4C3
Text Inverse:          #FFFFFF
Text Link:             #3366FF
```

Use Text Strong for:

- Page titles.
- Main metrics.
- Primary table values.
- Card headings.
- Important form values.

Use Text Default for:

- Body text.
- Navigation labels.
- Table text.
- Form labels.

Use Text Secondary or Muted for:

- Descriptions.
- Dates.
- Helper text.
- Metadata.
- Empty-state explanations.

Do not use disabled text color for information that users still need to read.

### 7.5 Borders and Dividers

```text
Border Default:        #E7E9F1
Border Strong:         #D7DBE7
Border Interactive:    #C9D6FF
Divider:               #ECEEF4
```

Use thin borders.

Recommended default:

```text
1px solid Border Default
```

Prefer borders and surface contrast over strong shadows.

### 7.6 Semantic Colors

```text
Success:               #16A66A
Success Hover:         #128457
Success Soft:          #E8F8F0
Success Border:        #A9E2C7

Warning:               #F59E0B
Warning Hover:         #D88705
Warning Soft:          #FFF6DF
Warning Border:        #F6D58A

Danger:                #E5484D
Danger Hover:           #C93B40
Danger Soft:           #FDEBEC
Danger Border:         #F3B7BA

Info:                  #3B82F6
Info Hover:            #2868CC
Info Soft:             #EAF2FF
Info Border:           #B8D1FF

Neutral:               #687084
Neutral Soft:          #F1F3F8
Neutral Border:        #D7DBE7
```

Semantic colors communicate meaning. They are not decorative.

---

## 8. CSS Token Recommendation

Use semantic variables similar to the following.

```css
:root {
  --mf-background: #f4f5fa;
  --mf-sidebar: #ffffff;
  --mf-topbar: #ffffff;
  --mf-card: #ffffff;
  --mf-surface-muted: #f8f9fc;
  --mf-surface-subtle: #f1f3f8;
  --mf-surface-selected: #eaf0ff;
  --mf-surface-hover: #f6f8fd;

  --mf-primary: #3366ff;
  --mf-primary-hover: #2855d9;
  --mf-primary-pressed: #2047bd;
  --mf-primary-soft: #eaf0ff;
  --mf-primary-subtle: #f3f6ff;
  --mf-primary-border: #c9d6ff;
  --mf-primary-ring: #9db6ff;

  --mf-accent: #ff8a00;
  --mf-accent-soft: #fff3e0;

  --mf-text-strong: #171c2c;
  --mf-text-default: #3f4759;
  --mf-text-secondary: #687084;
  --mf-text-muted: #8a92a6;
  --mf-text-disabled: #aeb4c3;
  --mf-text-inverse: #ffffff;

  --mf-border: #e7e9f1;
  --mf-border-strong: #d7dbe7;
  --mf-divider: #eceef4;

  --mf-success: #16a66a;
  --mf-success-soft: #e8f8f0;
  --mf-warning: #f59e0b;
  --mf-warning-soft: #fff6df;
  --mf-danger: #e5484d;
  --mf-danger-soft: #fdebec;
  --mf-info: #3b82f6;
  --mf-info-soft: #eaf2ff;

  --mf-radius-sm: 6px;
  --mf-radius-md: 8px;
  --mf-radius-lg: 10px;
  --mf-radius-xl: 12px;

  --mf-shadow-card:
    0 1px 2px rgba(23, 28, 44, 0.03),
    0 4px 14px rgba(23, 28, 44, 0.035);

  --mf-shadow-floating:
    0 8px 24px rgba(23, 28, 44, 0.10);

  --mf-sidebar-expanded: 240px;
  --mf-sidebar-collapsed: 72px;
  --mf-topbar-height: 68px;
}
```

Use the project's existing token naming when it already has an established convention. Do not maintain two parallel token systems.

---

## 9. Color Usage by Domain Status

### 9.1 Stock Status

**Tersedia**

```text
Text:       Success
Background: Success Soft
Icon:       Success
```

**Stok Rendah**

```text
Text:       Warning
Background: Warning Soft
Icon:       Warning
```

**Stok Kritis**

```text
Text:       Danger
Background: Danger Soft
Icon:       Danger
```

**Habis**

```text
Text:       Danger
Background: Danger Soft
Border:     Danger Border
```

**Diblokir**

```text
Text:       Neutral
Background: Neutral Soft
```

### 9.2 Expiry Status

**Aman**

```text
Text:       Success
Background: Success Soft
```

**Mendekati Kedaluwarsa**

```text
Text:       Warning
Background: Warning Soft
```

**Segera Kedaluwarsa**

```text
Text:       Danger
Background: Danger Soft
```

**Kedaluwarsa**

```text
Text:       Danger
Background: Danger Soft
Icon:       AlertTriangle
```

### 9.3 Prescription Status

**Menunggu Verifikasi**

```text
Text:       Warning
Background: Warning Soft
```

**Sedang Ditinjau**

```text
Text:       Info
Background: Info Soft
```

**Disetujui**

```text
Text:       Success
Background: Success Soft
```

**Ditolak**

```text
Text:       Danger
Background: Danger Soft
```

**Perlu Perbaikan**

```text
Text:       Accent Orange
Background: Accent Orange Soft
```

### 9.4 Order Status

**Draf**

```text
Text:       Neutral
Background: Neutral Soft
```

**Menunggu Resep**

```text
Text:       Warning
Background: Warning Soft
```

**Menunggu Pembayaran**

```text
Text:       Warning
Background: Warning Soft
```

**Dibayar**

```text
Text:       Info
Background: Info Soft
```

**Diproses**

```text
Text:       Primary Blue
Background: Primary Blue Soft
```

**Siap Diambil**

```text
Text:       Success
Background: Success Soft
```

**Dikirim**

```text
Text:       Info
Background: Info Soft
```

**Selesai**

```text
Text:       Success
Background: Success Soft
```

**Dibatalkan**

```text
Text:       Neutral
Background: Neutral Soft
```

**Gagal**

```text
Text:       Danger
Background: Danger Soft
```

**Dikembalikan**

```text
Text:       Neutral
Background: Neutral Soft
```

### 9.5 Payment Status

**Menunggu**

```text
Text:       Warning
Background: Warning Soft
```

**Berhasil**

```text
Text:       Success
Background: Success Soft
```

**Gagal**

```text
Text:       Danger
Background: Danger Soft
```

**Kedaluwarsa**

```text
Text:       Neutral
Background: Neutral Soft
```

**Dikembalikan**

```text
Text:       Info
Background: Info Soft
```

### 9.6 System Health

**Sehat**

```text
Text:       Success
Background: Success Soft
```

**Menurun**

```text
Text:       Warning
Background: Warning Soft
```

**Bermasalah**

```text
Text:       Danger
Background: Danger Soft
```

**Tidak Diketahui**

```text
Text:       Neutral
Background: Neutral Soft
```

---

## 10. Typography

Use one primary sans-serif family throughout the application.

Recommended:

```text
Primary: Inter
Fallback: ui-sans-serif, system-ui, sans-serif
Mono: JetBrains Mono
```

Alternative only when already configured:

```text
Plus Jakarta Sans
```

Do not use both Inter and Plus Jakarta Sans in the same application.

### 10.1 Font Roles

Primary font:

- Navigation.
- Buttons.
- Forms.
- Tables.
- Cards.
- Page titles.
- Dialogs.
- Customer storefront.
- Reports interface.

Monospace font:

- Order IDs.
- Transaction IDs.
- Batch numbers.
- Prescription IDs.
- Payment references.
- Job IDs.
- API latency.
- Error codes.
- Log timestamps when appropriate.

Do not use monospace for general body copy.

### 10.2 Type Scale

```text
Display Metric:  36px / 42px / 700
Page Title:      28px / 36px / 700
Section Title:   22px / 30px / 700
Panel Title:     18px / 26px / 600
Card Title:      15px / 22px / 600
Body Large:      16px / 24px / 400
Body:            14px / 22px / 400
Body Small:      13px / 20px / 400
Label:           13px / 18px / 500
Metadata:        12px / 18px / 400
Micro Label:     10px / 14px / 600
```

### 10.3 Recommended Tailwind Mapping

Use the project's `ts-*` typography utility when available.

```text
ts-xs       12px
ts-sm       13px to 14px
ts-base     14px to 16px
ts-lg       18px
ts-xl       20px to 22px
ts-2xl      24px to 28px
ts-3xl      30px to 36px
```

### 10.4 Weight Usage

```text
400: body, descriptions, table cells
500: labels, navigation, button text, table headers
600: card title, section title, selected navigation
700: page title, major metric
```

Do not make every heading bold. Use spacing, size, and color hierarchy first.

### 10.5 Letter Spacing

Recommended:

```text
Page titles: -0.02em
Large metrics: -0.025em
Body: normal
Uppercase group labels: 0.08em
```

---

## 11. Spacing System

Use a 4px base unit.

Recommended scale:

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
```

### 11.1 Default Spacing

```text
Mobile page padding:        16px
Tablet page padding:        20px to 24px
Desktop page padding:       28px to 32px
Large desktop page padding: 32px to 36px
Card padding compact:       16px
Card padding default:       20px
Card padding spacious:      24px
Grid gap compact:           12px
Grid gap default:           16px
Grid gap large:             20px to 24px
Form field gap:             16px
Section vertical gap:       24px
Major section gap:          32px
```

### 11.2 Vertical Rhythm

A page should generally follow this rhythm:

```text
Topbar
24px to 28px
Page header
20px to 24px
Toolbar or summary cards
16px to 20px
Main content grid
24px to 32px
Next section
```

Do not use random vertical margins between adjacent sections.

---

## 12. Radius

The reference design uses restrained radius.

Use:

```text
6px:  small controls, icon buttons, small badges
8px:  buttons, inputs, selects, nav items, compact cards
10px: standard cards, tables, filter bars
12px: dialogs, large panels, authentication cards
999px: avatars, status dots, pills
```

Avoid:

- 20px or larger radius on operational cards.
- Fully rounded large buttons.
- Different radius for every component.

---

## 13. Elevation

Use shadows sparingly.

### 13.1 Card Shadow

```css
box-shadow:
  0 1px 2px rgba(23, 28, 44, 0.03),
  0 4px 14px rgba(23, 28, 44, 0.035);
```

### 13.2 Floating Shadow

Use for:

- Dropdown.
- Popover.
- Date picker.
- Command menu.
- Floating notification panel.

```css
box-shadow:
  0 8px 24px rgba(23, 28, 44, 0.10);
```

### 13.3 Dialog Shadow

```css
box-shadow:
  0 18px 50px rgba(23, 28, 44, 0.16);
```

Rules:

- Cards use borders first.
- Topbar uses a bottom border.
- Sidebar uses a right border.
- Do not use strong shadows around every panel.
- Avoid colored shadows.

---

## 14. Operational App Shell

The operational shell consists of:

1. Fixed sidebar.
2. Topbar.
3. Main content canvas.
4. Responsive mobile drawer.
5. Optional overlay panels such as notifications.

### 14.1 Desktop Shell

```text
Sidebar expanded:   240px
Sidebar collapsed:   72px
Topbar height:       68px
Content width:       Fluid
Content min width:   0
Page background:     App Background
```

Recommended structure:

```text
body
└── application shell
    ├── sidebar
    └── application body
        ├── topbar
        └── main content
```

Main content must not scroll horizontally because of the shell. Individual tables may scroll inside their own containers.

### 14.2 Large Desktop

For screens above 1440px:

- Keep the 240px sidebar.
- Keep the content fluid.
- Limit extremely wide form and detail content.
- Dashboard grids may use the full available width.
- Avoid stretching text-heavy cards beyond readable width.

### 14.3 Tablet

For screens between 768px and 1023px:

- Sidebar may use collapsed mode by default.
- Hover or click may reveal labels in a flyout.
- Main content padding becomes 20px to 24px.
- Dashboard grid reduces to two columns.
- Dense tables remain horizontally scrollable.

### 14.4 Mobile

For screens below 768px:

- Sidebar becomes a left drawer.
- Topbar height becomes 56px.
- Show a menu trigger on the left.
- Keep logo or compact page context in the topbar.
- Page content uses 16px padding.
- Cards stack vertically.
- Tables scroll horizontally or use a mobile list variant.
- Filters collapse into a sheet or drawer.
- User actions move into a menu.
- Do not use bottom navigation for operational roles unless explicitly approved.

---

## 15. Sidebar

The sidebar is the most important layout element and must closely follow the visual spirit of the reference.

### 15.1 Sidebar Appearance

Use:

- White background.
- Full viewport height.
- Thin right border.
- No heavy shadow.
- Logo at the top.
- Menu sections below.
- Optional account or support item near the bottom.
- Vertical scrolling only when required.
- Fixed position on desktop.
- Quiet visual hierarchy.

Do not use:

- Dark background.
- Large colored blocks.
- Gradient.
- Oversized icons.
- More than one active state.
- Deep nested navigation.

### 15.2 Sidebar Dimensions

```text
Expanded width:          240px
Collapsed width:          72px
Top brand area height:    68px
Horizontal padding:       14px
Navigation item height:   40px
Navigation item gap:       4px
Section gap:              20px
Icon size:                18px
Label size:               13px
Group label size:         10px
```

### 15.3 Brand Area

Expanded:

```text
[Menu or collapse icon] [Makmur Farma logo]
```

Collapsed:

```text
[Logomark]
```

Rules:

- The collapse control may be placed beside the logo or at the bottom.
- Keep the brand area aligned with topbar height.
- Do not use a large logo that dominates the sidebar.

### 15.4 Sidebar Group Labels

Use small uppercase labels.

Examples:

```text
UTAMA
PENJUALAN
FARMASI
PERSEDIAAN
LAPORAN
SISTEM
```

Style:

```text
Font size:      10px
Font weight:    600
Letter spacing: 0.08em
Color:          Text Muted
Horizontal pad: 10px
Bottom gap:      6px
```

Do not make section labels interactive.

### 15.5 Sidebar Navigation Item

Default state:

```text
Background: transparent
Text:       Text Default
Icon:       Text Secondary
Height:     40px
Radius:      8px
Padding:    10px 12px
Gap:         10px
```

Hover state:

```text
Background: Hover Surface
Text:       Text Strong
Icon:       Primary Blue
```

Active state:

```text
Background: Primary Blue Soft
Text:       Primary Blue
Icon:       Primary Blue
Font weight: 600
```

Focus state:

```text
Visible 2px focus ring
Ring color: Primary Blue Ring
```

Disabled state:

```text
Text: Text Disabled
No hover emphasis
Cursor: not-allowed
```

### 15.6 Sidebar Icon Rules

Recommended library:

```text
lucide-react
```

Rules:

- Use outline icons.
- Default size: 18px.
- Default stroke width: 1.75 or 2.
- Use one icon style across the app.
- Do not mix filled and outline icon families.
- Icons support labels, not replace them in expanded mode.
- In collapsed mode, every icon needs a tooltip.

### 15.7 Recommended Navigation

The exact menu is permission-aware.

```text
UTAMA
- Dashboard

PENJUALAN
- Pesanan
- Penjualan Kasir
- Pembayaran

FARMASI
- Obat
- Kategori Obat
- Resep
- Supplier

PERSEDIAAN
- Batch dan Stok
- Pergerakan Stok
- Penyesuaian Stok
- Kedaluwarsa

PELANGGAN
- Pelanggan

LAPORAN
- Laporan Penjualan
- Riwayat Laporan

SISTEM
- Notifikasi
- Audit Log
- Error Log
- Monitoring
- Pengguna
- Pengaturan
```

Do not show all items to all roles.

### 15.8 Role-Aware Sidebar

**Admin**

May see all permitted operational and system items.

**Pharmacist**

Prioritize:

```text
Dashboard
Pesanan
Resep
Obat
Batch dan Stok
Kedaluwarsa
Pergerakan Stok
Notifikasi
Laporan relevant to pharmacist
```

Do not show user management or sensitive system monitoring unless permitted.

**Cashier**

Prioritize:

```text
Dashboard
Penjualan Kasir
Pesanan
Pembayaran
Obat
Pelanggan
Notifikasi
Riwayat transaksi relevant to cashier
```

Do not show prescription approval unless separately permitted.

### 15.9 Nested Navigation

Prefer flat navigation grouped by labels.

Nested navigation is allowed only when:

- A group has at least two closely related pages.
- The parent remains understandable.
- Depth does not exceed two levels.

Nested item height:

```text
36px
```

Nested item indentation:

```text
36px to 40px from sidebar left edge
```

Avoid nested accordion navigation for every module.

### 15.10 Sidebar Footer

Optional items:

- Bantuan.
- Dokumentasi.
- Version label.
- Collapse control.

Do not put a large promotional card or calendar in the sidebar. The reference contains such a card, but it is not suitable for Makmur Farma's operational focus.

---

## 16. Topbar

The topbar is deliberately simple.

### 16.1 Required Topbar Content

Desktop:

```text
Left:
- Optional sidebar collapse trigger
- Optional breadcrumb or compact page context

Right:
- Notification icon
- Help icon when help content exists
- User account menu
```

Mobile:

```text
Left:
- Sidebar drawer trigger
- Compact logo or current page label

Right:
- Notification icon
- User avatar or account menu
```

### 16.2 Search Is Prohibited in the Topbar

Do not add:

- Global search field.
- Search shortcut.
- Command palette input.
- Keyword placeholder.

Search belongs inside the relevant page toolbar, such as:

- Obat.
- Pesanan.
- Pelanggan.
- Resep.
- Audit Log.
- Error Log.

This is intentional.

### 16.3 Topbar Appearance

```text
Height:          68px desktop
Height:          56px mobile
Background:      White
Border bottom:   Border Default
Horizontal pad:  20px to 28px desktop
Horizontal pad:  16px mobile
Position:        Sticky or fixed according to shell
Z-index:         Above main content
```

Do not use a strong shadow unless content scrolling causes separation issues.

### 16.4 Topbar Icon Buttons

Use for:

- Notifications.
- Help.
- More menu.
- Sidebar toggle.

Style:

```text
Size:        36px to 40px
Icon:        18px
Radius:       8px
Background:  transparent
Hover:       Hover Surface
Focus ring:  visible
```

Notification unread indicator:

```text
6px to 8px danger or primary dot
Placed at top-right of icon
```

Do not animate the dot continuously.

### 16.5 User Menu

The user trigger may contain:

```text
Avatar
Display name
Role label
Chevron
```

Desktop preferred width:

```text
Auto, maximum around 190px
```

Collapsed mobile trigger may show avatar only.

User menu content:

- Profile.
- Account settings.
- Session or device information when supported.
- Sign out.

Do not place unrelated system settings in the account menu.

---

## 17. Page Header

The page header sits inside the main content, below the topbar.

### 17.1 Structure

```text
Left:
- Page title
- Optional uppercase date, period, or short description

Right:
- Page-level actions
- Filter
- Date range
- Export
- Primary action
```

Example:

```text
Ringkasan Analitik
5 JUNI 2026 · DATA HARI INI
```

### 17.2 Page Header Styles

Page title:

```text
28px
700
Text Strong
Letter spacing -0.02em
```

Eyebrow or period:

```text
11px to 12px
500 or 600
Text Muted
Uppercase only when short
Letter spacing 0.04em
```

Page description:

```text
14px
Text Secondary
Maximum readable width around 720px
```

### 17.3 Page Header Actions

Use compact 40px controls.

Recommended order:

```text
Secondary controls
Date range
Primary action
```

Example:

```text
[Urutkan] [Filter] [1–30 Juni 2026] [Tambah Obat]
```

Do not place more than four high-visibility actions in the page header.

Move less important actions into a dropdown.

### 17.4 Responsive Page Header

Desktop:

- Title and actions on one row when space allows.
- Align actions to the top or baseline.

Mobile:

- Title first.
- Description below.
- Actions wrap below.
- Primary action may become full width.
- Filters may open a bottom sheet.

---

## 18. Main Content Layout

### 18.1 Content Padding

```text
Mobile:        16px
Tablet:        20px to 24px
Desktop:       28px to 32px
Large desktop: 32px
```

### 18.2 Content Width

Dashboard and tables:

```text
Full available width
```

Forms:

```text
Recommended max width 768px to 896px
```

Detail pages:

```text
Full width with controlled internal columns
```

Authentication pages:

```text
Card max width 420px to 480px
```

### 18.3 Twelve-Column Grid

Use a 12-column grid for desktop dashboard pages.

Recommended:

```text
grid-template-columns: repeat(12, minmax(0, 1fr))
gap: 16px to 20px
```

Examples:

```text
Main chart:          span 6
Donut card:          span 3
Small bar card:      span 3

Top medicines:       span 4
Order heatmap:       span 5
Recent orders:       span 3
```

At medium width:

```text
Main chart:          span 12
Donut card:          span 6
Small bar card:      span 6
Other panels:        span 12 or span 6
```

On mobile:

```text
All panels:          span 1 full width
```

### 18.4 Grid Alignment

Cards in one row should:

- Align at the top.
- Use compatible heights when visually related.
- Avoid unnecessary fixed heights.
- Use min-height only for chart consistency.
- Maintain equal gaps.

Do not create awkward empty columns to imitate the reference.

---

## 19. Dashboard Layout

The dashboard should closely reflect the reference's analytical rhythm.

### 19.1 Recommended Desktop Composition

```text
Page header
└── Title, period, sort, filter, date range

First dashboard row
├── Sales trend card, 6 columns
├── Order status donut, 3 columns
└── Prescription queue or order volume, 3 columns

Second dashboard row
├── Best-selling medicines, 4 columns
├── Transaction activity heatmap, 5 columns
└── Recent orders, 3 columns

Third optional row
├── Critical stock table, 6 columns
├── Expiry alerts, 3 columns
└── System health, 3 columns
```

### 19.2 Required Dashboard Information

Recommended priority:

1. Today's revenue.
2. Today's orders.
3. Prescription queue.
4. Orders being processed.
5. Low or critical stock.
6. Medicines nearing expiry.
7. Sales trend.
8. Order status distribution.
9. Best-selling medicines.
10. Recent orders.

### 19.3 Dashboard KPI Presentation

Do not create a separate row of six oversized KPI cards unless required.

The reference integrates a key metric into the chart card. Follow that principle when suitable.

Main metric block:

```text
Small label
Large value
Small comparison badge
```

Example:

```text
Pendapatan Hari Ini
Rp40.256.920
+20,8% dari kemarin
```

Large metric size:

```text
24px to 32px
```

Comparison badge:

```text
Height 22px to 24px
Small text
Pill radius
Semantic color
```

### 19.4 Critical Alert Placement

Place critical stock and prescription queues near the upper dashboard area when they require immediate action.

Do not rely only on notification count.

---

## 20. Cards

Cards are the main content container.

### 20.1 Default Card

```text
Background:    White
Border:        1px solid Border Default
Radius:        10px
Shadow:        Card Shadow
Padding:       20px
Overflow:      hidden only when required
```

### 20.2 Compact Card

Use for:

- Small charts.
- Status metrics.
- Notification summaries.
- Health cards.

```text
Padding: 16px
Radius:   8px to 10px
```

### 20.3 Card Header

Recommended structure:

```text
Left:
- Card title
- Optional description

Right:
- Time range
- More menu
- Secondary action
```

Title:

```text
14px to 15px
600
Text Strong
```

Description:

```text
12px to 13px
Text Muted
```

More icon:

```text
EllipsisHorizontal
16px to 18px
Ghost icon button
```

### 20.4 Card Body

Rules:

- One main purpose per card.
- Avoid unrelated content.
- Do not use large paragraphs.
- Use dividers only when they clarify structure.
- Keep chart labels readable.
- Do not place nested cards inside cards unless there is a clear hierarchy.

### 20.5 Card Footer

Use for:

- Download action.
- View all action.
- Pagination summary.
- Updated time.
- Contextual action.

Footer should be visually quiet.

### 20.6 Interactive Cards

Only make the whole card clickable when:

- It represents one clear destination.
- There are no nested conflicting controls.
- Keyboard focus is supported.
- Hover state is visible.

Interactive hover:

```text
Border: Primary Blue Border
Background: Primary Blue Subtle or White
Shadow: slightly elevated
```

---

## 21. Metric Cards

Use metric cards for concise values.

Structure:

```text
Label
Value
Comparison or context
Optional icon
```

Example:

```text
Pesanan Hari Ini
128
12 menunggu diproses
```

Rules:

- Value is the strongest element.
- Icon remains subtle.
- Do not use a large colored icon background on every card.
- Use semantic color only when metric meaning requires it.
- Use formatted numbers.
- Include time context when necessary.

---

## 22. Charts

Recommended library:

```text
Recharts
```

Use charts only when they improve understanding.

### 22.1 Chart Palette

Primary series:

```text
#3366FF
```

Comparison series:

```text
#C9D6FF
```

Secondary emphasis:

```text
#FF8A00
```

Success:

```text
#16A66A
```

Warning:

```text
#F59E0B
```

Danger:

```text
#E5484D
```

Neutral series:

```text
#D9DDEA
#BFC5D4
#8A92A6
```

### 22.2 Line Chart

Use for:

- Daily sales.
- Revenue trend.
- Order volume.
- Response time.
- Prescription queue over time.

Style:

```text
Primary line width:     2px to 2.5px
Comparison line width:  1.5px
Comparison dash:         4 4
Point radius:            0 by default
Active point radius:     4px
Grid:                    light horizontal only
```

Avoid vertical grid lines unless they materially help.

### 22.3 Bar Chart

Use for:

- Best-selling medicines.
- Orders by status.
- Sales by category.
- Prescription decisions.
- Revenue by payment method.

Style:

- Rounded bar end: 3px to 5px.
- Limited categories.
- Blue default.
- Orange for one highlighted category.
- Neutral bars for inactive comparison.
- Do not use rainbow bars.

### 22.4 Donut Chart

Use for:

- Order status distribution.
- Payment status.
- Prescription status.
- Stock status.

Rules:

- Maximum five meaningful segments.
- Show total in the center when useful.
- Put detailed values in a legend below.
- Use one strong primary color, one supporting accent, and restrained semantic colors.
- Do not show meaningless `100%` when the data is a multi-status composition.

### 22.5 Heatmap

Use for:

- Transactions by day and hour.
- Order volume by weekday.
- Pickup activity by time.
- Queue workload.

Style:

- Use intensity of blue.
- Use neutral pale cells for zero or low activity.
- Tooltip provides exact value.
- Do not use many unrelated colors.

### 22.6 Tooltips

Tooltip style:

```text
White background
Border Default
Radius 8px
Floating shadow
12px to 13px text
Strong primary value
Muted date or category
```

Format data correctly:

```text
Rp12.450.000
128 pesanan
14 resep
2,4 detik
```

### 22.7 Empty Chart

Show:

```text
Belum ada data untuk periode ini.
```

Optional action:

```text
Ubah rentang tanggal
```

Do not render an empty axis as if data exists.

### 22.8 Loading Chart

Use a skeleton that approximates the chart area.

Do not use a spinner centered inside every chart card.

---

## 23. Tables

Tables are central to the operational application.

### 23.1 Table Container

```text
Background: White
Border:     Border Default
Radius:      10px
Overflow:    hidden on desktop
Shadow:      optional card shadow
```

On mobile, horizontal overflow belongs inside the table container.

### 23.2 Table Header

```text
Height:       44px
Background:   Muted Surface
Text:         Text Secondary
Font size:    12px to 13px
Font weight:  600
Border bottom: Border Default
```

### 23.3 Table Row

Default:

```text
Minimum height: 52px
Background:     White
Border bottom:  Divider
Text:           13px to 14px
```

Hover:

```text
Background: Hover Surface
```

Selected:

```text
Background: Primary Blue Subtle
```

Do not use zebra striping by default.

### 23.4 Table Cell

```text
Horizontal padding: 16px
Vertical padding:   12px
```

Dense logs:

```text
Horizontal padding: 12px
Vertical padding:    9px
```

### 23.5 Table Toolbar

Recommended structure:

```text
Left:
- Search for current page
- Main filters

Right:
- Reset filters
- Export
- Primary action
```

Important:

- Search is allowed here.
- Search is not allowed in the topbar.
- Search placeholder must be specific.

Examples:

```text
Cari nama atau kode obat
Cari nomor pesanan
Cari nama pelanggan
Cari nomor resep
```

Do not use:

```text
Cari...
Search...
Ketik kata kunci...
```

when a more specific label is possible.

### 23.6 Pagination

Use server-side pagination for growing data.

Pagination includes:

- Current page.
- Total pages or total results.
- Previous.
- Next.
- Page size selector when useful.

Example summary:

```text
Menampilkan 1–20 dari 248 data
```

Do not show page number controls with dozens of buttons.

### 23.7 Row Actions

Place actions in the last column.

Use:

- Primary direct action only when obvious.
- More menu for secondary actions.
- Tooltip for icon-only actions.
- Confirmation for destructive actions.

Example:

```text
[Lihat] [⋯]
```

Do not place five icon buttons in every row.

### 23.8 Sticky Behavior

Use sticky table headers for long scrolling tables.

Use sticky first or last columns only when:

- The table is genuinely wide.
- The sticky column improves operation.
- Mobile behavior remains usable.

### 23.9 Required Empty State

Examples:

```text
Belum ada obat yang terdaftar.
Tidak ada pesanan yang sesuai dengan filter.
Belum ada resep yang menunggu verifikasi.
Tidak ada batch yang mendekati kedaluwarsa.
```

Show a primary action only when the current role has permission.

---

## 24. Recommended Table Columns

### 24.1 Medicines

```text
Foto
Kode Obat
Nama Obat
Kategori
Jenis Penjualan
Total Stok
Harga
Status
Terakhir Diperbarui
Aksi
```

### 24.2 Medicine Batches

```text
Nomor Batch
Obat
Supplier
Tanggal Diterima
Tanggal Kedaluwarsa
Stok Tersedia
Stok Dipesan
Status
Aksi
```

### 24.3 Orders

```text
Nomor Pesanan
Pelanggan
Kanal
Jumlah Item
Total
Pembayaran
Resep
Status Pesanan
Tanggal
Aksi
```

### 24.4 Prescriptions

```text
Nomor Resep
Pelanggan
Dokumen
Jumlah Obat
Status
Apoteker
Dikirim
Diverifikasi
Aksi
```

### 24.5 Payments

```text
Referensi
Nomor Pesanan
Pelanggan
Metode
Jumlah
Status
Waktu
Aksi
```

### 24.6 Stock Movements

```text
Waktu
Obat
Batch
Jenis Pergerakan
Jumlah
Saldo
Referensi
Dilakukan Oleh
```

### 24.7 Customers

```text
Nama
Email
Nomor Telepon
Total Pesanan
Pesanan Terakhir
Status
Aksi
```

### 24.8 Audit Logs

```text
Waktu
Pengguna
Peran
Aksi
Entitas
Identitas Entitas
IP
Detail
```

### 24.9 Error Logs

```text
Waktu
Severity
Modul
Pesan
Correlation ID
Status
Aksi
```

---

## 25. Buttons

### 25.1 Button Size

Default:

```text
Height: 40px
Horizontal padding: 14px to 16px
Radius: 8px
Font size: 13px to 14px
Font weight: 500 or 600
Icon: 16px
Gap: 8px
```

Compact:

```text
Height: 34px to 36px
Horizontal padding: 10px to 12px
```

Large customer CTA:

```text
Height: 44px to 48px
Horizontal padding: 18px to 22px
```

### 25.2 Primary Button

Use for one main action in a section.

```text
Background: Primary Blue
Text:       White
Hover:      Primary Blue Hover
Pressed:    Primary Blue Pressed
Focus:      Primary Blue Ring
```

Examples:

- Tambah Obat.
- Buat Pesanan.
- Simpan Perubahan.
- Verifikasi Resep.
- Proses Pembayaran.
- Generate Laporan.

### 25.3 Secondary Button

```text
Background: White
Border:     Border Strong
Text:       Text Default
Hover:      Hover Surface
```

Examples:

- Filter.
- Urutkan.
- Unduh Template.
- Lihat Detail.
- Batalkan.

### 25.4 Soft Primary Button

```text
Background: Primary Blue Soft
Text:       Primary Blue
Hover:      Primary Blue Border or slightly darker soft surface
```

Use for lower-emphasis blue actions.

### 25.5 Ghost Button

```text
Background: Transparent
Text:       Text Secondary
Hover:      Hover Surface
```

Use for:

- Icon actions.
- More menu.
- Mark as read.
- Close.
- Row secondary action.

### 25.6 Danger Button

```text
Background: Danger
Text:       White
Hover:      Danger Hover
```

Use only inside a confirmed destructive context.

Examples:

- Hapus Obat.
- Batalkan Pesanan.
- Tolak Resep.
- Rollback Import.

Do not make a destructive button the default focused action in a dialog.

### 25.7 Disabled Button

```text
Background: Subtle Surface
Text:       Text Disabled
Border:     Border Default
Opacity:    avoid excessive opacity if text becomes unreadable
```

Show the reason when a critical action is disabled.

---

## 26. Icon Buttons

Use icon buttons for familiar, compact actions.

Examples:

- Notification.
- More menu.
- Close.
- Previous or next.
- Refresh.
- Download.
- View detail.

Rules:

- Minimum desktop target: 36px.
- Minimum touch target: 44px.
- Add `aria-label`.
- Add tooltip when meaning is not obvious.
- Use 16px to 18px icons.
- Do not use icons alone for unfamiliar actions.

---

## 27. Inputs and Form Controls

### 27.1 Default Input

```text
Height:      40px
Background:  White
Border:      Border Strong
Radius:       8px
Padding:     12px
Text:        Text Strong
Placeholder: Text Muted
```

Focus:

```text
Border: Primary Blue
Ring:   2px Primary Blue Ring with low opacity
```

Error:

```text
Border: Danger
Ring:   Danger Border
```

Disabled:

```text
Background: Muted Surface
Text:       Text Disabled
```

### 27.2 Labels

```text
Font size:   13px
Font weight: 500 or 600
Color:       Text Default
Bottom gap:   6px
```

Required marker:

```text
Use a red asterisk after the label.
```

Do not rely only on asterisks. Explain optional fields when needed.

### 27.3 Helper Text

```text
12px to 13px
Text Muted
Top gap 6px
```

Use helper text for:

- File requirements.
- Password rules.
- Prescription instructions.
- Batch and expiry explanation.
- Destructive consequences.

### 27.4 Error Text

```text
12px to 13px
Danger
Top gap 6px
```

Error text must explain what needs correction.

Good:

```text
Tanggal kedaluwarsa harus setelah tanggal penerimaan.
```

Bad:

```text
Tanggal tidak valid.
```

### 27.5 Textarea

```text
Minimum height: 104px
Resize: vertical when appropriate
Padding: 12px
```

### 27.6 Select

Use the project's reusable select component.

Rules:

- Match input height.
- Show a checkmark for the selected option.
- Support search only for long lists.
- Keep popover within viewport.
- Use clear empty state.
- Do not use browser-default styling on primary forms.

### 27.7 Date Input

Use consistent date picker styling.

Rules:

- Indonesian date display.
- Clear selected state in Primary Blue.
- Current date has a subtle outline.
- Disabled dates are visibly disabled.
- Date range uses connected pale blue selection.
- Do not use multiple different date picker libraries.

### 27.8 Number Input

Use for:

- Quantity.
- Price.
- Minimum stock.
- Dosage quantity when specified by business rules.

Rules:

- Right-align currency and numeric totals when appropriate.
- Prevent invalid negative values.
- Show unit suffix outside or inside the field consistently.
- Do not rely only on native spinner controls.

### 27.9 Password Input

Include:

- Visibility toggle.
- Strength or requirement guidance when registering.
- Clear error state.
- No password value in logs.

---

## 28. Form Layout

### 28.1 Default Form Width

```text
max-width: 768px to 896px
```

Use full width only when the form includes tables, item builders, or prescription preview.

### 28.2 One-Column Form

Use for:

- Authentication.
- Customer profile.
- Simple settings.
- Short create or edit forms.

### 28.3 Two-Column Form

Use on desktop for related fields:

```text
Nama depan | Nama belakang
Kategori | Supplier
Tanggal diterima | Tanggal kedaluwarsa
Harga beli | Harga jual
```

Stack on mobile.

### 28.4 Form Sections

Use section headings rather than one long field list.

Example:

```text
Informasi Obat
Informasi Penjualan
Pengaturan Stok
Gambar Obat
```

Section title:

```text
16px to 18px
600
Text Strong
```

Section description:

```text
13px to 14px
Text Muted
```

### 28.5 Form Actions

Desktop:

```text
Cancel or secondary action on left or before primary
Primary action last
```

For long forms, use a sticky bottom action bar only when it meaningfully prevents loss of work.

Mobile:

- Full-width primary action.
- Secondary action below or beside it depending on available width.

---

## 29. Filters

### 29.1 Filter Bar

Use a compact white or muted surface.

```text
Background: White or Muted Surface
Border:     Border Default
Radius:      10px
Padding:     12px to 16px
Gap:         10px to 12px
```

### 29.2 Filter Controls

Common filters:

- Status.
- Category.
- Supplier.
- Prescription requirement.
- Payment method.
- Order channel.
- Date range.
- Expiry range.
- Stock condition.

### 29.3 Applied Filters

Use removable filter chips.

Example:

```text
Status: Diproses ×
Kategori: Obat Bebas ×
```

Chip:

```text
Height: 28px to 30px
Background: Primary Blue Soft
Text: Primary Blue
Radius: full
```

### 29.4 Reset

Show `Reset filter` only when filters differ from defaults.

Do not keep a disabled reset action visible all the time.

### 29.5 Mobile Filter

Use a right drawer or bottom sheet.

Structure:

```text
Filter
Controls
Reset
Terapkan Filter
```

Keep applied filter count visible on the trigger.

---

## 30. Date Range Controls

Use one date-range control for period-based reports.

Do not combine redundant controls such as:

- Last 30 days.
- Monthly selector.
- Separate arbitrary date range.

when one date range already fulfills the requirement.

Recommended labels:

```text
Periode
Tanggal mulai
Tanggal akhir
```

Quick presets may exist inside the date picker:

```text
Hari ini
7 hari terakhir
30 hari terakhir
Bulan ini
Bulan lalu
```

The visible page control should remain one coherent date range.

---

## 31. Badges

Badge structure:

```text
Height:       24px to 26px
Padding:      8px to 10px horizontal
Radius:       full
Font size:    11px to 12px
Font weight:  500 or 600
Optional dot: 6px
```

Rules:

- Include text.
- Do not use color only.
- Keep labels short.
- Use consistent semantic mapping.
- Avoid uppercase for long status labels.
- Use one shared status badge component.

---

## 32. Tabs

Use tabs for related views, not primary navigation.

Examples:

- Detail Pesanan.
- Pembayaran.
- Resep.
- Riwayat Status.
- Informasi Obat.
- Batch Stok.
- Pergerakan.
- Audit.

Recommended style:

```text
Background: transparent
Bottom border on container
Active text: Primary Blue
Active indicator: 2px Primary Blue
Inactive text: Text Secondary
Height: 40px to 44px
```

For compact segmented filters, a soft filled tab style is allowed.

Do not use more than six visible tabs without overflow handling.

---

## 33. Dropdowns and Popovers

Use for:

- Row actions.
- User menu.
- Sort selection.
- Notification preview.
- Small contextual settings.

Style:

```text
Background: White
Border: Border Default
Radius: 8px to 10px
Shadow: Floating Shadow
Padding: 6px
Item height: 36px to 40px
```

Danger item:

```text
Text: Danger
Hover background: Danger Soft
```

Do not place long forms inside a dropdown.

---

## 34. Dialogs

Use dialogs for focused decisions or short forms.

Recommended width:

```text
Small confirm: 400px to 440px
Default:       520px to 640px
Large:         760px maximum for focused content
```

Structure:

```text
Title
Description
Body
Actions
```

Dialog title:

```text
18px
600
```

Rules:

- Use destructive confirmation for irreversible actions.
- Explain consequences.
- Keep cancel available.
- Do not use a dialog for full-page workflows.
- Do not place large tables inside a dialog.
- Prescription review may use a large dialog only if document preview remains usable; a dedicated page is preferred.

---

## 35. Drawers and Sheets

Use a drawer for:

- Mobile navigation.
- Mobile filters.
- Notification panel.
- Quick order detail.
- Quick medicine detail.
- Non-destructive contextual inspection.

Desktop right drawer width:

```text
420px to 520px
```

Mobile:

```text
Full width or nearly full width
```

Do not use a drawer when users need to compare information across the full page.

---

## 36. Notifications

### 36.1 Notification Trigger

Place in the topbar.

Unread indicator:

- Small dot or count.
- No constant animation.
- Tooltip or accessible label.

### 36.2 Notification Panel

Recommended desktop width:

```text
380px to 420px
```

Structure:

```text
Header
Unread count
Notification groups
View all action
```

### 36.3 Notification Item

```text
Icon or status dot
Title
Short message
Time
Read state
Optional action
```

Unread:

```text
Background: Primary Blue Subtle
Title weight: 600
```

Read:

```text
Background: White
Title weight: 500
```

### 36.4 Notification Types

- Pesanan baru.
- Resep menunggu verifikasi.
- Resep disetujui.
- Resep ditolak.
- Pembayaran berhasil.
- Pembayaran gagal.
- Stok rendah.
- Stok kritis.
- Obat mendekati kedaluwarsa.
- Laporan selesai.
- Import selesai.
- Error aplikasi.
- Worker bermasalah.

Do not include full sensitive prescription details in the preview.

---

## 37. Toasts

Use toast for immediate feedback.

Use for:

- Data saved.
- Record created.
- Status updated.
- Job started.
- File uploaded.
- Copy action completed.

Do not use toast as the only place for:

- Critical stock.
- Failed prescription validation details.
- Complex import results.
- Long error explanations.
- Payment dispute.

Toast duration:

```text
Success: 3 to 4 seconds
Info:    4 seconds
Warning: 5 to 6 seconds
Error:   persistent or 6 to 8 seconds when action is required
```

Include a retry action when practical.

---

## 38. Tooltips

Use tooltips for:

- Collapsed sidebar icons.
- Icon-only actions.
- Truncated technical values.
- Short chart explanations.
- Unfamiliar status icons.

Tooltip:

```text
Dark navy background
White text
12px
Radius 6px
Padding 6px 8px
```

Do not hide essential instructions only inside tooltips.

---

## 39. Empty States

Every data view needs a useful empty state.

Structure:

```text
Simple icon
Clear title
Short explanation
Optional action
```

Examples:

```text
Belum ada pesanan hari ini.
Pesanan baru akan muncul di halaman ini.

Belum ada resep yang menunggu verifikasi.
Semua resep telah selesai ditinjau.

Tidak ada obat yang sesuai dengan filter.
Ubah kata pencarian atau reset filter.

Belum ada batch stok.
Tambahkan penerimaan stok pertama untuk obat ini.
```

Rules:

- Use a simple line icon.
- Avoid large decorative illustrations.
- Keep explanation under two sentences.
- Show action only when the user has permission.
- Differentiate `empty because no data` and `empty because filter`.

---

## 40. Loading States

### 40.1 Skeleton

Use skeleton for:

- Dashboard cards.
- Charts.
- Tables.
- Detail panels.
- Product cards.
- Prescription preview metadata.

Skeleton colors:

```text
Base:      #EEF0F5
Highlight: #F7F8FB
```

### 40.2 Spinner

Use a spinner for:

- Button submissions.
- Small localized actions.
- Short refresh operations.

Do not use a full-page spinner when the layout can remain visible.

### 40.3 Progress

Use progress for:

- Import.
- Report generation.
- Bulk operation.
- File upload.
- Background processing.

Show:

```text
Current step
Percentage when reliable
Completed and failed counts when available
```

Do not show fake percentage progress.

---

## 41. Error States

An error state must answer:

1. What failed?
2. What can the user do?
3. Is their data safe?
4. Can the action be retried?

Good examples:

```text
Data pesanan gagal dimuat.
Coba muat ulang halaman. Filter yang dipilih tetap disimpan.

Pembayaran belum dapat dikonfirmasi.
Status pesanan belum berubah. Periksa kembali beberapa saat lagi.

Stok tidak mencukupi.
Kurangi jumlah pesanan atau pilih obat lain.
```

Do not expose:

- Stack traces.
- Database errors.
- Tokens.
- Provider secrets.
- Internal paths.

---

## 42. Accessibility

Accessibility is mandatory.

### 42.1 Contrast

- Normal text contrast minimum: 4.5:1.
- Large text contrast minimum: 3:1.
- Focus indicator must remain visible.
- Do not use light gray text for important content.

### 42.2 Keyboard

Support keyboard access for:

- Sidebar.
- Menus.
- Tabs.
- Forms.
- Tables where interactive.
- Dialogs.
- Drawers.
- Date pickers.
- File upload.

### 42.3 Focus

Use a consistent visible focus ring.

```text
2px Primary Blue Ring
2px offset where needed
```

Do not remove outlines without a replacement.

### 42.4 Touch Targets

Minimum:

```text
44px × 44px on touch interfaces
```

### 42.5 Screen Readers

- Icon-only buttons need accessible labels.
- Form fields need labels.
- Errors must connect to fields.
- Status must be expressed in text.
- Dialogs need title and description.
- Tables need headers.
- Decorative icons should be hidden from assistive technology.

### 42.6 Motion

Respect reduced motion settings.

Avoid:

- Continuous pulsing.
- Large animated transitions.
- Excessive chart animation.
- Parallax.

---

## 43. Responsive Breakpoints

Use the existing Tailwind breakpoints.

```text
sm:   640px
md:   768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

### 43.1 Mobile

- Sidebar becomes a drawer.
- Topbar becomes 56px.
- Page padding becomes 16px.
- Cards stack.
- Actions wrap.
- Tables scroll.
- Forms use one column.
- Dialogs become nearly full screen when needed.
- Filters open in a sheet.
- Charts use reduced height and labels.
- Avoid sticky side panels.

### 43.2 Tablet

- Sidebar may collapse.
- Dashboard uses one or two columns.
- Page header actions may wrap.
- Detail sidebars move below primary content when narrow.
- Tables remain scrollable.

### 43.3 Desktop

- Expanded or collapsible sidebar.
- Full analytical grid.
- Visible page filters.
- Two-column detail layouts.
- Sticky page controls when useful.

---

## 44. Operational Page Templates

### 44.1 List Page

Structure:

```text
Page header
Filter and search toolbar
Optional summary strip
Table
Pagination
```

Use for:

- Obat.
- Pesanan.
- Resep.
- Pelanggan.
- Pembayaran.
- Batch.
- Pergerakan stok.
- Audit log.
- Error log.

### 44.2 Detail Page

Structure:

```text
Page header
Status and primary actions
Main two-column area
├── Primary information
└── Status, metadata, or summary
Tabs or sections
History or audit timeline
```

Recommended desktop ratio:

```text
8 columns main
4 columns side
```

Mobile:

```text
Stack side content below main content
```

### 44.3 Create or Edit Page

Structure:

```text
Back link or breadcrumb
Page title
Short description
Form sections
Actions
```

Do not put a full create form inside a small modal.

### 44.4 Monitoring Page

Structure:

```text
System health cards
Response time chart
Resource usage
Queue cards
Recent errors
Failed jobs
```

Use compact cards and dense tables.

---

## 45. Dashboard Module Specifications

### 45.1 Sales Trend Card

Header:

```text
Pendapatan
Period selector
```

Metric:

```text
Pendapatan Hari Ini
Rp40.256.920
+20,8%
```

Chart:

- Primary blue line.
- Pale comparison line.
- Tooltip.
- Horizontal grid.
- No excessive markers.

### 45.2 Order Status Donut

Header:

```text
Status Pesanan
```

Center:

```text
Total pesanan
128
```

Legend:

```text
Diproses
Siap Diambil
Selesai
Dibatalkan
```

### 45.3 Prescription Queue Card

Header:

```text
Antrean Resep
```

Content:

- Total waiting.
- Oldest waiting time.
- Approval or rejection trend.
- Direct link to review queue.

Use warning only when a queue exceeds its defined threshold.

### 45.4 Best-Selling Medicines

Use horizontal bars.

Show:

- Medicine name.
- Units sold.
- Relative bar.
- Optional category.

Highlight one item only when meaningful.

### 45.5 Activity Heatmap

Show order or transaction volume by:

- Day.
- Hour.

Use blue intensity.

### 45.6 Recent Orders

Compact list:

```text
Avatar or initials
Customer name
Order number
Total
Status or time
```

Limit to five or six items.

Footer:

```text
Lihat semua pesanan
```

### 45.7 Critical Stock

Show:

- Medicine.
- Current quantity.
- Minimum threshold.
- Status.
- Action.

Do not hide critical stock in a chart only.

### 45.8 Expiry Alert

Show:

- Medicine.
- Batch.
- Expiry date.
- Remaining days.
- Quantity.

Sort by closest expiry.

---

## 46. Medicine Management Design

### 46.1 Medicine List

Toolbar:

- Search by medicine name or code.
- Category filter.
- Prescription requirement filter.
- Stock status.
- Sort.
- Add medicine.

Table or card content:

- Thumbnail.
- Code.
- Name.
- Category.
- Prescription label.
- Stock.
- Price.
- Status.
- Action.

### 46.2 Medicine Thumbnail

Recommended:

```text
40px × 40px
Radius 6px
Muted background
Object fit contain
```

Use a neutral medicine placeholder when no image exists.

### 46.3 Medicine Detail

Sections:

- Basic information.
- Composition.
- Dosage information supplied by verified data.
- Side effects supplied by verified data.
- Price.
- Prescription requirement.
- Stock summary.
- Batch list.
- Stock movement history.
- Image gallery.
- Audit history.

Do not fabricate medicine information.

### 46.4 Stock Status Summary

Use a horizontal summary:

```text
Total stock
Available
Reserved
Critical threshold
Nearest expiry
```

Do not allow direct quantity editing from this summary.

---

## 47. Prescription Review Design

Prescription review is a high-attention workflow.

### 47.1 Preferred Layout

Desktop:

```text
Left, 7 columns:
- Prescription document viewer

Right, 5 columns:
- Customer identity summary
- Order medicines
- Verification form
- Decision actions
```

Mobile:

```text
Document preview
Customer and order summary
Verification form
Actions
```

### 47.2 Document Viewer

Provide:

- Zoom.
- Rotate.
- Download when permitted.
- Open in new secure view when supported.
- Page navigation for PDF.
- Clear unsupported file state.

Do not expose a public object storage URL.

### 47.3 Verification Form

Fields:

- Decision.
- Pharmacist notes.
- Approved quantity per medicine when required.
- Reason for rejection.
- Confirmation.

### 47.4 Actions

Primary approval:

```text
Setujui Resep
```

Destructive rejection:

```text
Tolak Resep
```

Use a confirmation for rejection.

Do not place approve and reject buttons with identical visual weight.

### 47.5 History

Show immutable review history:

- Pharmacist.
- Decision.
- Time.
- Notes.
- Quantity changes.

Use a vertical timeline or dense history list.

---

## 48. Order Management Design

### 48.1 Order List

Prioritize:

- Order number.
- Customer.
- Channel.
- Prescription state.
- Payment state.
- Fulfillment status.
- Total.
- Time.

Use separate badges for:

- Payment.
- Prescription.
- Order.

Do not combine three different statuses into one ambiguous badge.

### 48.2 Order Detail Header

Show:

```text
Order number
Customer
Created time
Main order status
Primary next action
```

### 48.3 Order Detail Sections

- Customer.
- Items.
- Prescription.
- Payment.
- Pickup or delivery.
- Status history.
- Notes.
- Audit context.

### 48.4 Order Timeline

Use a vertical or horizontal timeline depending on width.

Each event includes:

- Status.
- Time.
- Actor.
- Optional note.

Completed step:

```text
Success color
```

Current step:

```text
Primary blue
```

Pending step:

```text
Neutral
```

Failed step:

```text
Danger
```

---

## 49. Cashier Interface

The cashier flow must be fast.

### 49.1 Desktop Layout

Recommended:

```text
Left, 7 columns:
- Medicine search
- Category filter
- Medicine results

Right, 5 columns:
- Current cart
- Customer
- Prescription warning
- Totals
- Payment action
```

### 49.2 Medicine Search

Search remains inside the cashier page.

Features:

- Fast autocomplete.
- Barcode or code support when implemented.
- Keyboard navigation.
- Stock visibility.
- Prescription indicator.

### 49.3 Cart

Cart item:

- Medicine.
- Batch allocation summary when relevant.
- Quantity control.
- Unit price.
- Subtotal.
- Remove action.

Totals:

- Subtotal.
- Discount when supported.
- Tax when applicable.
- Final total.

### 49.4 Prescription Warning

Prescription medicines must show a clear warning.

Example:

```text
Obat ini memerlukan resep yang telah disetujui apoteker.
```

Do not use a small tooltip as the only warning.

### 49.5 Checkout Action

Primary action remains visible.

Use a sticky cart footer only when needed and without covering content.

---

## 50. Stock and Batch Design

### 50.1 Batch List

Show expiry condition prominently.

Use:

- Batch number in monospace.
- Expiry badge.
- Available quantity.
- Reserved quantity.
- Received date.
- Supplier.

### 50.2 Stock Movement

Movement type should use icon plus text.

Examples:

- Penerimaan.
- Penjualan.
- Reservasi.
- Pelepasan reservasi.
- Penyesuaian.
- Retur.
- Pembuangan kedaluwarsa.

Use semantic color sparingly.

Positive stock movement is not automatically success. It is a direction, not a business outcome.

### 50.3 Stock Adjustment

Adjustment form must show:

- Current stock.
- Adjustment direction.
- Quantity.
- Reason.
- Resulting stock preview.
- Confirmation.

Use warning copy because adjustment affects authoritative stock.

### 50.4 Expiry Monitoring

Use:

- Summary counts.
- Date range filter.
- Severity filter.
- Batch table.
- Direct action to inspect the batch.

Avoid a decorative calendar as the primary expiry view.

---

## 51. Import Design

Import is a controlled workflow.

### 51.1 Stepper

```text
1. Unggah File
2. Petakan Kolom
3. Validasi
4. Konfirmasi
5. Proses
6. Hasil
```

Use a horizontal stepper on desktop and vertical on mobile.

### 51.2 Upload Area

```text
Dashed border
Muted background
Upload icon
Clear file format text
Select file button
```

Example:

```text
Unggah file CSV atau Excel
Maksimum 10 MB. Gunakan template yang telah disediakan.
```

### 51.3 Validation Results

Show:

- Total rows.
- Valid rows.
- Invalid rows.
- Warnings.
- Row-level detail.

Use table filters for:

- Semua.
- Valid.
- Peringatan.
- Gagal.

Do not say `Berhasil` when invalid rows remain without explanation.

### 51.4 Processing

Show real job state.

Include:

- Current phase.
- Processed count.
- Success count.
- Failed count.
- Started time.

### 51.5 Result

Provide:

- Summary.
- Error file download.
- Audit reference.
- Rollback action when supported.
- View imported data action.

---

## 52. Reports Design

Reports should look official and operational.

### 52.1 Report Generation Form

Fields:

- Report type.
- Date range.
- Category.
- Payment method.
- Order channel.
- Status.
- Output format when multiple formats exist.

Use one date range.

### 52.2 Report History

Show:

- Report name.
- Period.
- Generated by.
- Created time.
- Status.
- File size.
- Download.
- Expiration when temporary.

### 52.3 PDF Visual Style

PDF should include:

- Klinik Makmur Jaya logo.
- Makmur Farma name.
- Report title.
- Period.
- Generated time.
- Generated by.
- Summary metrics.
- Chart where relevant.
- Data table.
- Page number.
- Confidentiality note when appropriate.

PDF palette:

- White background.
- Dark navy text.
- Primary blue headings.
- Pale blue table header.
- Semantic colors only for status.

Do not overdesign the PDF.

---

## 53. Monitoring Design

Monitoring uses the same light design system.

### 53.1 Health Cards

Services:

- Web.
- API.
- PostgreSQL.
- Redis.
- Worker.
- Object storage.
- Email.
- Payment provider when health data is available.

Card content:

```text
Service
Status badge
Main metric
Last checked
Short context
```

### 53.2 Resource Metrics

- CPU.
- Memory.
- Response time.
- Uptime.
- Queue depth.
- Failed jobs.

Do not show CPU or memory values unless the data source is real.

### 53.3 Error Table

Use dense table.

Critical errors should be visible but not visually overwhelming.

### 53.4 Stack Trace

Use a collapsible monospace panel.

Only permitted roles may view it.

---

## 54. Audit Log Design

Use a dense and traceable layout.

### 54.1 Filters

- User.
- Role.
- Action.
- Entity.
- Date range.
- IP.
- Correlation ID.

### 54.2 Detail Drawer

Show:

- Actor.
- Time.
- Action.
- Target.
- Safe metadata.
- Before and after summary when allowed.
- Correlation ID.

Do not provide a delete action.

---

## 55. Customer Storefront

The customer interface shares the same design tokens but does not use the operational sidebar.

### 55.1 Customer Header

Desktop:

```text
Logo
Catalog navigation
Prescription upload entry
Cart
Orders
Account
```

Mobile:

```text
Menu
Logo
Cart
Account
```

Customer storefront search may exist in the storefront header or catalog page because the prohibition applies specifically to the operational topbar.

### 55.2 Customer Palette

Use:

- White.
- App Background.
- Primary Blue.
- Text Strong.
- Soft blue surfaces.
- Semantic status colors.

Do not introduce a second brand palette.

### 55.3 Product Cards

Structure:

```text
Product image
Category
Medicine name
Prescription badge
Price
Stock state
Add to cart action
```

Card:

```text
White
Border Default
Radius 10px
Subtle hover
```

Avoid marketplace-style discount noise.

### 55.4 Product Detail

Show:

- Product image.
- Name.
- Category.
- Prescription requirement.
- Price.
- Stock availability.
- Verified product information.
- Quantity.
- Add to cart.
- Prescription instructions.
- Safety information.

### 55.5 Customer Checkout

Use a guided structure:

```text
Customer and address
Delivery or pickup
Prescription
Payment
Order summary
Confirmation
```

Keep the order summary visible on desktop.

### 55.6 Customer Order Tracking

Use a simple status timeline.

Show:

- Current status.
- Next expected step.
- Prescription result.
- Payment result.
- Pickup or delivery details.
- Support action.

---

## 56. Authentication Pages

Authentication pages should be clean and simple.

### 56.1 Layout

Desktop:

```text
Left optional brand panel
Right authentication card
```

or:

```text
Centered card on light background
```

Preferred when no approved illustration exists:

```text
Centered card
```

### 56.2 Authentication Card

```text
Width: 420px to 480px
Background: White
Border: Border Default
Radius: 12px
Padding: 28px to 32px
Shadow: Card Shadow
```

### 56.3 Content

- Logo.
- Clear title.
- Short description.
- Fields.
- Primary action.
- Relevant secondary link.
- Error message.

Do not use generic healthcare stock photos.

---

## 57. File Uploads

Use for:

- Medicine images.
- Prescription files.
- Import files.
- Supporting documents.

### 57.1 Upload Component

Show:

- Drop area.
- Select file button.
- Accepted types.
- Maximum size.
- Current file.
- Upload progress.
- Remove or replace action.

### 57.2 Prescription Upload Copy

Example:

```text
Unggah resep dokter
Gunakan file JPG, PNG, atau PDF yang jelas dan dapat dibaca.
```

Do not promise approval.

### 57.3 Image Preview

Medicine image:

- Contained preview.
- Neutral background.
- Remove or replace action.

Prescription:

- Secure preview.
- File name.
- Size.
- Page count when available.
- Privacy warning.

---

## 58. Copywriting

Use clear professional Bahasa Indonesia.

### 58.1 Tone

The tone is:

- Direct.
- Calm.
- Helpful.
- Operational.
- Respectful.
- Not too casual.
- Not stiff.
- Not dramatic.

### 58.2 Good Examples

```text
Resep berhasil dikirim dan menunggu verifikasi apoteker.

Stok obat ini berada di bawah batas minimum.

Pembayaran berhasil dikonfirmasi.

Pesanan siap diambil di Klinik Makmur Jaya.

Laporan sedang dibuat. Anda dapat memantau progresnya di riwayat laporan.
```

### 58.3 Avoid

```text
Oops!
Yay!
Mantap!
Terjadi sesuatu!
Data invalid.
System error.
```

### 58.4 Button Labels

Use verbs.

Good:

- Tambah Obat.
- Simpan Perubahan.
- Tinjau Resep.
- Konfirmasi Pembayaran.
- Proses Pesanan.
- Unduh Laporan.
- Coba Lagi.

Avoid:

- OK.
- Submit.
- Yes.
- Action.
- Continue.

when a more specific label is possible.

### 58.5 Terminology

Recommended terms:

```text
Obat
Kategori Obat
Resep
Apoteker
Kasir
Pelanggan
Pesanan
Pembayaran
Pengambilan
Pengiriman
Stok
Batch
Kedaluwarsa
Pergerakan Stok
Penyesuaian Stok
Notifikasi
Audit Log
Error Log
Monitoring
Import
Export
```

Use one term consistently.

Do not switch between:

- Customer and pelanggan.
- Order and pesanan.
- Medicine and obat.
- Expired and kedaluwarsa.

inside the visible UI.

---

## 59. Data Formatting

### 59.1 Currency

Use Indonesian Rupiah:

```text
Rp1.234.567
Rp40.256.920
```

No decimal digits unless the domain specifically requires them.

### 59.2 Numbers

```text
1.250 obat
25.000 unit
128 pesanan
```

### 59.3 Percentage

```text
20,8%
87%
```

### 59.4 Date

User-facing:

```text
5 Juni 2026
5 Juni 2026, 14.30
```

Compact table:

```text
05 Jun 2026
05 Jun 2026, 14.30
```

Technical logs:

```text
2026-06-05 14:30:22
```

### 59.5 Relative Time

Use when context benefits:

```text
5 menit lalu
2 jam lalu
Kemarin, 14.30
```

Provide exact time in tooltip or detail when needed.

### 59.6 IDs

Use monospace:

```text
ORD-20260605-00128
RX-20260605-0041
BATCH-PCT-260601
```

Truncate long identifiers visually but keep full value accessible.

### 59.7 Stock Quantity

Use stored unit consistently:

```text
120 tablet
5 botol
12 strip
4 kotak
```

Do not append `unit` when a more precise unit exists.

---

## 60. Motion and Transitions

Use restrained motion.

Recommended durations:

```text
Hover:            120ms to 160ms
Dropdown:         150ms to 180ms
Drawer:           180ms to 240ms
Dialog:           160ms to 220ms
Sidebar collapse: 180ms to 220ms
```

Recommended easing:

```text
ease-out for entering
ease-in for leaving
```

Avoid:

- Bouncy spring animations.
- Constant pulsing cards.
- Large parallax.
- Animated gradients.
- Long chart animation.

---

## 61. Z-Index

Use a documented scale.

```text
Base content:          0
Sticky table header:  10
Topbar:               30
Sidebar:              40
Dropdown or popover:  50
Drawer overlay:       60
Drawer:               70
Dialog overlay:       80
Dialog:               90
Toast:               100
Tooltip:             110
```

Do not use arbitrary values such as `z-[99999]` without a clear reason.

---

## 62. Component Naming

Recommended names:

```text
AppSidebar
SidebarGroup
SidebarNavigationItem
AppTopbar
PageHeader
PageToolbar
DashboardCard
DashboardMetric
SalesTrendChart
OrderStatusDonut
PrescriptionQueueCard
RecentOrdersList
MedicineTable
MedicineStatusBadge
ExpiryStatusBadge
PrescriptionStatusBadge
OrderStatusBadge
PaymentStatusBadge
StockBatchTable
StockMovementTable
PrescriptionReviewPanel
PrescriptionDocumentViewer
OrderTimeline
NotificationPanel
AuditLogTable
ErrorLogTable
MonitoringHealthCard
ImportStepper
ReportGenerationForm
DateRangePicker
FilterDrawer
EmptyState
ErrorState
PermissionState
```

Avoid vague names:

```text
Box
DataCard
CardItem
Thing
ContentWrapper
MainSection
InfoComponent
```

---

## 63. Component Reuse

Create shared components for:

- Button.
- Input.
- Select.
- Date picker.
- Badge.
- Card.
- Table.
- Pagination.
- Dialog.
- Drawer.
- Dropdown.
- Tooltip.
- Toast.
- Skeleton.
- Empty state.
- Page header.
- Filter bar.
- Status badges.
- Chart container.
- File upload.

Do not duplicate status styling across modules.

Do not create a shared abstraction until at least two real use cases justify it, except for foundational design-system components.

---

## 64. Implementation Rules

Use:

- Tailwind CSS.
- Existing shadcn/ui components.
- Existing class merge helper.
- Recharts.
- Lucide icons.
- TanStack Table.
- TanStack Query.
- TanStack Form.
- Zod.
- Existing image component pattern.
- Existing responsive and theme tokens.

Rules:

- Search for an existing component before creating one.
- Do not add inline style unless a dynamic value cannot be represented otherwise.
- Keep dynamic chart dimensions controlled.
- Use semantic tokens instead of repeated literal colors.
- Keep permission logic outside purely visual components when possible.
- Never show a hidden action by CSS only. Do not render it without permission.
- Preserve accessible names.
- Keep responsive behavior in the component implementation.
- Do not create one-off spacing values when the standard scale works.

---

## 65. Recommended Tailwind Patterns

### 65.1 App Background

```text
bg-[#F4F5FA]
```

Prefer a semantic class once tokens are configured.

### 65.2 Card

```text
rounded-[10px] border border-[#E7E9F1] bg-white shadow-sm
```

Replace with semantic utilities in the final implementation.

### 65.3 Active Sidebar Item

```text
rounded-lg bg-[#EAF0FF] text-[#3366FF]
```

### 65.4 Default Sidebar Item

```text
rounded-lg text-[#3F4759] hover:bg-[#F6F8FD] hover:text-[#171C2C]
```

### 65.5 Primary Button

```text
h-10 rounded-lg bg-[#3366FF] px-4 text-white hover:bg-[#2855D9]
```

### 65.6 Input

```text
h-10 rounded-lg border border-[#D7DBE7] bg-white px-3
focus:border-[#3366FF] focus:ring-2 focus:ring-[#9DB6FF]/40
```

These snippets explain the visual target. Use configured theme tokens rather than permanent arbitrary values.

---

## 66. Permission States

When a user lacks access:

- Hide navigation items they cannot use.
- Reject direct route access.
- Show a dedicated permission state when navigation occurs through a stale link.
- Do not show disabled destructive actions without explanation.

Permission state copy:

```text
Anda tidak memiliki akses ke halaman ini.
Hubungi administrator jika akses ini diperlukan untuk pekerjaan Anda.
```

Provide a safe navigation action:

```text
Kembali ke Dashboard
```

---

## 67. Privacy and Sensitive Information

Sensitive information must remain visually controlled.

### 67.1 Prescription Documents

- Do not show thumbnail previews in general notifications.
- Do not expose public URLs.
- Restrict preview to authorized roles.
- Mask unnecessary customer details in broad lists.
- Show access warning when appropriate.

### 67.2 Customer Data

- Show only needed fields.
- Avoid displaying full addresses in tables.
- Use detail view for complete information.
- Do not place customer contact data in chart tooltips.

### 67.3 Payment

- Show provider reference when needed.
- Do not show secrets.
- Do not show full sensitive payment credentials.
- Use masked values where appropriate.

---

## 68. Design Review Checklist

Before completing any UI task, verify:

### Layout

- Does the page use the operational shell correctly?
- Is the sidebar white and consistent?
- Is the topbar free from a search field?
- Is page padding consistent?
- Does the layout work at mobile, tablet, and desktop sizes?
- Does the content avoid horizontal page overflow?

### Hierarchy

- Is the page title obvious?
- Is the primary action clear?
- Are secondary actions visually quieter?
- Is important status visible?
- Is information grouped logically?

### Components

- Are existing components reused?
- Are status badges consistent?
- Are card headers consistent?
- Are buttons using the correct hierarchy?
- Are forms using labels and helper text?
- Are tables searchable and paginated where needed?

### States

- Is there a loading state?
- Is there an empty state?
- Is there an error state?
- Is there a permission state?
- Is disabled behavior explained?
- Is success feedback clear?

### Accessibility

- Is contrast sufficient?
- Is focus visible?
- Are touch targets large enough?
- Do icon buttons have accessible names?
- Are status labels textual?
- Can the workflow be completed with a keyboard?

### Domain Safety

- Is prescription status explicit?
- Are stock values not directly editable?
- Are expiry warnings clear?
- Are payment states separated from order states?
- Is sensitive information protected?
- Does copy avoid unsupported medical claims?

### Visual Consistency

- Are colors from the defined palette?
- Are shadows subtle?
- Is radius restrained?
- Are icons consistent?
- Are charts using the approved palette?
- Is the interface free from decorative clutter?

---

## 69. Final Design Acceptance Criteria

The design is acceptable only when:

- It visually resembles a modern light analytics dashboard.
- The sidebar is the primary navigation anchor.
- The active sidebar state uses pale blue and blue text.
- The topbar remains simple and contains no search input.
- The application background is light gray-lilac.
- Cards are white with subtle borders and shadows.
- Blue is the main interactive color.
- Orange remains a supporting accent.
- Typography is clean and compact.
- Dashboard cards use a coherent 12-column layout.
- Tables are readable and operational.
- Forms are safe and clearly labeled.
- Prescription workflows receive appropriate visual attention.
- Stock and expiry states are easy to identify.
- Customer and operational interfaces share one design language.
- Mobile behavior is intentionally designed.
- Accessibility requirements are met.
- No module introduces an unrelated visual style.

---

## 70. Final Design Principle

Makmur Farma should feel like a calm, trustworthy pharmacy operations workspace.

The interface should not compete with the data.

The best implementation allows users to understand the current condition, identify risks, and complete the next action without searching through visual noise.