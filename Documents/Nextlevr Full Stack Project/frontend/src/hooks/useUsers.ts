"use client";

import { useState, useCallback, useEffect } from "react";
import api from "@/lib/api";
import { User } from "@/types";

interface UsersResponse {
  success: boolean;
  data: User[];
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<UsersResponse>("/users");
      setUsers(response.data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch users";
      setError(message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) await fetchUsers();
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
  };
}
