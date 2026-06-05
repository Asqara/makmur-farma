# DESIGN.md

Design system for SmartStock Pro. Read this before any UI work.

## Design Direction

SmartStock Pro uses a professional dashboard monitoring style.

The interface should feel like an operational control center for inventory teams. It must help users quickly understand stock condition, warehouse activity, alerts, transfers, reports, and system health.

The design must be:

- Clear
- Calm
- Data-focused
- Fast to scan
- Professional
- Operational
- Not playful
- Not too decorative
- Not enterprise-heavy

The main priority is readability and decision-making.

## Product Context

SmartStock Pro is an inventory management system for PT Maju Bersama Digital.

The system manages:

- Products
- Categories
- Suppliers
- Warehouses
- Stock movements
- Stock batches
- Warehouse transfers
- Low-stock alerts
- Reports
- Imports
- Audit logs
- Error logs
- Server monitoring
- Redis and worker jobs

This is a dashboard application, not a marketing website.

## Tone

Use clear and professional Bahasa Indonesia.

The tone should be:

- Direct
- Helpful
- Calm
- Operational
- Easy to understand
- Not too casual
- Not stiff

Good examples:

- "Stok produk ini berada di bawah batas minimum."
- "Transfer berhasil diproses."
- "Laporan sedang dibuat. Anda dapat memantau progresnya di halaman laporan."
- "Worker tidak aktif. Periksa koneksi Redis atau jalankan ulang worker."

Avoid:

- Overly playful copy
- Excessive emoji
- Technical jargon without context
- Long explanation in UI
- Dramatic warning text

## Logo

Use SmartStock Pro logo assets from `/public` when available.

### Suggested Assets

- `/logo.svg` for full logo.
- `/logomark.svg` for compact sidebar or favicon area.
- `/favicon.png` for browser favicon.

### Usage

- Use plain `<img loading="lazy" alt="SmartStock Pro">`.
- Always provide `alt`.
- Use `"SmartStock Pro"` for full logo.
- Use `"SmartStock Pro logo"` for logomark.
- Do not recolor, redraw, stretch, or recreate the logo.
- Do not place the logo on visually noisy backgrounds.
- Use enough clear space around the logo.
- Minimum height:
  - Logomark: 28px
  - Full logo: 32px

If the logo asset does not exist yet, use text brand:

```txt
SmartStock Pro
````

Use it in a strong but simple wordmark style.

## Visual Style

SmartStock Pro should look like a modern operations dashboard.

Recommended style:

* Light content area
* Dark or deep sidebar
* White cards
* Subtle borders
* Compact but readable tables
* Status colors for operational meaning
* Charts with minimal decoration
* Clear hierarchy between summary, detail, and action

Avoid:

* Glassmorphism
* Heavy gradients
* Neon colors
* Excessive shadows
* Overly rounded cartoon cards
* Decorative illustrations
* Marketing-style hero sections inside dashboard

## Color

### Brand Colors

Primary Navy `#0F172A`

Used for:

* Sidebar background
* Main heading text
* Strong UI anchor
* High-emphasis elements

Primary Blue `#2563EB`

Used for:

* Primary action buttons
* Active navigation item
* Links
* Selected filter
* Focus ring

Operational Cyan `#0891B2`

Used for:

* Monitoring info
* System health
* Queue status
* API response indicators

### Surface Colors

Page Background `#F8FAFC`

Used for:

* Main dashboard background

Card Surface `#FFFFFF`

Used for:

* Cards
* Tables
* Panels
* Forms
* Modals

Muted Surface `#F1F5F9`

Used for:

* Filter bars
* Empty states
* Secondary panels
* Table header background

Elevated Surface `#FFFFFF`

Used for:

* Dropdowns
* Popovers
* Floating panels

Dark Surface `#020617`

Used for:

* Optional dark monitoring panel
* Sidebar deep mode

### Text Colors

Text Strong `#0F172A`

Used for:

* Page titles
* Card titles
* Important values
* Table primary text

