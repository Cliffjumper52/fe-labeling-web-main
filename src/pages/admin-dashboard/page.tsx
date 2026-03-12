import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAccountPaginated } from "../../services/account-service.service";
import { getLabelPresetsPaginated } from "../../services/label-preset-service.service";
import { getLabelPaginated } from "../../services/label-service.service";
import { getProjectsPaginated } from "../../services/project-service.service";

type PaginatedData<T> = {
  data?: T[];
  totalItems?: number;
  total?: number;
  totalPages?: number;
  currentPage?: number;
  limit?: number;
};

type ApiEnvelope<T> = {
  data?: T;
  message?: string | string[];
};

type Stats = {
  accounts: number;
  projects: number;
  labels: number;
  presets: number;
};

const defaultStats: Stats = {
  accounts: 0,
  projects: 0,
  labels: 0,
  presets: 0,
};

const getCountFromEnvelope = (raw: unknown): number => {
  const envelope = raw as ApiEnvelope<PaginatedData<unknown>>;
  const payload = envelope?.data;

  if (!payload) return 0;
  if (typeof payload.totalItems === "number") return payload.totalItems;
  if (typeof payload.total === "number") return payload.total;

  if (typeof payload.totalPages === "number" && payload.totalPages > 0) {
    const pageSize =
      typeof payload.limit === "number"
        ? payload.limit
        : payload.data?.length ?? 0;
    return pageSize > 0 ? payload.totalPages * pageSize : payload.totalPages;
  }

  return payload.data?.length ?? 0;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [accountsResp, projectsResp, labelsResp, presetsResp] =
        await Promise.all([
          getAccountPaginated({
            page: 1,
            limit: 1,
            orderBy: "createdAt",
            order: "DESC",
          }),
          getProjectsPaginated({
            page: 1,
            limit: 1,
            orderBy: "createdAt",
            order: "DESC",
          }),
          getLabelPaginated({
            page: 1,
            limit: 1,
            orderBy: "createdAt",
            order: "DESC",
          }),
          getLabelPresetsPaginated({
            page: 1,
            limit: 1,
            orderBy: "createdAt",
            order: "DESC",
          }),
        ]);

      setStats({
        accounts: getCountFromEnvelope(accountsResp?.data ?? accountsResp),
        projects: getCountFromEnvelope(projectsResp),
        labels: getCountFromEnvelope(labelsResp),
        presets: getCountFromEnvelope(presetsResp),
      });
    } catch {
      toast.error("Failed to load admin dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStats();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <button
          type="button"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold"
          onClick={() => void fetchStats()}
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Accounts"
          value={stats.accounts}
          loading={loading}
        />
        <MetricCard
          title="Total Projects"
          value={stats.projects}
          loading={loading}
        />
        <MetricCard title="Total Labels" value={stats.labels} loading={loading} />
        <MetricCard
          title="Total Presets"
          value={stats.presets}
          loading={loading}
        />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  loading,
}: {
  title: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">
        {loading ? "..." : value.toLocaleString()}
      </p>
    </div>
  );
}
