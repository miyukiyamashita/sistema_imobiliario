function LoadingSpinner({ label = "Carregando..." }) {
  return <span className="loading-inline"><span className="loading-spinner" aria-hidden="true" />{label}</span>;
}

export default LoadingSpinner;