Text Default `#334155`

Used for:

* Body text
* Table content
* Form labels

Text Muted `#64748B`

Used for:

* Descriptions
* Helper text
* Metadata
* Empty states

Text Disabled `#94A3B8`

Used for:

* Disabled controls
* Inactive labels

Text Inverse `#FFFFFF`

Used for:

* Text on navy or blue surfaces

### Border Colors

Border Default `#E2E8F0`

Used for:

* Card borders
* Table lines
* Form input borders

Border Strong `#CBD5E1`

Used for:

* Active table rows
* Important separators
* Focus-adjacent panels

### Semantic Colors

Success Green `#16A34A`

Used for:

* Healthy system
* Completed job
* Successful transfer
* Stock available
* Report generated

Warning Amber `#D97706`

Used for:

* Low stock
* Pending transfer
* Slow response time
* Job waiting

Danger Red `#DC2626`

Used for:

* Critical stock
* Failed job
* Server error
* Transfer failed
* Unauthorized action

Info Blue `#2563EB`

Used for:

* General information
* New activity
* Processing state

Neutral Slate `#64748B`

Used for:

* Draft
* Archived
* Unknown state
* Inactive item

## Status Color Rules

Use color only when it communicates meaning.

### Stock Status

Available:

* Text: `#16A34A`
* Background: `#DCFCE7`
* Border: `#86EFAC`

Low Stock:

* Text: `#D97706`
* Background: `#FEF3C7`
* Border: `#FCD34D`

Critical Stock:

* Text: `#DC2626`
* Background: `#FEE2E2`
* Border: `#FCA5A5`

Out of Stock:

* Text: `#991B1B`
* Background: `#FEE2E2`
* Border: `#EF4444`

### Transfer Status

Draft:

* Text: `#64748B`
* Background: `#F1F5F9`

Pending:

* Text: `#D97706`
* Background: `#FEF3C7`

Approved:

* Text: `#2563EB`
* Background: `#DBEAFE`

Completed:

* Text: `#16A34A`
* Background: `#DCFCE7`

Cancelled:

* Text: `#64748B`
* Background: `#E2E8F0`

Failed:

* Text: `#DC2626`
* Background: `#FEE2E2`

### Job Status

Pending:

* Text: `#D97706`
* Background: `#FEF3C7`

Processing:

* Text: `#2563EB`
* Background: `#DBEAFE`

Completed:

* Text: `#16A34A`
* Background: `#DCFCE7`

Failed:

* Text: `#DC2626`
* Background: `#FEE2E2`

Cancelled:

* Text: `#64748B`
* Background: `#F1F5F9`

### System Health

Healthy:

* Use success green.

Degraded:

* Use warning amber.

Down:

* Use danger red.

Unknown:

* Use neutral slate.

## Typography

Use a modern dashboard font.

Recommended families:

* Primary: Inter or Plus Jakarta Sans
* Display: Inter or Plus Jakarta Sans
* Mono: JetBrains Mono for technical values only

Use one primary family for most UI. Do not make the dashboard look like a marketing page.

### Font Usage

Primary font:

* Body
* Tables
* Forms
* Buttons
* Sidebar
* Cards
* Tabs

Mono font:

* IDs
* SKU
* Job ID
* API latency
* Server metric value
* Queue key
* Log code

Do not use mono font for general content.

### Type Scale

Use these sizes consistently.

* `ts-xs` 12px for metadata, labels, table helper text
* `ts-sm` 14px for table rows, buttons, compact body
* `ts-base` 16px for normal body
* `ts-lg` 18px for card titles and section labels
* `ts-xl` 20px for panel headings
* `ts-2xl` 24px for page section heading
* `ts-3xl` 30px for page title
* `ts-4xl` 36px for large dashboard metric only

### Weights

* 400 for normal body
* 500 for labels and table headers
* 600 for card titles
* 700 for page titles and important metrics

Do not overuse bold text. Use spacing and hierarchy first.

## Layout

### App Shell

Use a dashboard shell layout.

