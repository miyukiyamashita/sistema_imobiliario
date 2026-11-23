function EmptyState({ title, description, action = null }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">⌂</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export default EmptyState;
