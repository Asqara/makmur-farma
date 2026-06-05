"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";

import {
  Card,
  CardContent,
  DataTable,
  DataTableShell,
  EmptyState,
  ErrorState,
  Skeleton,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
} from "@/components/ui";
import { USER_STATUS_LABELS, type UserStatus } from "@/constants/auth";
import { eden } from "@/lib/eden";
import { formatDateTime } from "@/utils/inventoryDisplay";

type CustomersResponse = {
  data: Array<{
    createdAt: Date | string;
    emailMasked: string;
    emailVerifiedAt: Date | string | null;
    id: string;
    name: string;
    phone: string | null;
    status: UserStatus;
  }>;
};

const statusTone: Record<UserStatus, "danger" | "neutral" | "success" | "warning"> = {
  ACTIVE: "success",
  DISABLED: "neutral",
  PENDING_VERIFICATION: "warning",
  SUSPENDED: "danger",
};

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.customers.get({
        query: {
          limit: "30",
          page: "1",
          search,
          sortBy: "createdAt",
          sortDir: "desc",
        },
      });

      if (response.error) throw response.error;

      return response.data as CustomersResponse;
    },
    queryKey: ["customers", search],
  });

  return (
    <DataTableShell
      description="Data pelanggan ditampilkan seperlunya. Email lengkap hanya tersedia pada detail untuk role yang berwenang."
      title="Pelanggan"
      toolbar={
        <section className="grid gap-3 md:grid-cols-[minmax(0,320px)_auto] md:items-end">
          <TextInput
            id="customer-search"
            label="Cari Pelanggan"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama, email, atau telepon"
            value={search}
          />
          <section className="flex min-h-10 items-center gap-2 text-text-muted">
            <Search aria-hidden="true" className="size-4" />
            <span className="ts-sm">Search diproses server-side.</span>
          </section>
        </section>
      }
    >
      {query.isLoading ? (
        <section className="grid gap-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-64" />
        </section>
      ) : query.isError ? (
        <ErrorState
          actionLabel="Coba Lagi"
          description="Daftar pelanggan gagal dimuat."
          onRetry={() => query.refetch()}
          title="Pelanggan Tidak Tersedia"
        />
      ) : query.data?.data.length ? (
        <Card>
          <CardContent>
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verifikasi</TableHead>
                  <TableHead>Terdaftar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.data.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium text-text-strong">
                      {customer.name}
                    </TableCell>
                    <TableCell>{customer.emailMasked}</TableCell>
                    <TableCell>{customer.phone ?? "-"}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={USER_STATUS_LABELS[customer.status]}
                        tone={statusTone[customer.status]}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={customer.emailVerifiedAt ? "Terverifikasi" : "Belum"}
                        tone={customer.emailVerifiedAt ? "success" : "warning"}
                      />
                    </TableCell>
                    <TableCell>{formatDateTime(customer.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          description={
            query.isLoading
              ? "Memuat pelanggan..."
              : "Belum ada pelanggan yang cocok dengan filter saat ini."
          }
          title={query.isLoading ? "Memuat" : "Pelanggan Kosong"}
        />
      )}
    </DataTableShell>
  );
}
