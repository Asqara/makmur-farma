"use client";

import type React from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Database, RefreshCw, Wifi } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  DataTable,
  DataTableShell,
  EmptyState,
  ErrorState,
  MonitoringHealthCard,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { eden } from "@/lib/eden";

type MonitoringResponse = {
  errors: {
    critical: number;
    info: number;
    warning: number;
  };
  queues: Array<{
    active: number;
    completed: number;
    failed: number;
    queueName: string;
    waiting: number;
  }>;
  services: Array<{
    description: string;
    lastChecked: string;
    metric: string;
    serviceName: string;
    status: "degraded" | "down" | "healthy" | "unknown";
  }>;
};

const SERVICE_ICONS: Record<string, React.ReactElement> = {
  PostgreSQL: <Database />,
  Redis: <Wifi />,
  Worker: <Activity />,
};

export default function MonitoringPage() {
  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.monitoring.get();

      if (response.error) throw response.error;

      return response.data as MonitoringResponse;
    },
    queryKey: ["monitoring"],
    refetchInterval: 15_000,
  });

  return (
    <DataTableShell
      description="Monitoring hanya menampilkan data yang tersedia dari runtime dan PostgreSQL."
      title="Monitoring"
      toolbar={
        <Button
          disabled={query.isFetching}
          leftIcon={<RefreshCw className={query.isFetching ? "animate-spin" : undefined} />}
          onClick={() => query.refetch()}
          size="sm"
          variant="secondary"
        >
          Refresh
        </Button>
      }
    >
      {query.isError ? (
        <ErrorState
          description="Monitoring gagal dimuat."
          onRetry={() => query.refetch()}
          title="Monitoring Tidak Tersedia"
        />
      ) : query.data ? (
        <section className="grid gap-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {query.data.services.map((service) => (
              <MonitoringHealthCard
                description={service.description}
                icon={SERVICE_ICONS[service.serviceName]}
                key={service.serviceName}
                lastChecked={service.lastChecked}
                metric={service.metric}
                serviceName={service.serviceName}
                status={service.status}
              />
            ))}
          </section>

          {query.data.queues.length ? (
            <Card>
              <CardContent>
                <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Queue</TableHead>
                      <TableHead>Waiting</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Failed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {query.data.queues.map((queue) => (
                      <TableRow key={queue.queueName}>
                        <TableCell>{queue.queueName}</TableCell>
                        <TableCell>{queue.waiting}</TableCell>
                        <TableCell>{queue.active}</TableCell>
                        <TableCell>{queue.completed}</TableCell>
                        <TableCell>{queue.failed}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DataTable>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              description="Belum ada queue run yang tercatat di PostgreSQL."
              title="Queue Kosong"
            />
          )}
        </section>
      ) : (
        <EmptyState description="Memuat monitoring..." title="Memuat" />
      )}
    </DataTableShell>
  );
}
