<<<<<<< Updated upstream
import { BasePaginationQueryDto } from '../../common/base-pagination-query.dto';
import { Decision } from '../enums/decisions.enums';
=======
import type { BasePaginationQueryDto } from "../../common/base-pagination-query.dto";
import type { Decision } from "../../enums/domain.enums";
>>>>>>> Stashed changes

export interface FilterReviewQueryDto extends BasePaginationQueryDto {
  fileLabelId?: string;
  reviewerId?: string;
  search?: string;
  searchBy?: string;
  decision?: Decision;
  checklistAnswerId?: string;
  orderBy?: string;
}
