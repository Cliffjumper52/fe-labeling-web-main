import type { BasePaginationQueryDto } from '../../common/base-pagination-query.dto';
import { Severity } from '../enums/severity.enums';

export interface FilterReviewErrorTypeQueryDto extends BasePaginationQueryDto {
  search?: string;
  searchBy?: string;
  severity?: Severity;
  orderBy?: string;
}
