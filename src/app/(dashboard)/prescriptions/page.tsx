"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Eye, Loader2 } from "lucide-react";
import { useState } from "react";

import {
  ActionMenu,
  Button,
  Card,
  CardContent,
  DataTable,
  DataTableShell,
  Dialog,
  EmptyState,
  ErrorState,
  OrderStatusBadge,
  Pagination,
  SelectInput,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextareaInput,
  toast,
} from "@/components/ui";
import {
  PRESCRIPTION_STATUS_LABELS,
  PRESCRIPTION_STATUS_TONES,
  type OrderStatus,
  type PrescriptionStatus,
} from "@/constants/domain";
import { eden } from "@/lib/eden";
import { formatDateTime } from "@/utils/inventoryDisplay";

type PrescriptionDecision = "APPROVED" | "NEEDS_REVISION" | "REJECTED";

type ReviewTarget = {
  customerName: string | null;
  decision: PrescriptionDecision | "";
  fileName: string;
  id: string;
  notes: string;
  orderNumber: string;
} | null;

type PrescriptionsResponse = {
  data: Array<{
    customer: {
      email: string | null;
      name: string | null;
    };
    id: string;
    order: {
      orderNumber: string;
      status: OrderStatus;
    };
    originalFileName: string;
    status: PrescriptionStatus;
    submittedAt: Date | string;
  }>;
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
};

const PAGE_SIZE = 30;

const DECISION_OPTIONS = [
  { label: "Disetujui", value: "APPROVED" as PrescriptionDecision },
  { label: "Ditolak", value: "REJECTED" as PrescriptionDecision },
  {
    label: "Perlu Perbaikan",
    value: "NEEDS_REVISION" as PrescriptionDecision,
  },
];

function notesRequired(decision: PrescriptionDecision | ""): boolean {
  return decision === "REJECTED" || decision === "NEEDS_REVISION";
}

