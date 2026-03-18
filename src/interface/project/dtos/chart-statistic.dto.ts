import type { ProjectStatus } from "../../enums/domain.enums";

export interface SingleChartStatisticDto {
  date: string;
  projects: number;
  details: Record<ProjectStatus, number>;
}
