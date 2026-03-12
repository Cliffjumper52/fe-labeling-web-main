import { useEffect, useState } from "react";
import {
  fetchAdminDashboardStats,
  type AdminDashboardStats,
} from "../../services/admin-service";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalUsers: 0,
    totalProjects: 0,
    totalLabels: 0,
    totalPresets: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    const loadStats = async () => {
      try {
        const remoteStats = await fetchAdminDashboardStats();
        if (mounted) {
          setStats(remoteStats);
        }
      } catch {
        if (mounted) {
          setStats({
            totalUsers: 0,
            totalProjects: 0,
            totalLabels: 0,
            totalPresets: 0,
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>

      {isLoading && (
        <div className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Loading dashboard metrics from API...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500">Projects</div>
          <div className="text-2xl font-bold">{stats.totalProjects}</div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500">Labels</div>
          <div className="text-2xl font-bold">{stats.totalLabels}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-2">
            Activity (placeholder)
          </div>
          <div className="h-48 flex items-center justify-center border border-dashed border-gray-200 rounded">
            Chart placeholder
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-2">Recent Actions</div>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>New project created</span>
              <span className="text-gray-400">2h</span>
            </li>
            <li className="flex justify-between">
              <span>User invited</span>
              <span className="text-gray-400">5h</span>
            </li>
            <li className="flex justify-between">
              <span>Settings updated</span>
              <span className="text-gray-400">1d</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