export default function PrescriptionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget>(null);

  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.prescriptions.get({
        query: {
          limit: String(PAGE_SIZE),
          page: String(page),
          sortBy: "submittedAt",
          sortDir: "desc",
        },
      });

      if (response.error) throw response.error;

      return response.data as PrescriptionsResponse;
    },
    queryKey: ["prescriptions", page],
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      decision,
      notes,
    }: {
      decision: PrescriptionDecision;
      id: string;
      notes: string;
    }) => {
      const response = await eden.api.v1.prescriptions({ id }).review.post({
        approvedItems: [],
        decision,
        notes,
      });

      if (response.error) throw response.error;

      return response.data;
    },
    onError: () => {
      toast.error("Keputusan tinjauan resep gagal disimpan. Coba lagi.");
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      setReviewTarget(null);

      const decisionLabel =
        variables.decision === "APPROVED"
          ? "Disetujui"
          : variables.decision === "REJECTED"
            ? "Ditolak"
            : "Perlu Perbaikan";

      toast.success(`Resep berhasil ditinjau: ${decisionLabel}.`);
    },
  });

  const reviewFormValid =
    reviewTarget !== null &&
    reviewTarget.decision !== "" &&
    (!notesRequired(reviewTarget.decision) ||
      reviewTarget.notes.trim().length >= 5);

  return (
    <DataTableShell
      description="File resep asli tetap immutable; keputusan apoteker disimpan terpisah."
      footer={
        query.data?.pagination ? (
          <section className="flex flex-wrap items-center justify-between gap-3">
            <p className="ts-sm text-text-muted">
              {query.data.pagination.total} resep ditemukan
            </p>
            <Pagination
              currentPage={page}
              onPageChange={setPage}
              pageCount={Math.max(query.data.pagination.totalPages, 1)}
            />
          </section>
        ) : null
      }
      title="Resep"
    >
      {query.isError ? (
        <ErrorState
          description="Daftar resep gagal dimuat."
          onRetry={() => query.refetch()}
          title="Resep Tidak Tersedia"
        />
      ) : query.data?.data.length ? (
        <Card>
          <CardContent>
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Pesanan</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status Resep</TableHead>
                  <TableHead>Status Order</TableHead>
                  <TableHead>Dikirim</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.data.map((prescription) => {
                  const canReview = ["PENDING", "IN_REVIEW"].includes(
                    prescription.status,
                  );

                  return (
                    <TableRow key={prescription.id}>
                      <TableCell className="font-mono">
                        {prescription.order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-text-strong">
                          {prescription.customer.name ?? "-"}
                        </p>
                        <p className="ts-xs text-text-muted">
                          {prescription.customer.email ?? "-"}
                        </p>
                      </TableCell>
                      <TableCell>{prescription.originalFileName}</TableCell>
                      <TableCell>
                        <StatusBadge
                          label={PRESCRIPTION_STATUS_LABELS[prescription.status]}
                          tone={PRESCRIPTION_STATUS_TONES[prescription.status]}
                        />
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={prescription.order.status} />
                      </TableCell>
                      <TableCell>
                        {formatDateTime(prescription.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <ActionMenu
                          items={[
                            {
                              href: `/prescriptions/${prescription.id}`,
                              icon: <Eye />,
                              label: "Lihat Resep",
                            },
                            {
                              disabled: !canReview,
                              icon: <ClipboardCheck />,
                              label: "Tinjau dan Putuskan",
                              onSelect: canReview
                                ? () =>
                                    setReviewTarget({
                                      customerName:
                                        prescription.customer.name,
                                      decision: "",
                                      fileName: prescription.originalFileName,
                                      id: prescription.id,
                                      notes: "",
                                      orderNumber:
                                        prescription.order.orderNumber,
                                    })
                                : undefined,
                            },
                          ]}
                          label={`Aksi untuk resep ${prescription.order.orderNumber}`}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </DataTable>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          description={
            query.isLoading
              ? "Memuat resep..."
              : "Belum ada resep menunggu verifikasi."
          }
          title={query.isLoading ? "Memuat" : "Resep Kosong"}
        />
      )}

      {/* Prescription review dialog */}
      <Dialog
        description={
          reviewTarget
            ? `Pesanan ${reviewTarget.orderNumber} — ${reviewTarget.fileName}`
            : undefined
        }
        footer={
          <>
            <Button
              disabled={reviewMutation.isPending}
              onClick={() => {
                setReviewTarget(null);
                reviewMutation.reset();
              }}
              variant="secondary"
            >
              Batal
            </Button>
            <Button
              disabled={!reviewFormValid || reviewMutation.isPending}
              leftIcon={
                reviewMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : undefined
              }
              onClick={() => {
                if (!reviewTarget || reviewTarget.decision === "") return;

                reviewMutation.mutate({
                  decision: reviewTarget.decision,
                  id: reviewTarget.id,
                  notes: reviewTarget.notes,
                });
              }}
              variant="primary"
            >
              Simpan Keputusan
            </Button>
          </>
        }
        id="prescription-review-dialog"
        onClose={() => {
          setReviewTarget(null);
          reviewMutation.reset();
        }}
        open={reviewTarget !== null}
        title="Tinjau Resep"
      >
        {reviewTarget && (
          <section className="grid gap-4">
            <SelectInput
              id="review-decision"
              label="Keputusan"
              onValueChange={(value) =>
                setReviewTarget((prev) =>
                  prev
                    ? { ...prev, decision: value as PrescriptionDecision }
                    : null,
                )
              }
              options={DECISION_OPTIONS}
              placeholder="Pilih keputusan..."
              required
              value={reviewTarget.decision}
            />
            <TextareaInput
              helperText={
                notesRequired(reviewTarget.decision)
                  ? "Wajib diisi minimal 5 karakter untuk keputusan Ditolak atau Perlu Perbaikan."
                  : "Opsional untuk keputusan Disetujui."
              }
              id="review-notes"
              label="Catatan Tinjauan"
              onChange={(e) =>
                setReviewTarget((prev) =>
                  prev ? { ...prev, notes: e.target.value } : null,
                )
              }
              placeholder="Tulis catatan tinjauan apoteker..."
              required={notesRequired(reviewTarget.decision)}
              rows={4}
              value={reviewTarget.notes}
            />
            {reviewMutation.isError && (
              <p className="ts-sm text-danger">
                Keputusan gagal disimpan. Pastikan koneksi stabil dan coba
                lagi.
              </p>
            )}
          </section>
        )}
      </Dialog>
    </DataTableShell>
  );
}
