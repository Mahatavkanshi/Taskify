type TodoToastProps = {
  message: string;
  tone?: "success" | "info";
};

export function TodoToast({ message, tone = "success" }: TodoToastProps) {
  return (
    <div className={`toast toast-${tone}`} role="status" aria-live="polite">
      <span className="toast-dot" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
