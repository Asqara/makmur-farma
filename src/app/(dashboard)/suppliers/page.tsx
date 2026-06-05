"use client";

import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  DataTable,
  DataTableShell,
  EmptyState,
  ErrorState,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { eden } from "@/lib/eden";

type SupplierResponse = {
  data: Array<{
    code: string;
    contactName: string | null;
    email: string | null;
    id: string;
    isActive: boolean;
    name: string;
    phone: string | null;
  }>;
};

export default function SuppliersPage() {
  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.suppliers.get({
        query: { limit: "50", page: "1", sortBy: "name", sortDir: "asc" },
      });

      if (response.error) throw response.error;

      return response.data as SupplierResponse;
    },
    queryKey: ["suppliers"],
  });

  return (
    <DataTableShell
      description="Supplier digunakan pada batch penerimaan dan audit stok."
      title="Supplier"
    >
      {query.isError ? (
        <ErrorState
          description="Supplier gagal dimuat."
          onRetry={() => query.refetch()}
          title="Supplier Tidak Tersedia"
        />
      ) : query.data?.data.length ? (
        <Card>
          <CardContent>
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.data.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-mono">{supplier.code}</TableCell>
                    <TableCell className="font-medium text-text-strong">
                      {supplier.name}
                    </TableCell>
                    <TableCell>{supplier.contactName ?? supplier.phone ?? "-"}</TableCell>
                    <TableCell>{supplier.email ?? "-"}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={supplier.isActive ? "Aktif" : "Nonaktif"}
                        tone={supplier.isActive ? "success" : "neutral"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          description={query.isLoading ? "Memuat supplier..." : "Belum ada supplier."}
          title={query.isLoading ? "Memuat" : "Supplier Kosong"}
        />
      )}
    </DataTableShell>
  );
}