Desktop layout:

```txt
Sidebar 260px
Topbar 64px
Main content fluid
```

Collapsed sidebar:

```txt
Sidebar 72px
Topbar 64px
Main content fluid
```

Mobile layout:

```txt
Topbar 56px
Bottom navigation or drawer sidebar
Main content full width
```

### Sidebar

Sidebar should be stable and easy to scan.

Recommended sections:

* Overview
* Inventory
* Operations
* Reports
* System

Recommended menu:

```txt
Dashboard
Products
Categories
Suppliers
Warehouses
Stock Movements
Stock In
Stock Out
Stock Adjustment
Transfers
Imports
Reports
Notifications
Audit Logs
Error Logs
Monitoring
Users
Settings
```

Rules:

* Show menu based on permission.
* Use clear icons.
* Do not use more than 1 active state at once.
* Group related menus.
* Keep labels short.
* Avoid nested menus deeper than 2 levels.

### Topbar

Topbar should contain:

* Page title or breadcrumb
* Search shortcut
* Notification icon
* Current warehouse context if needed
* User menu

Do not put too many buttons in the topbar.

### Main Content

Use consistent content width.

Recommended:

```txt
px-4 mobile
px-6 tablet
px-8 desktop
py-6 default
```

Dashboard pages can use full width.

Form pages should use a readable max width.

Recommended form width:

```txt
max-w-3xl
```

Tables and monitoring screens can be full width.

## Grid System

Use responsive dashboard grids.

### Dashboard Summary Cards

Desktop:

```txt
4 columns
```

Tablet:

```txt
2 columns
```

Mobile:

```txt
1 column
```

### Monitoring Panels

Desktop:

```txt
3 columns for small health cards
2 columns for charts and logs
```

Tablet:

```txt
2 columns
```

Mobile:

```txt
1 column
```

### Detail Pages

Use 2-column layout when useful.

Example:

```txt
Left: main data
Right: status, metadata, audit summary
```

Mobile should stack everything.

## Spacing

Base spacing unit is 4px.

Use Tailwind spacing scale.

### Default Spacing

* Page padding: `p-6` or `px-8 py-6`
* Card padding: `p-6`
* Dense card padding: `p-4`
* Table cell padding: `px-4 py-3`
* Filter bar gap: `gap-3`
* Form field gap: `gap-4`
* Section gap: `gap-6`
* Dashboard grid gap: `gap-6`

### Dense Data Screens

For data-heavy screens, use:

* `p-4` cards
* `gap-4` grids
* `ts-sm` table rows
* compact filters

Do not make monitoring pages too airy. The user needs density, but not clutter.

## Radius

Use practical radius.

* `rounded-md` for inputs, buttons, selects
* `rounded-lg` for table containers and filter bars
* `rounded-xl` for cards and panels
* `rounded-full` for badges, status dots, avatars

Avoid extremely large radius on data-heavy panels.

## Elevation

Keep shadows subtle.

* Cards: `shadow-sm`
* Floating dropdown: `shadow-md`
* Modal: `shadow-lg`
* Sticky topbar: use border first, shadow only if needed

Prefer borders over heavy shadows.

## Icons

Use simple line icons.

Recommended library:

* lucide-react

Rules:

* Icon size default: 18px
* Sidebar icon: 18px or 20px
* Button icon: 16px
* KPI card icon: 20px
* Empty state icon: 32px
* Status dot: 8px

Do not mix filled, outline, and 3D icons.

## Buttons

### Primary Button

Use for main action.

Examples:

* Tambah Produk
* Buat Transfer
* Import Data
* Generate Laporan

Style:

```txt
Blue background
White text
Medium weight
rounded-md
height 40px
```

### Secondary Button

Use for non-primary action.

Examples:

* Filter
* Lihat Detail
* Unduh Template

Style:

```txt
White background
Slate border
Slate text
rounded-md
height 40px
```

### Danger Button

Use for destructive action.

Examples:

* Hapus Produk
* Batalkan Transfer
* Rollback Import

