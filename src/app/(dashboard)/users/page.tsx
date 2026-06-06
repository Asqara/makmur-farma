"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus } from "lucide-react";
import { useState } from "react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableShell,
  EmptyState,
  ErrorState,
  SelectInput,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  TextInput,
  toast,
  type SelectInputOption,
} from "@/components/ui";
import {
  USER_ROLE_LABELS,
  USER_ROLE_VALUES,
  USER_STATUS_LABELS,
  USER_STATUS_VALUES,
  type UserRole,
  type UserStatus,
} from "@/constants/auth";
import { useDebounce } from "@/hooks/useDebounce";
import { eden } from "@/lib/eden";
import { formatDateTime } from "@/utils/inventoryDisplay";

type UserRow = {
  createdAt: Date | string;
  email: string;
  id: string;
  isActive: boolean;
  name: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
};

type UsersResponse = {
  data: UserRow[];
};

const roleOptions: SelectInputOption[] = USER_ROLE_VALUES.map((role) => ({
  label: USER_ROLE_LABELS[role],
  value: role,
}));

const statusOptions: SelectInputOption[] = USER_STATUS_VALUES.map((status) => ({
  label: USER_STATUS_LABELS[status],
  value: status,
}));

const statusTone: Record<UserStatus, "danger" | "neutral" | "success" | "warning"> = {
  ACTIVE: "success",
  DISABLED: "neutral",
  PENDING_VERIFICATION: "warning",
  SUSPENDED: "danger",
};

const initialForm = {
  email: "",
  fullName: "",
  password: "",
  phone: "",
  role: "PHARMACIST" as UserRole,
  status: "ACTIVE" as UserStatus,
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 300);
  const [form, setForm] = useState(initialForm);

  const usersQuery = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.users.get({
        query: {
          limit: "30",
          page: "1",
          search: debouncedSearch,
          sortBy: "createdAt",
          sortDir: "desc",
        },
      });

      if (response.error) throw response.error;

      return response.data as UsersResponse;
    },
    queryKey: ["users", debouncedSearch],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await eden.api.v1.users.post({
        email: form.email,
        fullName: form.fullName,
        markEmailVerified: true,
        password: form.password,
        phone: form.phone,
        role: form.role,
        status: form.status,
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onError: () => {
      toast.error("Pengguna gagal dibuat.");
    },
    onSuccess: () => {
      toast.success("Pengguna berhasil dibuat.");
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      role,
      status,
    }: {
      id: string;
      role?: UserRole;
      status?: UserStatus;
    }) => {
      const response = await eden.api.v1.users({ id }).put({
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onError: () => {
      toast.error("Pengguna gagal diperbarui.");
    },
    onSuccess: () => {
      toast.success("Pengguna diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return (
    <DataTableShell
      description="Admin dapat membuat pengguna operasional, mengubah role/status, dan menonaktifkan akses."
      title="Pengguna"
      toolbar={
        <section className="grid gap-3 md:grid-cols-[minmax(0,320px)_auto] md:items-end">
          <TextInput
            id="user-search"
            label="Cari Pengguna"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama, email, atau telepon"
            value={search}
          />
          <section className="flex min-h-10 items-center gap-2 text-text-muted">
            <Search aria-hidden="true" className="size-4" />
            <span className="ts-sm"></span>
          </section>
        </section>
      }
    >
      <section className="grid gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
              onSubmit={(event) => {
                event.preventDefault();
                createMutation.mutate();
              }}
            >
              <TextInput
                id="new-user-name"
                label="Nama"
                onChange={(event) =>
                  setForm((current) => ({ ...current, fullName: event.target.value }))
                }
                required
                value={form.fullName}
              />
              <TextInput
                id="new-user-email"
                label="Email"
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                required
                type="email"
                value={form.email}
              />
              <TextInput
                id="new-user-phone"
                label="Telepon"
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                value={form.phone}
              />
              <TextInput
                id="new-user-password"
                label="Password"
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                required
                type="password"
                value={form.password}
              />
              <SelectInput
                id="new-user-role"
                label="Role"
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, role: value as UserRole }))
                }
                options={roleOptions}
                value={form.role}
              />
              <SelectInput
                id="new-user-status"
                label="Status"
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, status: value as UserStatus }))
                }
                options={statusOptions}
                value={form.status}
              />
              <section className="md:col-span-2 xl:col-span-3">
                <Button
                  disabled={createMutation.isPending}
                  leftIcon={<UserPlus aria-hidden="true" className="size-4" />}
                  type="submit"
                >
                  {createMutation.isPending ? "Menyimpan..." : "Tambah Pengguna"}
                </Button>
              </section>
            </form>
          </CardContent>
        </Card>

        {usersQuery.isError ? (
          <ErrorState
            description="Daftar pengguna gagal dimuat."
            onRetry={() => usersQuery.refetch()}
            title="Pengguna Tidak Tersedia"
          />
        ) : usersQuery.isLoading ? (
          <Card>
            <CardContent>
              <TableSkeleton columns={7} rows={8} />
            </CardContent>
          </Card>
        ) : usersQuery.data?.data.length ? (
          <Card>
            <CardContent>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aktif</TableHead>
                    <TableHead>Dibuat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersQuery.data.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="font-medium text-text-strong">{user.name}</p>
                        <p className="ts-xs text-text-muted">{user.phone ?? "-"}</p>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <SelectInput
                          id={`role-${user.id}`}
                          label="Role"
                          onValueChange={(value) =>
                            updateMutation.mutate({
                              id: user.id,
                              role: value as UserRole,
                            })
                          }
                          options={roleOptions}
                          value={user.role}
                        />
                      </TableCell>
                      <TableCell>
                        <SelectInput
                          id={`status-${user.id}`}
                          label="Status"
                          onValueChange={(value) =>
                            updateMutation.mutate({
                              id: user.id,
                              status: value as UserStatus,
                            })
                          }
                          options={statusOptions}
                          value={user.status}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={user.isActive ? "Aktif" : "Tidak Aktif"}
                          tone={user.isActive ? "success" : "neutral"}
                        />
                      </TableCell>
                      <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            description="Belum ada pengguna yang cocok dengan filter."
            title="Pengguna Kosong"
          />
        )}
      </section>
    </DataTableShell>
  );
}
