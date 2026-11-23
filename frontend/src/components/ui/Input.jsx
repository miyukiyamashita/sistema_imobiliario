function Input({ label, name, error, hint, required = false, ...props }) {
  const id = props.id || name;
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}{required && <span className="required-mark"> *</span>}</label>}
      <input id={id} name={name} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      {hint && !error && <small className="field-hint">{hint}</small>}
      {error && <small className="field-error" id={`${id}-error`}>{error}</small>}
    </div>
  );
}

export default Input;