Style:

```txt
Red background
White text
rounded-md
height 40px
```

### Ghost Button

Use for table row actions and icon actions.

Examples:

* More menu
* Mark as read
* Open detail

Style:

```txt
Transparent background
Hover muted surface
rounded-md
```

## Forms

Forms should be clear and safe.

Rules:

* Always use labels.
* Always show required fields.
* Always show validation errors near the field.
* Use helper text for risky input.
* Group related fields.
* Use confirmation for destructive action.
* Use disabled submit state during loading.

### Field Height

Recommended:

```txt
Input height: 40px
Textarea min height: 96px
Select height: 40px
```

### Custom form controls

Use reusable controls from @src/components/ui/field.tsx for dashboard forms.

Rules:

* Use `SelectInput` for role, status, warehouse, category, supplier, and other option lists.
* Use `DateInput` for date filters and date fields.
* Do not rely on browser-default select styling in primary dashboard forms.
* Keep field popovers inside the viewport.
* Keep mobile tap targets at least 44px high.

### Form Copy

Use direct labels:

* Nama Produk
* SKU
* Kategori
* Supplier
* Gudang
* Jumlah
* Harga Satuan
* Stok Minimum
* Catatan

Avoid vague labels:

* Data
* Info
* Detail
* Value

## Tables

Tables are central to SmartStock Pro.

Use tables for:

* Products
* Warehouses
* Suppliers
* Stock movements
* Transfers
* Imports
* Reports
* Audit logs
* Error logs
* Jobs

### Table Rules

* Always provide search when data can grow.
* Always provide pagination.
* Always provide sorting for important columns.
* Always provide filters for operational status.
* Keep row action in the last column.
* Use sticky header if table is long.
* Use horizontal scroll on mobile.
* Use empty state when no data exists.
* Use skeleton loading for initial load.

### Table Density

Default table:

```txt
row height 52px
cell padding px-4 py-3
text ts-sm
```

Dense table:

```txt
row height 44px
cell padding px-3 py-2
text ts-sm
```

Use dense table for logs and monitoring.

### Important Columns

Products:

```txt
SKU
Nama Produk
Kategori
Supplier
Total Stok
Stok Minimum
Status
Aksi
```

Warehouses:

```txt
Kode
Nama Gudang
Kota
Total Produk
Total Stok
Status
Aksi
```

Stock Movements:

```txt
Tanggal
Produk
Gudang
Tipe
Jumlah
Referensi
Dibuat Oleh
```

Transfers:

```txt
Nomor Transfer
Gudang Asal
Gudang Tujuan
Jumlah Item
Status
Dibuat Oleh
Tanggal
Aksi
```

Jobs:

```txt
Job ID
Tipe
Status
Progress
Dibuat Oleh
Waktu Mulai
Waktu Selesai
Aksi
```

Error Logs:

```txt
Tanggal
Module
Severity
Pesan
Status
Aksi
```

## Cards

Cards should show one clear idea.

### KPI Card

Use for:

* Total Produk
* Total Gudang
* Nilai Inventaris
* Stok Kritis
* Transfer Pending
* Job Gagal
* Response Time

KPI card structure:

```txt
Title
Main value
Small comparison or status
Icon or status dot
```

Rules:

* Do not put too much text.
* Use large number.
* Use small helper text.
* Use color only for status.
* Keep icon subtle.

### Monitoring Card

Use for:

* API Health
* Database
* Redis
* Worker
* CPU
* Memory
* Response Time

Monitoring card structure:

```txt
Service name
Status badge
Primary metric
Last checked time
Small description
```

Example copy:

```txt
Redis
Healthy
12 jobs waiting
Last checked 10:24
```

### Alert Card

Use for:

* Critical stock
* Low stock
* Failed transfer
* Worker down
* Import failed

Rules:

* Make severity obvious.
* Provide direct action.
* Keep copy short.
* Do not hide critical alerts inside long tables only.

## Charts

Use charts only when they help users understand trends.

