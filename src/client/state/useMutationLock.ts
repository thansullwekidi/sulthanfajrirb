"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ApiErrorBody, ApiResponse } from "@/contracts/api-envelope";

export type MutationPhase =
  | "IDLE"
  | "VALIDATING"
  | "MUTATING"
  | "REVALIDATING"
  | "SUCCESS"
  | "ERROR";

/**
 * LAPISAN 4 — Kunci idempotensi mutasi.
 * Selama lock aktif, klik ganda tidak akan memicu permintaan kedua.
 */
export function useMutationLock() {
  const [phase, setPhase] = useState<MutationPhase>("IDLE");
  const [error, setError] = useState<ApiErrorBody | null>(null);
  const locked = useRef(false);

  const execute = useCallback(
    async <T,>(task: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T> | null> => {
      if (locked.current) return null;
      locked.current = true;
      setError(null);
      setPhase("VALIDATING");

      try {
        setPhase("MUTATING");
        const envelope = await task();
        if (!envelope.ok) {
          setError(
            envelope.error ?? { code: "UNKNOWN", message: "Mutasi gagal tanpa keterangan." }
          );
          setPhase("ERROR");
        } else {
          setPhase("SUCCESS");
        }
        return envelope;
      } catch (exception) {
        setError({
          code: "CLIENT_EXCEPTION",
          message:
            exception instanceof Error
              ? exception.message
              : "Terjadi galat tak terduga di klien."
        });
        setPhase("ERROR");
        return null;
      } finally {
        locked.current = false;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
    setPhase("IDLE");
  }, []);

  const isSubmitting =
    phase === "VALIDATING" || phase === "MUTATING" || phase === "REVALIDATING";

  const fieldErrors = useMemo(() => error?.fields ?? {}, [error]);

  return { execute, phase, setPhase, error, fieldErrors, isSubmitting, reset };
}
