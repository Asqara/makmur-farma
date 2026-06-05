"use client";

import {
  AlertTriangle,
  Bell,
  Check,
  Download,
  Eye,
  FileText,
  Info,
  Package,
  Pill,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import {
  ActionMenu,
  AlertCard,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  CriticalStockCard,
  DashboardMetricCard,
  DataTable,
  DataTableShell,
  DateInput,
  Dialog,
  EmptyState,
  ErrorState,
  ExpiryAlertCard,
  ExpiryStatusBadge,
  HealthStatusBadge,
  ImportStepper,
  JobStatusBadge,
  MedicineStatusBadge,
  MonitoringHealthCard,
  OrderStatusBadge,
  OrderTimeline,
  Pagination,
  PaymentStatusBadge,
  PermissionState,
  PrescriptionDocumentPlaceholder,
  PrescriptionQueueCard,
  PrescriptionStatusBadge,
  QueueStatusCard,
  RecentOrdersList,
  SelectInput,
  Skeleton,
  StockStatusBadge,
  StockSummary,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TextInput,
  TextareaInput,
  TransferStatusBadge,
} from "@/components/ui";

// Only available in development
if (
  typeof window !== "undefined" &&
  process.env.NODE_ENV === "production"
) {
  // Soft guard — remove the page from navigation in production
  // (no hard redirect needed — this is a dev tool)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="grid gap-4">
      <h2 className="ts-xl font-semibold text-text-strong border-b border-border-default pb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SubSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="grid gap-3">
      <h3 className="ts-sm font-semibold text-text-secondary uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </section>
  );
}