Recommended library:

* Recharts

### Chart Types

Line chart:

* Stock movement trend
* Response time trend
* Daily transaction volume

Bar chart:

* Stock by warehouse
* Product quantity by category
* Transfer count by status

Pie or donut chart:

* Stock status distribution
* Transfer status distribution
* Job status distribution

Use pie charts sparingly.

### Chart Rules

* Always provide chart title.
* Always provide time range filter if relevant.
* Always show empty state.
* Always format numbers clearly.
* Avoid too many colors.
* Avoid 3D charts.
* Avoid chart legends with too many categories.
* Use tooltip for details.
* Use table if the chart makes the data harder to read.

### Chart Colors

Use consistent chart colors:

* Blue for normal activity
* Green for completed or healthy
* Amber for pending or warning
* Red for failed or critical
* Slate for neutral

## Dashboard Page

The dashboard is the main monitoring page.

### Dashboard Structure

Recommended order:

```txt
Page header
Summary KPI cards
Critical alerts
Stock movement chart
Warehouse stock overview
Recent stock movements
Transfer status summary
System health summary
```

### Dashboard KPI Cards

Required cards:

* Total Produk
* Total Gudang
* Total Stok
* Nilai Inventaris
* Stok Rendah
* Transfer Pending

Optional cards:

* Import Berjalan
* Job Gagal
* Response Time API
* Worker Aktif

### Dashboard Critical Alert Area

Show only important alerts:

* Stok kritis
* Transfer gagal
* Worker tidak aktif
* Redis down
* Database down
* Report gagal dibuat

Do not show every notification here.

## Monitoring Page

The monitoring page focuses on system health.

### Required Sections

System overview:

* API status
* Database status
* Redis status
* Worker status

Resource usage:

* CPU usage
* Memory usage
* Response time
* Uptime

Queue status:

* Import queue
* Report queue
* Alert queue
* Sync queue
* Notification queue

Recent errors:

* Critical errors
* Warning logs
* Failed jobs

### Monitoring Visual Style

Use compact cards and dense tables.

Recommended layout:

```txt
Top: health cards
Middle: response time and resource charts
Middle: queue status cards
Bottom: recent errors and failed jobs
```

### Monitoring Copy

Use clear status text:

* Healthy
* Degraded
* Down
* Processing
* Pending
* Failed
* Completed

Use Bahasa Indonesia in UI if the rest of the app is in Bahasa Indonesia:

* Sehat
* Menurun
* Bermasalah
* Diproses
* Menunggu
* Gagal
* Selesai

Choose one language and be consistent.

## Inventory Pages

Inventory pages must prioritize speed and accuracy.

### Product List

Must include:

* Search by SKU or product name
* Filter by category
* Filter by supplier
* Filter by stock status
* Sort by stock, name, or updated date
* Product image thumbnail
* Stock status badge

### Product Detail

Must include:

* Product information
* Current stock by warehouse
* Stock batch list
* Stock movement history
* Low-stock threshold
* Recent transfer activity

### Stock In Form

Must include:

* Product
* Warehouse
* Quantity
* Unit cost
* Received date
* Notes

### Stock Out Form

Must include:

* Product
* Warehouse
* Available stock
* Quantity
* FIFO preview if possible
* Notes

### Transfer Form

Must include:

* Source warehouse
* Destination warehouse
* Product selector
* Available stock
* Quantity
* Transfer summary
* Confirmation state

Warn the user if:

* Source warehouse equals destination warehouse
* Stock is insufficient
* Product is below minimum stock after transfer

## Import Pages

Import is a sensitive operation.

### Import Flow

Use stepper layout:

```txt
1. Upload File
2. Preview Data
3. Validate Rows
4. Execute Import
5. View Result
```

### Import UI Rules

* Show required CSV columns.
* Provide download template button.
* Show row-level errors.
* Show job progress.
* Show rollback action if supported.
* Never hide failed rows.
* Never say import succeeded if some rows failed.

### Import Status Copy

Use clear status:

