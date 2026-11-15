"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { AdminSnapshot } from "@/contracts/domain";
import { apiRequest } from "./api-client";

interface StudioContextValue {
  snapshot: AdminSnapshot | null;
  loading: boolean;
  error: string | null;
  lastSyncedAt: string | null;
  refresh: () => Promise<void>;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudio(): StudioContextValue {
  const context = useContext(StudioContext);
  if (!context) throw new Error("useStudio harus dipakai di dalam StudioProvider.");
  return context;
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const envelope = await apiRequest<AdminSnapshot>("/api/v1/snapshot");
    if (envelope.ok && envelope.data) {
      setSnapshot(envelope.data);
      setError(null);
      setLastSyncedAt(envelope.timestamp);
    } else {
      setError(
        envelope.error?.message ??
          "Snapshot Studio tidak dapat dimuat. Periksa sesi admin Anda."
      );
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      await refresh();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ snapshot, loading, error, lastSyncedAt, refresh }),
    [snapshot, loading, error, lastSyncedAt, refresh]
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}
