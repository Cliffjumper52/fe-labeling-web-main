import type { NotificationType } from "../enums/domain.enums";
import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface Notification extends BaseEntityModel {
  accountId: string;
  account?: EntityReference;
  notificationType: NotificationType;
  title: string;
  content: string;
  relatedEntityId: string | null;
  additionalData: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
}
