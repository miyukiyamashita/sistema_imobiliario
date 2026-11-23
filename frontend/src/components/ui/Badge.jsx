const variantes = {
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  info: "badge-info",
  neutral: "badge-neutral",
};

function Badge({ children, variant = "neutral" }) {
  return <span className={`badge ${variantes[variant] || variantes.neutral}`}>{children}</span>;
}

export default Badge;
