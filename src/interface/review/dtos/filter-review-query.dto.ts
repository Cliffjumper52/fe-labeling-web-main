import { BasePaginationQueryDto } from '../../common/base-pagination-query.dto';
import { Decision } from '../enums/decisions.enums';

export interface FilterReviewQueryDto extends BasePaginationQueryDto {
  fileLabelId?: string;
  reviewerId?: string;
  search?: string;
  searchBy?: string;
  decision?: Decision;
}

  @ApiPropertyOptional({
    type: 'string',
    format: 'uuid',
    description: 'Filter by checklist answer ID',
  })
  @IsOptional()
  @IsUUID()
  checklistAnswerId?: string;

  @ApiPropertyOptional({
    type: 'string',
    enum: ['createdAt', 'updatedAt', 'reviewedAt'],
    description: 'Field to order results by',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'reviewedAt'])
  orderBy?: string;
}
