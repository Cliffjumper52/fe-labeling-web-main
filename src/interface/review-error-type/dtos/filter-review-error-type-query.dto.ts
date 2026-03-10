import type { BasePaginationQueryDto } from '../../common/base-pagination-query.dto';
import type { Severity } from '../../enums/domain.enums';

export interface FilterReviewErrorTypeQueryDto extends BasePaginationQueryDto {
  search?: string;
  searchBy?: string;
  severity?: Severity;
  orderBy?: string;
}
