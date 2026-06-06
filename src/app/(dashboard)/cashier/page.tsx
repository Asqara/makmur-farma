"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Receipt, Search, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTableShell,
  EmptyState,
  SelectInput,
  type SelectInputOption,
  toast,
} from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { eden } from "@/lib/eden";
import { formatRp } from "@/utils/formatRp";
import { mc } from "@/utils/mc";

type MedicineSearchRow = {
  id: string;
  name: string;
  code: string;
  unit: string;
  sellingPrice: string;
  prescriptionRequired: boolean;
};

type CustomerSearchRow = {
  id: string;
  name: string;
  phone: string | null;
};

type CashierItem = {
  medicineId: string;
  name: string;
  price: number;
  quantity: number;
  prescriptionRequired: boolean;
  unit: string;
};

const PAYMENT_METHODS: SelectInputOption[] = [
  { label: "Tunai (Cash)", value: "CASH" },
  { label: "Transfer Bank", value: "BANK_TRANSFER" },
  { label: "QRIS", value: "QRIS" },
];

/**
 * Cashier POS / Counter Sales page (Phase 11).
 */
export default function CashierPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm.trim(), 300);
  const debouncedCustomerSearch = useDebounce(customerSearch.trim(), 300);
  const [items, setItems] = useState<CashierItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  // Medicine search
  const medicineQuery = useQuery({
    enabled: debouncedSearchTerm.length >= 2,
    queryFn: async () => {
      const response = await eden.api.v1.medicines.get({
        query: {
          limit: "10",
          page: "1",
          search: debouncedSearchTerm,
          status: "ACTIVE",
        },
      });
      if (response.error) throw response.error;
      return response.data;
    },
    queryKey: ["medicines", "search", debouncedSearchTerm],
  });

  // Customer search
  const customerQuery = useQuery({
    enabled: debouncedCustomerSearch.length >= 2,
    queryFn: async () => {
      const response = await eden.api.v1.customers.get({
        query: { limit: "10", page: "1", search: debouncedCustomerSearch },
      });
      if (response.error) throw response.error;
      return response.data;
    },
    queryKey: ["customers", "search", debouncedCustomerSearch],
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await eden.api.v1.cashier.checkout.post({
        customerUserId: selectedCustomerId || undefined,
        items: items.map((i) => ({
          medicineId: i.medicineId,
          quantity: i.quantity,
        })),
        paymentMethod: paymentMethod as "CASH" | "BANK_TRANSFER" | "QRIS",
      });

      if (response.error) throw response.error;

      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Transaksi berhasil: ${data.orderNumber}`);
      setItems([]);
      setSelectedCustomerId(null);
      setSearchTerm("");
      setCustomerSearch("");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      const message = (error as any)?.publicMessage || "Gagal memproses transaksi.";
      toast.error(message);
    },
  });

  const addItem = (medicine: MedicineSearchRow) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.medicineId === medicine.id);
      if (existing) {
        return prev.map((i) =>
          i.medicineId === medicine.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          medicineId: medicine.id,
          name: medicine.name,
          prescriptionRequired: medicine.prescriptionRequired,
          price: Number(medicine.sellingPrice),
          quantity: 1,
          unit: medicine.unit,
        },
      ];
    });
    setSearchTerm("");
  };

  const removeItem = (medicineId: string) => {
    setItems((prev) => prev.filter((i) => i.medicineId !== medicineId));
  };

  const updateQuantity = (medicineId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.medicineId === medicineId ? { ...i, quantity } : i))
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasPrescription = items.some((i) => i.prescriptionRequired);

  return (
    <DataTableShell
      description="Gunakan pencarian untuk menambahkan obat ke daftar belanja."
      title="Penjualan Kasir"
    >
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cari Obat</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <section className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                <input
                  className="w-full rounded-md border border-border-default bg-card-surface py-2 pl-10 pr-4 ts-sm focus:outline-none focus:ring-2 focus:ring-primary-blue-base"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ketik nama atau kode obat..."
                  type="text"
                  value={searchTerm}
                />
              </section>

              {searchTerm.length >= 2 && (
                <section className="rounded-lg border border-border-default bg-muted-surface overflow-hidden">
                  {medicineQuery.isLoading ? (
                    <section className="p-4 text-center">
                      <Loader2 className="mx-auto size-5 animate-spin text-text-muted" />
                    </section>
                  ) : medicineQuery.data?.data.length ? (
                    <ul className="divide-y divide-border-default">
                      {medicineQuery.data.data.map((m: MedicineSearchRow) => (
                        <li className="p-2" key={m.id}>
                          <button
                            className="flex w-full items-center justify-between gap-4 rounded-md p-2 text-left transition-colors hover:bg-hover-surface"
                            onClick={() => addItem(m)}
                            type="button"
                          >
                            <section className="min-w-0 flex-1">
                              <p className="ts-sm font-semibold text-text-strong truncate">
                                {m.name}
                              </p>
                              <p className="ts-xs text-text-muted">
                                {m.code} • {formatRp(Number(m.sellingPrice))}
                              </p>
                            </section>
                            <Plus className="size-4 text-primary-blue" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="p-4 text-center ts-sm text-text-muted">
                      Obat tidak ditemukan.
                    </p>
                  )}
                </section>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daftar Belanja</CardTitle>
              <span className="ts-sm font-medium text-text-muted">{items.length} item</span>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <EmptyState
                  description="Belum ada obat yang ditambahkan."
                  title="Daftar Kosong"
                />
              ) : (
                <ul className="grid gap-3">
                  {items.map((item) => (
                    <li
                      className="flex items-center justify-between gap-4 rounded-lg border border-border-default p-3"
                      key={item.medicineId}
                    >
                      <section className="min-w-0 flex-1">
                        <p className="ts-sm font-semibold text-text-strong truncate">
                          {item.name}
                        </p>
                        <p className="ts-xs text-text-muted">
                          {formatRp(item.price)} / {item.unit}
                        </p>
                        {item.prescriptionRequired && (
                          <span className="ts-xs font-medium text-warning">Perlu Resep</span>
                        )}
                      </section>

                      <section className="flex items-center gap-4">
                        <section className="flex items-center gap-2">
                          <Button
                            className="size-8 rounded-full"
                            onClick={() => updateQuantity(item.medicineId, item.quantity - 1)}
                            size="icon"
                            variant="secondary"
                          >
                            -
                          </Button>
                          <span className="ts-sm min-w-[2rem] text-center font-bold">{item.quantity}</span>
                          <Button
                            className="size-8 rounded-full"
                            onClick={() => updateQuantity(item.medicineId, item.quantity + 1)}
                            size="icon"
                            variant="secondary"
                          >
                            +
                          </Button>
                        </section>
                        <section className="text-right min-w-[80px]">
                          <p className="ts-sm font-bold text-text-strong">{formatRp(item.price * item.quantity)}</p>
                        </section>
                        <Button
                          className="text-text-muted hover:text-danger hover:bg-danger-surface"
                          onClick={() => removeItem(item.medicineId)}
                          size="icon"
                          variant="ghost"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </section>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="grid gap-6 content-start">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <section className="grid gap-2">
                <section className="flex justify-between text-text-muted">
                  <span className="ts-sm">Subtotal</span>
                  <span className="ts-sm font-medium">{formatRp(subtotal)}</span>
                </section>
                <section className="flex justify-between text-text-muted">
                  <span className="ts-sm">Pajak (0%)</span>
                  <span className="ts-sm font-medium">Rp 0</span>
                </section>
                <hr className="border-border-default" />
                <section className="flex justify-between">
                  <span className="ts-base font-bold text-text-strong">Total</span>
                  <span className="ts-lg font-bold text-primary-blue">{formatRp(subtotal)}</span>
                </section>
              </section>

              <section className="grid gap-4">
                <section className="grid gap-2">
                  <label className="ts-xs font-bold uppercase tracking-wider text-text-muted">Pelanggan (Opsional)</label>
                  <section className="relative">
                    <input
                      className="w-full rounded-md border border-border-default bg-card-surface py-2 pl-3 pr-4 ts-sm focus:outline-none focus:ring-2 focus:ring-primary-blue-base"
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        if (!e.target.value) setSelectedCustomerId(null);
                      }}
                      placeholder="Cari pelanggan..."
                      type="text"
                      value={selectedCustomerId ? (customerQuery.data?.data.find((c: any) => c.id === selectedCustomerId)?.name || customerSearch) : customerSearch}
                    />
                    {selectedCustomerId && (
                       <button 
                        className="absolute right-2 top-1/2 -translate-y-1/2 ts-xs text-primary-blue"
                        onClick={() => {
                          setSelectedCustomerId(null);
                          setCustomerSearch("");
                        }}
                       >Ganti</button>
                    )}
                  </section>
                  
                  {customerSearch.length >= 2 && !selectedCustomerId && (
                     <ul className="rounded-lg border border-border-default bg-muted-surface overflow-hidden divide-y divide-border-default">
                        {customerQuery.isLoading ? (
                          <li className="p-2 text-center"><Loader2 className="mx-auto size-4 animate-spin" /></li>
                        ) : customerQuery.data?.data.length ? (
                          customerQuery.data.data.map((c: CustomerSearchRow) => (
                            <li key={c.id}>
                              <button
                                className="w-full p-2 text-left ts-xs hover:bg-hover-surface"
                                onClick={() => {
                                  setSelectedCustomerId(c.id);
                                  setCustomerSearch(c.name);
                                }}
                              >
                                {c.name} {c.phone ? `(${c.phone})` : ""}
                              </button>
                            </li>
                          ))
                        ) : (
                          <li className="p-2 text-center ts-xs text-text-muted">Tidak ada hasil.</li>
                        )}
                     </ul>
                  )}
                </section>

                <SelectInput
                  id="payment-method"
                  label="Metode Pembayaran"
                  onValueChange={setPaymentMethod}
                  options={PAYMENT_METHODS}
                  required
                  value={paymentMethod}
                />

                {hasPrescription && (
                  <section className="rounded-md bg-warning-bg p-3 border border-warning-border">
                    <p className="ts-xs font-semibold text-warning">Peringatan Resep</p>
                    <p className="ts-xs text-warning-muted">
                      Transaksi mengandung obat resep. Pastikan resep fisik telah divalidasi oleh apoteker.
                    </p>
                  </section>
                )}

                <Button
                  className="w-full"
                  disabled={items.length === 0 || checkoutMutation.isPending}
                  leftIcon={checkoutMutation.isPending ? <Loader2 className="animate-spin" /> : <Receipt />}
                  onClick={() => checkoutMutation.mutate()}
                  size="lg"
                  variant="primary"
                >
                  Bayar & Selesai
                </Button>
              </section>
            </CardContent>
          </Card>
        </aside>
      </section>
    </DataTableShell>
  );
}
