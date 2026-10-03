"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { Notification } from "@/types";

export interface NotificationFilters {
  limit?: number;
  offset?: number;
}

export interface NotificationHookResult {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

interface NotificationsResponse {
  success: boolean;
  data: Notification[];
}

interface MarkReadResponse {
  success: boolean;
  data: Notification;
}

function buildQueryParams(filters?: NotificationFilters): string {
  const params = new URLSearchParams();
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.offset) params.set("offset", String(filters.offset));
  return params.toString();
}

export function useNotifications(
  initialFilters?: NotificationFilters
): NotificationHookResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(
    async (filters?: NotificationFilters) => {
      setLoading(true);
      setError(null);
      try {
        const query = buildQueryParams(filters);
        const response = await api.get<NotificationsResponse>(
          `/notifications${query ? `?${query}` : ""}`
        );
        setNotifications(response.data.data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to fetch notifications";
        setError(message);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.put<MarkReadResponse>(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to mark notification as read";
      setError(message);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to mark all notifications as read";
      setError(message);
    }
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) await fetchNotifications(initialFilters);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchNotifications, initialFilters]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
