"use client";

import { ClipboardList, Search, X } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Badge,
  DataTable,
  DataTableShell,
  EmptyState,
  ErrorState,
  Pagination,
  PermissionState,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from "@/components/ui";
import { APP_NAME } from "@/constants/app";
import {
  AUDIT_RESULT_LABELS,
  AUDIT_RESULT_TONES,
  AUDIT_RESULT_VALUES,
  USER_ROLE_LABELS,
  type AuditResult,
  type UserRole,
} from "@/constants/auth";
import { FIELD_CLASS_NAMES } from "@/constants/design";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { eden } from "@/lib/eden";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { formatDateTime } from "@/utils/inventoryDisplay";
import { mc } from "@/utils/mc";
import { hasPermission } from "@/utils/permissions";

const PAGE_SIZE = 20;

const RESULT_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Semua Hasil", value: "" },
  ...AUDIT_RESULT_VALUES.map((r) => ({
    label: AUDIT_RESULT_LABELS[r],
    value: r,
  })),
];

type AuditActor = {
  email: string | null;
  id: string | null;
  name: string | null;
  role: string | null;
};

type AuditLogItem = {
  action: string;
  actor: AuditActor;
  correlationId: string | null;
  createdAt: Date | string | Date;
  description: string;
  id: string;
  ipAddress: string | null;
  result: AuditResult;
  targetId: string | null;
  targetType: string;
  userAgent: string | null;
};