function TokenSwatch({
  className,
  label,
  value,
}: {
  className: string;
  label: string;
  value: string;
}) {
  return (
    <article className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`block size-10 shrink-0 rounded-lg border border-border-default ${className}`}
      />
      <section>
        <p className="ts-sm font-medium text-text-strong">{label}</p>
        <p className="ts-mono-xs text-text-muted">{value}</p>
      </section>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DesignSystemPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tabValue, setTabValue] = useState("overview");
  const [selectValue, setSelectValue] = useState("");
  const [dateValue, setDateValue] = useState("");

  return (
    <main className="grid gap-12 px-4 py-8 md:px-8 lg:px-12">
      <header className="grid gap-2">
        <h1 className="ts-4xl font-bold text-text-strong tracking-tight">
          Makmur Farma — Design System
        </h1>
        <p className="ts-base text-text-muted">
          Visual reference for all design tokens, components, and patterns.
          Development only.
        </p>
      </header>

      {/* ── 1. Colors ─────────────────────────────────────────────────── */}
      <Section title="1. Color Tokens">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SubSection title="Brand">
            <TokenSwatch className="bg-primary-blue" label="Primary Blue" value="#3366FF" />
            <TokenSwatch className="bg-primary-blue-soft" label="Primary Soft" value="#EAF0FF" />
            <TokenSwatch className="bg-accent-orange" label="Accent Orange" value="#FF8A00" />
          </SubSection>
          <SubSection title="Surfaces">
            <TokenSwatch className="bg-page-background" label="App Background" value="#F4F5FA" />
            <TokenSwatch className="bg-card-surface" label="Card Surface" value="#FFFFFF" />
            <TokenSwatch className="bg-muted-surface" label="Muted Surface" value="#F8F9FC" />
            <TokenSwatch className="bg-hover-surface" label="Hover Surface" value="#F6F8FD" />
            <TokenSwatch className="bg-selected-surface" label="Selected Surface" value="#EAF0FF" />
          </SubSection>
          <SubSection title="Semantic">
            <TokenSwatch className="bg-success" label="Success" value="#16A66A" />
            <TokenSwatch className="bg-warning" label="Warning" value="#F59E0B" />
            <TokenSwatch className="bg-danger" label="Danger" value="#E5484D" />
            <TokenSwatch className="bg-info" label="Info" value="#3B82F6" />
            <TokenSwatch className="bg-neutral" label="Neutral" value="#687084" />
          </SubSection>
        </div>
      </Section>

      {/* ── 2. Typography ─────────────────────────────────────────────── */}
      <Section title="2. Typography">
        <Card>
          <CardContent>
            <div className="grid gap-4">
              <div><p className="ts-4xl text-text-strong">Halaman Dashboard — ts-4xl 700</p></div>
              <div><p className="ts-3xl text-text-strong">Section Title — ts-3xl 700</p></div>
              <div><p className="ts-2xl text-text-strong">Panel Title — ts-2xl 700</p></div>
              <div><p className="ts-xl font-semibold text-text-strong">Card Title — ts-xl 600</p></div>
              <div><p className="ts-lg text-text-default">Body Large — ts-lg 400</p></div>
              <div><p className="ts-base text-text-default">Body — ts-base 400</p></div>
              <div><p className="ts-sm text-text-default">Body Small — ts-sm 400</p></div>
              <div><p className="ts-xs text-text-muted">Metadata — ts-xs 400</p></div>
              <div>
                <p className="ts-mono-sm text-text-muted">
                  ORD-20260605-00128 — ts-mono-sm
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ── 3. Buttons ────────────────────────────────────────────────── */}
      <Section title="3. Buttons">
        <SubSection title="Variants">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">
              <Plus aria-hidden="true" className="size-4" />
              Tambah Obat
            </Button>
            <Button variant="secondary">
              <Download aria-hidden="true" className="size-4" />
              Unduh Template
            </Button>
            <Button variant="soft">
              <Eye aria-hidden="true" className="size-4" />
              Lihat Detail
            </Button>
            <Button variant="ghost">
              <RefreshCw aria-hidden="true" className="size-4" />
              Muat Ulang
            </Button>
            <Button variant="danger">
              <Trash2 aria-hidden="true" className="size-4" />
              Hapus
            </Button>
          </div>
        </SubSection>
        <SubSection title="Sizes">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="secondary">Compact</Button>
            <Button size="default" variant="primary">Default</Button>
            <Button size="lg" variant="primary">Large CTA</Button>
            <Button aria-label="Tambah" size="icon" variant="secondary">
              <Plus />
            </Button>
          </div>
        </SubSection>
        <SubSection title="States">
          <div className="flex flex-wrap gap-3">
            <Button disabled variant="primary">Nonaktif</Button>
            <Button variant="primary">
              <RefreshCw aria-hidden="true" className="animate-spin size-4" />
              Menyimpan...
            </Button>
          </div>
        </SubSection>
      </Section>

      {/* ── 4. Badges ─────────────────────────────────────────────────── */}
      <Section title="4. Badges">
        <SubSection title="Base tones">
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">Netral</Badge>
            <Badge tone="primary">Utama</Badge>
            <Badge tone="success" showDot>Sukses</Badge>
            <Badge tone="warning" showDot>Peringatan</Badge>
            <Badge tone="danger" showDot>Bahaya</Badge>
            <Badge tone="info" showDot>Info</Badge>
          </div>
        </SubSection>
        <SubSection title="Domain — Medicine / Expiry / Prescription">
          <div className="flex flex-wrap gap-2">
            <StockStatusBadge status="available" />
            <StockStatusBadge status="low" />
            <StockStatusBadge status="critical" />
            <StockStatusBadge status="out" />
            <StockStatusBadge status="blocked" />
          </div>
          <div className="flex flex-wrap gap-2">
            <ExpiryStatusBadge status="safe" />
            <ExpiryStatusBadge status="approaching" />
            <ExpiryStatusBadge status="imminent" />
            <ExpiryStatusBadge status="expired" />
          </div>
          <div className="flex flex-wrap gap-2">
            <MedicineStatusBadge status="active" />
            <MedicineStatusBadge status="discontinued" />
            <MedicineStatusBadge status="pending_review" />
          </div>
          <div className="flex flex-wrap gap-2">
            <PrescriptionStatusBadge status="pending" />
            <PrescriptionStatusBadge status="reviewing" />
            <PrescriptionStatusBadge status="approved" />
            <PrescriptionStatusBadge status="rejected" />
            <PrescriptionStatusBadge status="needs_revision" />
          </div>
        </SubSection>
        <SubSection title="Domain — Order / Payment">
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status="DRAFT" />
            <OrderStatusBadge status="AWAITING_PRESCRIPTION" />
            <OrderStatusBadge status="PROCESSING" />
            <OrderStatusBadge status="READY_FOR_PICKUP" />
            <OrderStatusBadge status="COMPLETED" />
            <OrderStatusBadge status="CANCELLED" />
          </div>
          <div className="flex flex-wrap gap-2">
            <PaymentStatusBadge status="PENDING" />
            <PaymentStatusBadge status="SUCCESS" />
            <PaymentStatusBadge status="FAILED" />
            <PaymentStatusBadge status="EXPIRED" />
            <PaymentStatusBadge status="REFUNDED" />
          </div>
        </SubSection>
        <SubSection title="Domain — System / Jobs">
          <div className="flex flex-wrap gap-2">
            <HealthStatusBadge status="healthy" />
            <HealthStatusBadge status="degraded" />
            <HealthStatusBadge status="down" />
            <HealthStatusBadge status="unknown" />
          </div>
          <div className="flex flex-wrap gap-2">
            <JobStatusBadge status="idle" />
            <JobStatusBadge status="running" />
            <JobStatusBadge status="completed" />
            <JobStatusBadge status="failed" />
            <JobStatusBadge status="stalled" />
          </div>
          <div className="flex flex-wrap gap-2">
            <TransferStatusBadge status="DRAFT" />
            <TransferStatusBadge status="PENDING" />
            <TransferStatusBadge status="APPROVED" />
            <TransferStatusBadge status="COMPLETED" />
            <TransferStatusBadge status="FAILED" />
          </div>
        </SubSection>
      </Section>

      {/* ── 5. Cards ──────────────────────────────────────────────────── */}
      <Section title="5. Cards">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Judul Kartu</CardTitle>
              <CardDescription>Deskripsi singkat isi kartu</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="ts-sm text-text-default">
                Ini adalah konten utama kartu dashboard. Kartu menggunakan
                border tipis, bayangan halus, dan radius 10px.
              </p>
            </CardContent>
            <CardFooter>
              <ButtonLink href="#" size="sm" variant="ghost">
                Lihat semua
              </ButtonLink>
            </CardFooter>
          </Card>

          <DashboardMetricCard
            helperText="12 menunggu diproses"
            icon={<ShoppingCart />}
            title="Pesanan Hari Ini"
            tone="primary"
            value="128"
          />

          <DashboardMetricCard
            helperText="+20,8% dari kemarin"
            icon={<FileText />}
            title="Pendapatan Hari Ini"
            tone="success"
            value="Rp40.256.920"
          />
        </div>
      </Section>

      {/* ── 6. Form Inputs ────────────────────────────────────────────── */}
      <Section title="6. Form Inputs">
        <div className="grid gap-6 sm:grid-cols-2">
          <SubSection title="Text Input">
            <TextInput
              id="ds-search-medicine"
              label="Cari Obat"
              placeholder="Masukkan nama atau kode obat"
            />
            <TextInput
              errorMessage="Nama obat wajib diisi."
              id="ds-medicine-name-error"
              label="Nama Obat"
              placeholder="Paracetamol 500mg"
              required
            />
            <TextInput
              disabled
              id="ds-medicine-disabled"
              label="Kode Obat"
              placeholder="MED-001"
            />
          </SubSection>

          <SubSection title="Textarea">
            <TextareaInput
              helperText="Maksimum 500 karakter."
              id="ds-notes"
              label="Catatan Verifikasi"
              placeholder="Tulis catatan apoteker di sini..."
            />
          </SubSection>

          <SubSection title="Select">
            <SelectInput
              id="ds-category"
              label="Kategori"
              onValueChange={setSelectValue}
              options={[
                { label: "Obat Bebas", value: "otc" },
                { label: "Obat Keras", value: "rx" },
                { label: "Obat Bebas Terbatas", value: "otc-limited" },
                { label: "Suplemen", value: "supplement" },
              ]}
              placeholder="Pilih kategori"
              searchable
              value={selectValue}
            />
          </SubSection>

          <SubSection title="Date Picker">
            <DateInput
              id="ds-expiry-date"
              label="Tanggal Kedaluwarsa"
              mode="single"
              onValueChange={setDateValue}
              value={dateValue}
            />
            <DateInput
              id="ds-date-range"
              label="Rentang Tanggal Laporan"
              mode="range"
            />
          </SubSection>
        </div>
      </Section>

      {/* ── 7. Table ──────────────────────────────────────────────────── */}
      <Section title="7. Table">
        <DataTableShell
          description="Daftar obat yang terdaftar dalam sistem."
          footer={
            <Pagination
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              pageCount={12}
            />
          }
          title="Daftar Obat"
          toolbar={
            <div className="flex flex-wrap items-center gap-3">
              <TextInput
                id="ds-table-search"
                label=""
                placeholder="Cari nama atau kode obat"
              />
              <Button size="sm" variant="secondary">Filter</Button>
            </div>
          }
        >
          <DataTable>
            <TableCaption>Menampilkan 1–5 dari 248 data</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Obat</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Total Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { cat: "Obat Keras", id: "1", name: "Amoxicillin 500mg", qty: "1.200 tablet", status: "available" as const },
                { cat: "Obat Bebas", id: "2", name: "Paracetamol 500mg", qty: "350 tablet", status: "low" as const },
                { cat: "Obat Keras", id: "3", name: "Amlodipine 5mg", qty: "0 tablet", status: "out" as const },
                { cat: "Suplemen", id: "4", name: "Vitamin C 500mg", qty: "2.400 tablet", status: "available" as const },
                { cat: "Obat Bebas", id: "5", name: "Antasida Doen", qty: "45 tablet", status: "critical" as const },
              ].map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-text-strong">
                    {row.name}
                  </TableCell>
                  <TableCell className="text-text-muted">{row.cat}</TableCell>
                  <TableCell className="ts-mono-sm tabular-nums">
                    {row.qty}
                  </TableCell>
                  <TableCell>
                    <StockStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>
                    <ActionMenu
                      items={[
                        { icon: <Eye />, label: "Lihat Detail", href: "#" },
                        { icon: <Trash2 />, label: "Hapus", onSelect: () => {} },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </DataTableShell>
      </Section>

      {/* ── 8. Pagination ─────────────────────────────────────────────── */}
      <Section title="8. Pagination">
        <Card>
          <CardContent>
            <Pagination
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              pageCount={12}
            />
            <p className="ts-xs mt-3 text-text-muted">
              Halaman {currentPage} dari 12 — Menampilkan{" "}
              {(currentPage - 1) * 20 + 1}–{Math.min(currentPage * 20, 248)} dari 248 data
            </p>
          </CardContent>
        </Card>
      </Section>

      {/* ── 9. Tabs ───────────────────────────────────────────────────── */}
      <Section title="9. Tabs">
        <Tabs
          items={[
            {
              label: "Ringkasan",
              panel: (
                <Card>
                  <CardContent>
                    <p className="ts-sm text-text-default">
                      Ini adalah panel Ringkasan. Gunakan tabs untuk
                      mengelompokkan konten detail pesanan, resep, pembayaran,
                      dan riwayat status.
                    </p>
                  </CardContent>
                </Card>
              ),
              value: "overview",
            },
            {
              label: "Pembayaran",
              panel: (
                <Card>
                  <CardContent>
                    <p className="ts-sm text-text-default">
                      Panel Pembayaran.
                    </p>
                  </CardContent>
                </Card>
              ),
              value: "payment",
            },
            {
              label: "Resep",
              panel: (
                <Card>
                  <CardContent>
                    <p className="ts-sm text-text-default">Panel Resep.</p>
                  </CardContent>
                </Card>
              ),
              value: "prescription",
            },
            {
              disabled: true,
              label: "Audit",
              panel: null,
              value: "audit",
            },
          ]}
          onValueChange={setTabValue}
          value={tabValue}
        />
      </Section>

      {/* ── 10. States ────────────────────────────────────────────────── */}
      <Section title="10. Feedback States">
        <SubSection title="Empty State">
          <EmptyState
            actionLabel="Tambah Obat"
            description="Belum ada obat yang terdaftar. Tambahkan obat pertama untuk mulai mengelola stok."
            icon={<Pill />}
            onAction={() => {}}
            title="Belum ada obat"
          />
        </SubSection>

        <SubSection title="Error State">
          <ErrorState
            description="Data pesanan gagal dimuat. Coba muat ulang halaman. Filter yang dipilih tetap disimpan."
            onRetry={() => {}}
            title="Data gagal dimuat"
          />
        </SubSection>

        <SubSection title="Permission State">
          <PermissionState backHref="#" />
        </SubSection>
      </Section>

      {/* ── 11. Skeletons ─────────────────────────────────────────────── */}
      <Section title="11. Skeletons">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i}>
              <CardContent className="grid gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── 12. Dialogs ───────────────────────────────────────────────── */}
      <Section title="12. Dialogs">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setDialogOpen(true)} variant="secondary">
            Buka Dialog
          </Button>
          <Button
            onClick={() => setConfirmOpen(true)}
            variant="danger"
          >
            Dialog Konfirmasi Hapus
          </Button>
        </div>

        <Dialog
          description="Form ini digunakan untuk menambahkan obat baru ke dalam sistem."
          footer={
            <>
              <Button onClick={() => setDialogOpen(false)} variant="secondary">
                Batal
              </Button>
              <Button onClick={() => setDialogOpen(false)} variant="primary">
                Simpan Obat
              </Button>
            </>
          }
          id="ds-dialog"
          onClose={() => setDialogOpen(false)}
          open={dialogOpen}
          title="Tambah Obat Baru"
        >
          <TextInput
            id="ds-dialog-name"
            label="Nama Obat"
            placeholder="Masukkan nama obat"
            required
          />
          <TextInput
            id="ds-dialog-code"
            label="Kode Obat"
            placeholder="MED-001"
          />
        </Dialog>

        <ConfirmDialog
          confirmLabel="Hapus Obat"
          description="Tindakan ini tidak dapat dibatalkan. Data obat dan seluruh batch yang terkait akan dihapus dari sistem."
          id="ds-confirm-dialog"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => setConfirmOpen(false)}
          open={confirmOpen}
          title="Hapus Obat?"
          variant="danger"
        />
      </Section>

      {/* ── 13. Alert Cards ───────────────────────────────────────────── */}
      <Section title="13. Alert Cards">
        <div className="grid gap-3">
          <AlertCard
            actionLabel="Tambah Stok"
            message="Stok Amoxicillin 500mg berada di bawah batas minimum (50 tablet)."
            onAction={() => {}}
            severity="critical"
            title="Stok Kritis"
          />
          <AlertCard
            message="6 batch obat akan kedaluwarsa dalam 30 hari ke depan."
            severity="warning"
            title="Obat Mendekati Kedaluwarsa"
          />
          <AlertCard
            message="Laporan penjualan Juni 2026 telah selesai dibuat."
            severity="success"
            title="Laporan Selesai"
          />
        </div>
      </Section>

      {/* ── 14. Monitoring Cards ──────────────────────────────────────── */}
      <Section title="14. Monitoring Cards">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MonitoringHealthCard
            description="Semua query berjalan normal"
            icon={<Package />}
            lastChecked="Diperbarui 10 detik lalu"
            metric="12ms"
            serviceName="PostgreSQL"
            status="healthy"
          />
          <MonitoringHealthCard
            icon={<RefreshCw />}
            lastChecked="Diperbarui 10 detik lalu"
            metric="2ms"
            serviceName="Redis"
            status="healthy"
          />
          <MonitoringHealthCard
            description="Worker tidak merespons"
            icon={<Bell />}
            lastChecked="Diperbarui 30 detik lalu"
            metric="—"
            serviceName="Worker"
            status="down"
          />
          <QueueStatusCard
            queueName="Antrean Notifikasi"
            status="running"
            waitingCount={3}
          />
        </div>
      </Section>

      {/* ── 15. Import Stepper ────────────────────────────────────────── */}
      <Section title="15. Import Stepper">
        <ImportStepper
          steps={[
            { status: "completed", title: "Unggah File" },
            { status: "completed", title: "Petakan Kolom" },
            { status: "current", title: "Validasi", description: "248 baris valid, 3 peringatan" },
            { status: "pending", title: "Konfirmasi" },
            { status: "pending", title: "Proses" },
            { status: "pending", title: "Hasil" },
          ]}
        />
      </Section>

      {/* ── 16. Domain Cards ──────────────────────────────────────────── */}
      <Section title="16. Domain Cards">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PrescriptionQueueCard
            oldestAgeMinutes={145}
            reviewHref="#"
            totalPending={7}
          />

          <CriticalStockCard
            items={[
              { currentQty: 12, id: "1", medicineName: "Amoxicillin 500mg", minThreshold: 50, unit: "tablet" },
              { currentQty: 0, id: "2", medicineName: "Amlodipine 5mg", minThreshold: 30, unit: "tablet" },
              { currentQty: 5, id: "3", medicineName: "Antasida Doen", minThreshold: 20, unit: "tablet" },
            ]}
            viewAllHref="#"
          />

          <ExpiryAlertCard
            items={[
              { batchNumber: "BATCH-PCT-260601", daysRemaining: 3, expiryDate: "8 Jun 2026", id: "1", medicineName: "Paracetamol 500mg", quantity: 200, unit: "tablet" },
              { batchNumber: "BATCH-AMX-260610", daysRemaining: 12, expiryDate: "17 Jun 2026", id: "2", medicineName: "Amoxicillin 500mg", quantity: 100, unit: "tablet" },
             ]}
            viewAllHref="#"
          />
        </div>

        <RecentOrdersList
          items={[
            { customerName: "Budi Santoso", id: "1", orderNumber: "ORD-20260605-00128", status: "PROCESSING", time: "5 menit lalu", total: "Rp85.000" },
            { customerName: "Siti Rahayu", id: "2", orderNumber: "ORD-20260605-00127", status: "COMPLETED", time: "18 menit lalu", total: "Rp42.000" },
            { customerName: "Agus Widodo", id: "3", orderNumber: "ORD-20260605-00126", status: "AWAITING_PAYMENT", time: "32 menit lalu", total: "Rp120.000" },
          ]}
          viewAllHref="#"
        />
      </Section>

      {/* ── 17. Order Timeline ────────────────────────────────────────── */}
      <Section title="17. Order Timeline">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Status ORD-20260605-00128</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline
                events={[
                  { actor: "Sistem", id: "1", label: "Pesanan dibuat", status: "completed", time: "05 Jun 2026, 09.15" },
                  { actor: "Kasir: Dewi", id: "2", label: "Pembayaran dikonfirmasi", note: "Transfer BCA dikonfirmasi.", status: "completed", time: "05 Jun 2026, 09.20" },
                  { actor: "Apoteker: Dr. Sari", id: "3", label: "Pesanan diproses", status: "current", time: "05 Jun 2026, 09.22" },
                  { id: "4", label: "Siap diambil", status: "pending" },
                  { id: "5", label: "Selesai", status: "pending" },
                ]}
              />
            </CardContent>
          </Card>

          <section className="grid gap-4">
            <StockSummary
              available={980}
              nearestExpiry="8 Jun 2026"
              reserved={20}
              threshold={50}
              total={1000}
              unit="tablet"
            />
            <PrescriptionDocumentPlaceholder
              fileName="resep_20260605_001.pdf"
              fileSize="1.2 MB"
              pageCount={1}
            />
          </section>
        </div>
      </Section>

      {/* ── 18. Search in toolbar (not topbar) ────────────────────────── */}
      <Section title="18. Search — Toolbar Pattern">
        <p className="ts-sm text-text-muted">
          Search selalu ada di toolbar halaman, bukan di topbar. Placeholder
          harus spesifik sesuai konteks.
        </p>
        <div className="flex flex-wrap gap-4">
          {[
            "Cari nama atau kode obat",
            "Cari nomor pesanan",
            "Cari nama pelanggan",
            "Cari nomor resep",
            "Cari nomor batch",
          ].map((placeholder) => (
            <div className="relative" key={placeholder}>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              />
              <input
                className="ts-sm h-10 w-64 rounded-lg border border-border-strong bg-card-surface pl-9 pr-3 text-text-strong placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder={placeholder}
                type="search"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* ── 19. Topbar (no search) ─────────────────────────────────────── */}
      <Section title="19. Topbar — No Search">
        <Card>
          <CardContent>
            <header className="flex h-[68px] items-center justify-between rounded-lg border border-border-default bg-card-surface px-5">
              <section className="flex items-center gap-2 text-text-muted">
                <span className="ts-sm font-medium text-text-default">
                  Dashboard / Pesanan
                </span>
              </section>
              <section className="flex items-center gap-2">
                <Button aria-label="Notifikasi" size="icon" variant="secondary">
                  <Bell aria-hidden="true" className="size-4" />
                </Button>
                <Button aria-label="Info" size="icon" variant="ghost">
                  <Info aria-hidden="true" className="size-4" />
                </Button>
                <span className="flex items-center gap-2 rounded-lg border border-border-default px-3 py-2">
                  <span className="grid size-7 place-items-center rounded-full bg-primary-blue-soft ts-xs font-semibold text-primary-blue">
                    AR
                  </span>
                  <section>
                    <p className="ts-xs font-medium text-text-strong">Admin Reza</p>
                    <p className="ts-xs text-text-muted">Admin</p>
                  </section>
                </span>
              </section>
            </header>
            <p className="ts-xs mt-3 text-success flex items-center gap-1.5">
              <Check aria-hidden="true" className="size-3.5" />
              Topbar tidak mengandung kolom pencarian.
            </p>
          </CardContent>
        </Card>
      </Section>

      {/* ── 20. Sidebar preview ───────────────────────────────────────── */}
      <Section title="20. Sidebar Preview">
        <p className="ts-sm text-text-muted">
          Sidebar menggunakan background putih, border kanan tipis, item aktif
          pale-blue, dan group label uppercase kecil. Pada mobile sidebar
          menjadi drawer. Lihat layout shell di{" "}
          <a className="text-primary-blue underline" href="/dashboard">
            /dashboard
          </a>{" "}
          untuk preview penuh.
        </p>
        <div className="overflow-hidden rounded-xl border border-border-default">
          <aside className="flex w-60 flex-col bg-sidebar-surface border-r border-sidebar-border py-4 h-96">
            <div className="px-4 pb-3 border-b border-sidebar-border mb-3">
              <p className="ts-sm font-bold text-text-strong">Makmur Farma</p>
            </div>
            <nav className="flex flex-col gap-4 px-2 flex-1 overflow-y-auto">
              <section className="grid gap-0.5">
                <a className="ts-sm flex items-center gap-2.5 min-h-10 rounded-lg px-3 font-semibold bg-sidebar-active-bg text-sidebar-active-text" href="#">
                  <span aria-hidden="true" className="inline-flex [&>svg]:size-[18px]"><AlertTriangle /></span>
                  Dashboard
                </a>
              </section>
              <section className="grid gap-0.5">
                <p className="ts-xs mb-1 px-3 font-semibold uppercase tracking-widest text-sidebar-group-label">PENJUALAN</p>
                {["Pesanan", "Penjualan Kasir", "Pembayaran"].map((item) => (
                  <a className="ts-sm flex items-center gap-2.5 min-h-10 rounded-lg px-3 font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-text-strong" href="#" key={item}>
                    {item}
                  </a>
                ))}
              </section>
              <section className="grid gap-0.5">
                <p className="ts-xs mb-1 px-3 font-semibold uppercase tracking-widest text-sidebar-group-label">FARMASI</p>
                {["Obat", "Kategori Obat", "Resep"].map((item) => (
                  <a className="ts-sm flex items-center gap-2.5 min-h-10 rounded-lg px-3 font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-text-strong" href="#" key={item}>
                    {item}
                  </a>
                ))}
              </section>
            </nav>
          </aside>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-border-default pt-6 text-center">
        <p className="ts-xs text-text-muted">
          Makmur Farma Design System · Development Preview · {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
}
