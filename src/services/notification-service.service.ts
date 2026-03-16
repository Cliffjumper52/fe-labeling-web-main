import api from "../api/axios";
import type { BasePaginationQueryDto } from "../interface/common/base-pagination-query.dto";

export interface NotificationQueryDto extends BasePaginationQueryDto {
  isRead?: boolean;
}

export interface NotificationPageQueryDto {
  page?: number;
  limit?: number;
  order?: "ASC" | "DESC";
  orderBy?: string;
  unreadOnly?: boolean;
}

export interface NotificationPage<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const getMyNotifications = async (params?: NotificationQueryDto) => {
  try {
    const resp = await api.get("/notifications/my", { params });
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getNotifications = async (
  params?: NotificationPageQueryDto,
): Promise<NotificationPage<import("../interface/notification/notification.interface").Notification>> => {
  try {
    const resp = await api.get("/notifications", { params });
    return (resp.data as { data: NotificationPage<import("../interface/notification/notification.interface").Notification> }).data;
  } catch (error) {
    throw error;
  }
};


export const markManyNotificationsAsRead = async (notificationIds: string[]) => {
  try {
    const resp = await api.patch("/notifications/read", { notificationIds });
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const deleteManyNotifications = async (notificationIds: string[]) => {
  try {
    const resp = await api.delete("/notifications", { data: { notificationIds } });
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const resp = await api.post("/notifications/read-all");
    console.log("[markAllNotificationsAsRead]", resp.data);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const deleteAllNotifications = async () => {
  try {
    const resp = await api.delete("/notifications/all");
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getUnreadCount = async (): Promise<number> => {
  try {
    const resp = await api.get("/notifications/unread-count");
    return (resp.data as { data: { unreadCount: number } }).data.unreadCount;
  } catch (error) {
    throw error;
  }
};
