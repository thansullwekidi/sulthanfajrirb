"use client";

import { useCallback } from "react";
import type { ApiErrorBody, ApiResponse } from "@/contracts/api-envelope";
import { useStudio } from "./StudioProvider";
import { useMutationLock } from "./useMutationLock";
import { useToast } from "./ToastProvider";

interface RunOptions<T> {
  successTitle: string;
  successDescription?: string;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiErrorBody | null) => void;
  toastOnSuccess?: boolean;
}

export function useAdminAction() {
  const { refresh } = useStudio();
  const { toast } = useToast();
  const mutation = useMutationLock();
  const { execute, setPhase } = mutation;

  const run = useCallback(
    async <T,>(
      task: () => Promise<ApiResponse<T>>,
      options: RunOptions<T>
    ): Promise<ApiResponse<T> | null> => {
      const envelope = await execute(task);

      if (!envelope) {
        if (mutation.error) {
          toast({
            tone: "error",
            title: "Mutasi tidak dijalankan",
            description: mutation.error.message
          });
        }
        return null;
      }

      if (envelope.ok) {
        setPhase("REVALIDATING");
        await refresh();
        setPhase("SUCCESS");
        if (options.toastOnSuccess !== false) {
          toast({
            tone: "success",
            title: options.successTitle,
            description: options.successDescription
          });
        }
        options.onSuccess?.(envelope.data as T);
      } else {
        toast({
          tone: "error",
          title: "Mutasi ditolak",
          description: envelope.error?.message
        });
        options.onError?.(envelope.error);
      }

      return envelope;
    },
    [execute, mutation.error, refresh, setPhase, toast]
  );

  return { ...mutation, run };
}
