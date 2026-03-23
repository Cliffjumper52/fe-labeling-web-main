import { useCallback, useEffect, useState } from "react";

type StatisticValue = number | string | null | undefined;

type StatisticsRecord = Record<string, StatisticValue>;

export type StatisticCardDefinition = {
  key: string;
  label: string;
  formatValue?: (value: StatisticValue) => string;
};

type StatisticsSummaryProps = {
  cards: StatisticCardDefinition[];
  fetchStatistics: () => Promise<unknown>;
  refreshKey?: number;
  className?: string;
};

const unwrapAxiosData = (payload: unknown): unknown => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: unknown }).data;
  }

  return payload;
};

const unwrapApiEnvelope = (payload: unknown): unknown => {
  const axiosData = unwrapAxiosData(payload);

  if (axiosData && typeof axiosData === "object" && "data" in axiosData) {
    return (axiosData as { data: unknown }).data;
  }

  return axiosData;
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return error instanceof Error ? error.message : fallback;
};

const toDisplayValue = (value: StatisticValue): string => {
  if (typeof value === "number") {
    return value.toLocaleString();
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return "-";
};

export default function StatisticsSummary({
  cards,
  fetchStatistics,
  refreshKey,
  className,
}: StatisticsSummaryProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<StatisticsRecord>({});

  const loadStatistics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchStatistics();
      const payload = unwrapApiEnvelope(response);

      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new Error("Invalid statistics response.");
      }

      setStatistics(payload as StatisticsRecord);
    } catch (loadError) {
      setError(extractErrorMessage(loadError, "Failed to load statistics."));
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatistics]);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics, refreshKey]);

  return (
    <div className={className}>
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadStatistics()}
            className="rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const rawValue = statistics[card.key];
          const value = card.formatValue
            ? card.formatValue(rawValue)
            : toDisplayValue(rawValue);

          return (
            <div
              key={card.key}
              className="rounded-lg border border-gray-200 bg-white px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {isLoading ? (
                  <span className="inline-block h-7 w-20 animate-pulse rounded bg-gray-200" />
                ) : (
                  value
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
