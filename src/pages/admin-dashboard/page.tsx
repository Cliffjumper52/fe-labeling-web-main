import { useEffect, useState } from "react";
import {
  fetchAdminDashboardStats,
  type AdminDashboardStats,
} from "../../services/admin-service";
import { getProjectChartStatistics } from "../../services/project-service.service";
import type { SingleChartStatisticDto } from "../../interface/project/dtos/chart-statistic.dto";

// ── Chart helpers ────────────────────────────────────────────────────────────

type Period = "week" | "month" | "year";

interface BarDatum {
  label: string;
  value: number;
  details: { draft: number; active: number; completed: number; archived: number };
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Mon=0 … Sun=6 ordering
const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Parse API date string "DD/MM/YYYY" → Date (UTC) */
const parseDMY = (s: string): Date => {
  const [dd, mm, yyyy] = s.split("/");
  return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
};

const apiItemsToBarData = (
  items: SingleChartStatisticDto[],
  period: Period,
): BarDatum[] =>
  items.map((item) => {
    const d = parseDMY(item.date);
    let label: string;
    if (period === "week") {
      label = WEEK_LABELS[(d.getUTCDay() + 6) % 7]; // 0=Mon…6=Sun
    } else if (period === "month") {
      label = String(d.getUTCDate()); // day-of-month number
    } else {
      label = MONTH_NAMES[d.getUTCMonth()];
    }
    const det = item.details as Record<string, number>;
    return {
      label,
      value: item.projects,
      details: {
        draft: det["draft"] ?? 0,
        active: det["active"] ?? 0,
        completed: det["completed"] ?? 0,
        archived: det["archived"] ?? 0,
      },
    };
  });

// SVG bar chart with hover tooltip
function BarChart({
  data,
  hoveredIdx,
  onHover,
}: {
  data: BarDatum[];
  hoveredIdx: number | null;
  onHover: (i: number | null) => void;
}) {
  const TOP_PAD = 14;   // room for the value label above the tallest bar
  const BAR_AREA_H = 160;
  const BAR_GAP = 4;
  const LABEL_H = 20;
  const SVG_H = TOP_PAD + BAR_AREA_H + LABEL_H;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;
  const barW = n <= 1 ? 60 : 24;
  const VB_W = n <= 1 ? 120 : n * (barW + BAR_GAP);

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${SVG_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
      onMouseLeave={() => onHover(null)}
    >
      {data.map((d, i) => {
        const x = n <= 1 ? (VB_W - barW) / 2 : i * (barW + BAR_GAP);
        const barH = Math.max((d.value / maxVal) * BAR_AREA_H, d.value === 0 ? 0 : 2);
        const y = TOP_PAD + BAR_AREA_H - barH;
        const isHovered = hoveredIdx === i;
        return (
          <g
            key={i}
            onMouseEnter={() => onHover(i)}
            style={{ cursor: "pointer" }}
          >
            {/* invisible hit area — spans the full bar zone (below top pad) */}
            <rect
              x={x}
              y={TOP_PAD}
              width={barW}
              height={BAR_AREA_H}
              fill={isHovered ? "rgba(59,130,246,0.08)" : "transparent"}
            />
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              fill={isHovered ? "#2563eb" : "#3b82f6"}
            />
            {d.value > 0 && (
              <text
                x={x + barW / 2}
                y={y - 2}
                textAnchor="middle"
                fontSize={n > 20 ? 6 : 8}
                fill="#4b5563"
              >
                {d.value}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={SVG_H - 3}
              textAnchor="middle"
              fontSize={n > 20 ? 5 : 7}
              fill={isHovered ? "#3b82f6" : "#9ca3af"}
              fontWeight={isHovered ? "bold" : "normal"}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const PERIOD_LABELS: { key: Period; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

const NOW_UTC_MONTH = new Date().getUTCMonth() + 1; // 1–12
const NOW_UTC_YEAR = new Date().getUTCFullYear();
const BASE_YEAR = 2020;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalUsers: 0,
    totalProjects: 0,
    totalLabels: 0,
    totalPresets: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState<Period>("week");
  const [monthValue, setMonthValue] = useState(NOW_UTC_MONTH);
  const [yearValue, setYearValue] = useState(NOW_UTC_YEAR);
  const [chartData, setChartData] = useState<BarDatum[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    setHoveredIdx(null);
    if (p === "month") setMonthValue(NOW_UTC_MONTH);
    if (p === "year") setYearValue(NOW_UTC_YEAR);
  };

  // Load dashboard stats
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

  // Load chart data whenever period / value changes
  useEffect(() => {
    let mounted = true;
    setChartLoading(true);

    const loadChart = async () => {
      try {
        let resp;
        if (period === "week") {
          resp = await getProjectChartStatistics({ mode: "week" });
        } else if (period === "month") {
          resp = await getProjectChartStatistics({ mode: "month", value: monthValue });
        } else {
          resp = await getProjectChartStatistics({ mode: "year", value: yearValue });
        }

        const items: SingleChartStatisticDto[] = Array.isArray(resp?.data)
          ? resp.data
          : [];

        if (mounted) {
          setChartData(apiItemsToBarData(items, period));
        }
      } catch {
        if (mounted) {
          setChartData([]);
        }
      } finally {
        if (mounted) {
          setChartLoading(false);
        }
      }
    };

    void loadChart();

    return () => {
      mounted = false;
    };
  }, [period, monthValue, yearValue]);

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
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="text-sm font-medium text-gray-700">
              Projects Created
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Mode buttons */}
              <div className="flex gap-1">
                {PERIOD_LABELS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handlePeriodChange(key)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      period === key
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Month selector — only visible in month mode */}
              {period === "month" && (
                <select
                  value={monthValue}
                  onChange={(e) => setMonthValue(Number(e.target.value))}
                  className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 bg-white"
                >
                  {MONTH_NAMES.map((name, i) => {
                    const mn = i + 1;
                    return (
                      <option key={mn} value={mn} disabled={mn > NOW_UTC_MONTH}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              )}

              {/* Year selector — only visible in year mode */}
              {period === "year" && (
                <select
                  value={yearValue}
                  onChange={(e) => setYearValue(Number(e.target.value))}
                  className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 bg-white"
                >
                  {Array.from(
                    { length: NOW_UTC_YEAR - BASE_YEAR + 1 },
                    (_, i) => NOW_UTC_YEAR - i,
                  ).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="h-48 relative">
            {chartLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                Loading…
              </div>
            ) : chartData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                No data
              </div>
            ) : (
              <BarChart
                data={chartData}
                hoveredIdx={hoveredIdx}
                onHover={setHoveredIdx}
              />
            )}
          </div>

          {/* Detail panel — shown when a bar is hovered */}
          <div className="mt-2 min-h-[48px]">
            {hoveredIdx !== null && chartData[hoveredIdx] ? (
              <div className="flex items-center gap-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs">
                <span className="font-semibold text-gray-700 mr-1">
                  {chartData[hoveredIdx].label}
                </span>
                <span className="text-gray-500">
                  Total: <strong>{chartData[hoveredIdx].value}</strong>
                </span>
                <span className="w-px h-4 bg-gray-200" />
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-sm bg-yellow-400" />
                  Draft: <strong>{chartData[hoveredIdx].details.draft}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-sm bg-blue-400" />
                  Active: <strong>{chartData[hoveredIdx].details.active}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-sm bg-green-400" />
                  Completed: <strong>{chartData[hoveredIdx].details.completed}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-sm bg-gray-400" />
                  Archived: <strong>{chartData[hoveredIdx].details.archived}</strong>
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-300 px-1">Hover a bar to see details</p>
            )}
          </div>
          <div className="mt-1 text-xs text-gray-400 text-right">
            {period === "week" && "Mon – Sun (current week)"}
            {period === "month" && `${MONTH_NAMES[monthValue - 1]} ${NOW_UTC_YEAR} — daily`}
            {period === "year" && `Year ${yearValue} — monthly`}
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