* "File berhasil diunggah."
* "Data sedang divalidasi."
* "Import sedang diproses."
* "Import selesai dengan 12 data berhasil dan 3 data gagal."
* "Rollback import berhasil diproses."

## Reports Pages

Reports should feel official and export-ready.

### Report List

Show:

* Report name
* Type
* Date range
* Generated by
* Status
* Download action

### Report Generation Form

Fields:

* Report type
* Warehouse
* Product category
* Date range
* Output format

### PDF Report Style

PDF report should include:

* Logo
* Report title
* Generated date
* Generated by
* Filter summary
* Summary cards
* Table data
* Footer page number

Use simple layout. Do not overdesign PDF.

## Notification Design

Notifications should be useful, not noisy.

### Notification Types

* Low stock
* Critical stock
* Transfer update
* Import result
* Report result
* System health
* Error alert

### Notification Structure

```txt
Title
Short message
Severity
Time
Action link
Read state
```

### Notification Rules

* Critical notifications should be visually stronger.
* Read notifications should be quieter.
* Group similar notifications when possible.
* Do not use toast for every background job update.

## Audit Log Design

Audit logs need clarity and traceability.

### Audit Log Content

Show:

* Time
* User
* Action
* Entity type
* Entity name or ID
* IP address
* User agent if needed
* Detail action

### Audit UI Rules

* Use dense table.
* Provide filters.
* Keep values readable.
* Use monospace for IDs.
* Do not allow delete action from UI.

## Error Log Design

Error logs help troubleshooting.

### Error Log Content

Show:

* Severity
* Module
* Message
* Time
* Status
* Detail action

### Error Detail

Show:

* Message
* Stack trace if user has access
* Metadata
* Related job if available
* Resolution status

### Error UI Rules

* Critical errors must be visually obvious.
* Stack trace should be collapsible.
* Do not show stack traces to roles without permission.

## Empty States

Every page must have a useful empty state.

Good examples:

* "Belum ada produk. Tambahkan produk pertama untuk mulai mencatat stok."
* "Tidak ada transfer yang sesuai dengan filter."
* "Belum ada error tercatat."
* "Tidak ada job yang sedang berjalan."

Empty state should include action only when the user has permission.

## Loading States

Use skeleton loading for:

* Dashboard cards
* Tables
* Charts
* Detail pages

Use progress bar for:

* Import job
* Report generation
* Long-running queue jobs

Avoid full-screen loading unless the whole app is initializing.

## Error States

Error state must explain what happened and what the user can do.

Examples:

* "Data produk gagal dimuat. Coba muat ulang halaman."
* "Redis tidak dapat dihubungi. Job baru akan tertunda sampai koneksi pulih."
* "Transfer gagal karena stok gudang asal tidak mencukupi."

Always provide retry action when possible.

## Toasts

Use toast for immediate feedback only.

Use toast for:

* Create success
* Update success
* Delete success
* Transfer created
* Report job started
* Import job started

Do not use toast for:

* Critical system alerts only
* Long error details
* Complex import validation results

## Modals

Use modals for confirmation and focused short actions.

Use modal for:

* Delete confirmation
* Cancel transfer
* Rollback import
* Mark error as resolved

Do not use modal for:

* Large forms
* Long tables
* Import preview
* Report detail

## Accessibility

Accessibility is required.

Rules:

* Body text contrast must be at least 4.5:1.
* Focus ring must always be visible.
* Tap targets must be at least 44x44 on touch devices.
* Form fields must have labels.
* Error messages must be connected to fields.
* Icons must not be the only way to communicate status.
* Tables must have readable headers.
* Buttons must have clear text or accessible label.

## Responsiveness

Design mobile-first, but desktop is the main assessment target.

Breakpoints:

* `sm` 640px
* `md` 768px
* `lg` 1024px
* `xl` 1280px
* `2xl` 1536px

### Mobile Rules

