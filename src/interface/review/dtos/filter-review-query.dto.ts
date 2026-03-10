import type { BasePaginationQueryDto } from '../../common/base-pagination-query.dto';
import type { Decision } from '../../enums/domain.enums';

export interface FilterReviewQueryDto extends BasePaginationQueryDto {
  fileLabelId?: string;
  reviewerId?: string;
  checklistAnswerId?: string;
  search?: string;
  searchBy?: string;
  decision?: Decision;
  orderBy?: 'createdAt' | 'updatedAt' | 'reviewedAt';
}
