import { forwardRef } from "react";

const Button = forwardRef(function Button({ children, variant = "primary", size = "md", loading = false, className = "", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={`button button-${variant} button-${size} ${className}`.trim()}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="button-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
});

export default Button;