* Sidebar becomes drawer.
* Tables can scroll horizontally.
* KPI cards stack vertically.
* Filter bar becomes collapsible.
* Topbar actions move into menu.
* Charts remain readable.
* Forms use single column.

### Desktop Rules

* Use sidebar layout.
* Use multi-column dashboard grid.
* Keep filters visible.
* Keep table actions accessible.
* Use full width for monitoring and logs.

## Copywriting

Use Bahasa Indonesia for UI copy.

Rules:

* No em dash.
* No filler.
* Short sentences.
* Active voice.
* Use operational words.
* Use consistent labels.
* Numbers use Indonesian format.
* Currency uses `Rp1.234.567`.

### Recommended Words

Use:

* Stok
* Gudang
* Produk
* Transfer
* Laporan
* Import
* Notifikasi
* Audit Log
* Error Log
* Monitoring
* Diproses
* Selesai
* Gagal
* Menunggu

Avoid mixing too many English words unless they are technical labels.

Choose one:

* "Error Log" or "Log Kesalahan"
* "Monitoring" or "Pemantauan"
* "Import" or "Impor"

For this project, recommended labels:

* Monitoring
* Error Log
* Audit Log
* Import
* Export

These are acceptable because they are common in dashboard systems.

## Data Formatting

### Date and Time

Use Indonesian format:

```txt
26 Mei 2026
26 Mei 2026, 14.30
```

For logs:

```txt
2026-05-26 14:30:22
```

### Currency

Use:

```txt
Rp1.234.567
```

### Numbers

Use:

```txt
1.250 produk
25.000 unit
```

### Percentage

Use:

```txt
87%
```

### Stock Quantity

Use:

```txt
120 unit
5 dus
12 pcs
```

Be consistent with unit values from product data.

## Component Naming

Use clear component names.

Recommended examples:

```txt
DashboardMetricCard
StockStatusBadge
TransferStatusBadge
JobStatusBadge
WarehouseMap
InventoryTable
StockMovementTable
MonitoringHealthCard
QueueStatusCard
ErrorLogTable
AuditLogTable
ImportStepper
ReportGenerationForm
```

Avoid vague names:

```txt
CardItem
DataBox
InfoThing
MainComponent
```

## Page SEO and Metadata

Even though this is dashboard software, pages still need clear titles.

Recommended title format:

```txt
Dashboard | SmartStock Pro
Products | SmartStock Pro
Transfers | SmartStock Pro
Monitoring | SmartStock Pro
```

Recommended meta description:

```txt
SmartStock Pro inventory management dashboard.
```

## Implementation Notes

Use Tailwind CSS for styling.

Use reusable UI components for:

* Button
* Input
* Select
* Badge
* Card
* Table
* Dialog
* Dropdown
* Tabs
* Toast
* Skeleton
* Progress
* Pagination

Use Recharts for charts.

Use Leaflet for warehouse maps.

Use React Query for API data fetching.

Use permission-aware navigation.

Use status badge components instead of rewriting badge styles everywhere.

Use constants for:

* Status colors
* Role labels
* Permission labels
* Queue names
* Movement types
* Transfer statuses
* Job statuses

## Do Not Do

Do not:

* Use marketplace visual style.
* Use playful colors.
* Use too many gradients.
* Use heavy shadows.
* Use charts without purpose.
* Put all data on one screen.
* Hide important alerts.
* Make stock editable as plain text.
* Use color as the only status indicator.
* Show buttons for actions the user cannot perform.
* Make monitoring look like a decorative page.
* Build a landing-page style dashboard.
* Overcrowd the sidebar.
* Use destructive action without confirmation.

## Design Goal

SmartStock Pro should feel like a serious inventory control dashboard.

The best version of the UI should make users quickly answer:

1. What is the current stock condition?
2. Which products are low or critical?
3. Which warehouses need attention?
4. What stock movements happened recently?
5. Which transfers are pending or failed?
6. Are import and report jobs running correctly?
7. Are API, database, Redis, and worker healthy?
8. Who changed important data?

If the design helps answer these questions quickly, the design is doing its job.

```
```
