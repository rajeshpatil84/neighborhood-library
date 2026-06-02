"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

type ToastType = "success" | "error";
interface Toast { id: number; message: string; type: ToastType; }

const ToastContext = createContext<{ show: (msg: string, type?: ToastType) => void }>({
  show: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-in slide-in-from-bottom-2 ${
              t.type === "success" ? "bg-sage" : "bg-crimson"
            }`}
          >
            {t.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {t.message}
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="ml-2 opacity-70 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
