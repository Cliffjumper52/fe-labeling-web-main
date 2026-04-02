import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface Notification extends BaseEntityModel {
  accountId: string;
  account?: EntityReference;
  title: string;
  content: string;
  additionalData: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
}
