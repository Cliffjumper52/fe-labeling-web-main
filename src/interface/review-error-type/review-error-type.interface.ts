import type { Severity } from "../enums/domain.enums";
import type { BaseEntityModel } from "../common/base-entity.interface";

export interface ReviewErrorType extends BaseEntityModel {
  name: string;
  description: string | null;
  severity: Severity;
  scoreImpact: number;
}
