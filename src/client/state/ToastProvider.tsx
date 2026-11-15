"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { Icon } from "@/components/ui/Icon";

export type ToastTone = "success" | "error" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
}

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
  action?: ToastAction;
}

interface ToastRecord extends ToastInput {
  id: string;
}

interface ToastContextValue {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast harus dipakai di dalam ToastProvider.");
  return context;
}

let toastSequence = 0;

function ToastCard({ record, dismiss }: { record: ToastRecord; dismiss: (id: string) => void }) {
  const duration = record.duration ?? (record.tone === "error" ? 8000 : 5600);

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(record.id), duration);
    return () => window.clearTimeout(timer);
  }, [dismiss, duration, record.id]);

  const tone = record.tone ?? "info";
  const icon = tone === "success" ? "check" : tone === "error" ? "alert" : "spark";

  return (
    <div className={`toast toast--${tone}`} role="status" aria-live="polite">
      <span className="toast__icon" aria-hidden="true">
        <Icon name={icon} size={14} />
      </span>
      <div>
        <div className="toast__title">{record.title}</div>
        {record.description ? <div className="toast__desc">{record.description}</div> : null}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {record.action ? (
          <button
            type="button"
            className="toast__undo"
            onClick={() => {
              void Promise.resolve(record.action?.onClick());
              dismiss(record.id);
            }}
          >
            {record.action.label}
          </button>
        ) : null}
        <button
          type="button"
          className="toast__close"
          aria-label="Tutup notifikasi"
          onClick={() => dismiss(record.id)}
        >
          <Icon name="close" size={12} />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    counter.current += 1;
    toastSequence += 1;
    const id = `toast_${toastSequence}_${counter.current}`;
    setToasts((current) => [...current.slice(-3), { ...input, id }]);
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-label="Notifikasi sistem">
        {toasts.map((record) => (
          <ToastCard key={record.id} record={record} dismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
