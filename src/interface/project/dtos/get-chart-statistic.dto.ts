export type ChartStatisticsMode =
  | "day"
  | "week"
  | "month"
  | "year"
  | "all-time";

export interface GetChartStatisticsQueryDto {
  mode?: ChartStatisticsMode;
  value?: number;
  startDate?: string;
  endDate?: string;
  intervalCount?: number;
  createdById?: string;
}