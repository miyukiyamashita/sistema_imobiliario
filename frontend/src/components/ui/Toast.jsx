function Toast({ toast, onDismiss }) {
  return (
    <div className={`toast toast-${toast.type}`} role={toast.type === "error" ? "alert" : "status"}>
      <div>
        <strong>{toast.title}</strong>
        {toast.message && <p>{toast.message}</p>}
      </div>
      <button className="toast-close" type="button" onClick={() => onDismiss(toast.id)} aria-label="Fechar notificação">×</button>
    </div>
  );
}

export default Toast;