type AuditLogPagination = {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

type QueryParams = {
  page: number;
  result: string;
  search: string;
};

function useAuditLogs(params: QueryParams) {
  return useQuery({
    queryFn: async () => {
      const query: Record<string, string> = {
        limit: String(PAGE_SIZE),
        page: String(params.page),
        sortBy: "createdAt",
        sortDir: "desc",
      };

      if (params.search) query.search = params.search;
      if (params.result) query.result = params.result;

      const response = await eden.api.v1["audit-logs"].get({ query });

      if (response.error) throw response.error;

      return response.data;
    },
    queryKey: ["audit-logs", params],
  });
}

function actorLabel(actor: AuditActor): string {
  return actor.name ?? actor.email ?? "Sistem";
}

function actorRoleLabel(role: string | null): string | null {
  if (!role) return null;
  return USER_ROLE_LABELS[role as UserRole] ?? role;
}

/**
 * Audit Log halaman — rekam jejak aktivitas keamanan dan operasional sistem.
 * Hanya dapat diakses oleh pengguna dengan izin audit_log.read.
 */
export default function AuditLogsPage() {
  const auth = useAuth();
  const user = auth.data?.user;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 300);
  const [resultFilter, setResultFilter] = useState("");
  const [page, setPage] = useState(1);

  const logsQuery = useAuditLogs({
    page,
    result: resultFilter,
    search: debouncedSearch,
  });

  const logs = (logsQuery.data?.data ?? []) as AuditLogItem[];
  const pagination = logsQuery.data?.pagination as AuditLogPagination | undefined;

  if (auth.isLoading) {
    return <TableSkeleton columns={7} rows={10} />;
  }

  if (!user || !hasPermission(user.role, "audit_log.read")) {
    return (
      <PermissionState
        backHref={ROUTES.DASHBOARD}
        description="Hanya Admin yang dapat mengakses halaman Audit Log."
      />
    );
  }

  const handleResultChange = (value: string) => {
    setResultFilter(value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch("");
    setPage(1);
  };

  const isFiltered = Boolean(debouncedSearch || resultFilter);

  const toolbar = (
    <section className="flex flex-wrap gap-3">
      <section className="relative min-w-0 flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
        />
        <input
          aria-label="Cari audit log"
          className={mc(FIELD_CLASS_NAMES.control, "pl-9", search && "pr-9")}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari aksi, deskripsi, target..."
          type="search"
          value={search}
        />
        {search && (
          <button
            aria-label="Hapus pencarian"
            className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-text-muted hover:text-text-strong"
            onClick={handleClearSearch}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </section>

      <section className="w-44 shrink-0">
        <select
          aria-label="Filter hasil audit"
          className={mc(FIELD_CLASS_NAMES.control, "cursor-pointer")}
          onChange={(e) => handleResultChange(e.target.value)}
          value={resultFilter}
        >
          {RESULT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>
    </section>
  );

  let content: ReactNode;
  let footerNode: ReactNode = null;

  if (logsQuery.isLoading) {
    content = <TableSkeleton columns={7} rows={10} />;
  } else if (logsQuery.isError) {
    content = (
      <ErrorState
        description={getErrorMessage(logsQuery.error, "Audit log gagal dimuat. Coba muat ulang halaman.")}
        onRetry={() => logsQuery.refetch()}
      />
    );
  } else if (logs.length === 0) {
    content = (
      <EmptyState
        description={
          isFiltered
            ? "Tidak ada audit log yang cocok dengan filter yang dipilih. Coba ubah kriteria pencarian."
            : "Belum ada aktivitas yang tercatat dalam audit log sistem."
        }
        icon={<ClipboardList />}
        title="Tidak ada audit log"
      />
    );
  } else {
    const tableRows = logs.map((log) => {
      const name = actorLabel(log.actor);
      const role = actorRoleLabel(log.actor.role);
      const targetLabel = log.targetId
        ? `${log.targetType} · ${log.targetId}`
        : log.targetType;

      return (
        <TableRow key={log.id}>
          <TableCell className="whitespace-nowrap">
            <span className="ts-xs text-text-muted">
              {formatDateTime(log.createdAt)}
            </span>
          </TableCell>

          <TableCell>
            <code className="ts-xs rounded bg-muted-surface px-1.5 py-0.5 font-mono text-text-strong">
              {log.action}
            </code>
          </TableCell>

          <TableCell>
            <section className="grid gap-0.5">
              <span className="ts-sm font-medium text-text-strong">
                {name}
              </span>
              {role && (
                <span className="ts-xs text-text-muted">{role}</span>
              )}
            </section>
          </TableCell>

          <TableCell className="max-w-[10rem]">
            <p className="ts-xs truncate text-text-muted" title={targetLabel}>
              {targetLabel}
            </p>
          </TableCell>

          <TableCell className="max-w-xs">
            <p className="ts-sm line-clamp-2 text-text-default">
              {log.description}
            </p>
          </TableCell>

          <TableCell>
            <Badge tone={AUDIT_RESULT_TONES[log.result]}>
              {AUDIT_RESULT_LABELS[log.result]}
            </Badge>
          </TableCell>

          <TableCell className="whitespace-nowrap">
            <span className="ts-xs font-mono text-text-muted">
              {log.ipAddress ?? "—"}
            </span>
          </TableCell>
        </TableRow>
      );
    });

    content = (
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Waktu</TableHead>
            <TableHead>Aksi</TableHead>
            <TableHead>Pelaku</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Deskripsi</TableHead>
            <TableHead>Hasil</TableHead>
            <TableHead>Alamat IP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{tableRows}</TableBody>
      </DataTable>
    );

    if (pagination) {
      footerNode = (
        <section className="flex flex-wrap items-center justify-between gap-3">
          <p className="ts-xs text-text-muted">
            {pagination.total} catatan · halaman {page} dari {Math.max(pagination.totalPages, 1)}
          </p>
          <Pagination
            currentPage={page}
            onPageChange={setPage}
            pageCount={Math.max(pagination.totalPages, 1)}
          />
        </section>
      );
    }
  }

  const description = pagination
    ? `${pagination.total} catatan ditemukan`
    : "Rekam jejak aktivitas keamanan dan operasional sistem.";

  return (
    <>
      <Helmet>
        <title>Audit Log | {APP_NAME}</title>
      </Helmet>

      <DataTableShell
        description={description}
        footer={footerNode}
        title="Audit Log"
        toolbar={toolbar}
      >
        {content}
      </DataTableShell>
    </>
  );
}
