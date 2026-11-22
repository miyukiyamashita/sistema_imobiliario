import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Toast from "./Toast";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((type, message, title = null) => {
    const id = `${Date.now()}-${Math.random()}`;
    const titles = { success: "Sucesso", error: "Não foi possível concluir", warning: "Atenção", info: "Informação" };
    setToasts((current) => [...current, { id, type, message, title: title || titles[type] }]);
    if (type !== "error") window.setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const value = useMemo(() => ({
    notify,
    success: (message, title) => notify("success", message, title),
    error: (message, title) => notify("error", message, title),
    warning: (message, title) => notify("warning", message, title),
    info: (message, title) => notify("info", message, title),
  }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => <Toast key={toast.id} toast={toast} onDismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast deve ser usado dentro de ToastProvider.");
  return context;
}
