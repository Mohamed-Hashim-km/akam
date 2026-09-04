import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "green";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "right",
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  // Base & Variant styles
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 whitespace-nowrap";

  const variantStyles = {
    primary: "bg-dark-bg text-white hover:bg-black/85",
    secondary: "bg-white text-dark-bg hover:bg-slate-100 border border-gray-200",
    green: "bg-primary-green text-white font-medium hover:bg-emerald-600 ",
    outline: "border-2 border-dark-bg text-dark-bg hover:bg-dark-bg hover:text-white",
    ghost: "text-dark-bg hover:bg-black/5",
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-xs md:text-sm gap-1.5",
    md: "px-5 py-2.5 text-sm md:text-base gap-2",
    lg: "px-6 py-3 text-sm md:text-base gap-2",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === "left" && <span className="inline-flex">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === "right" && <span className="inline-flex">{icon}</span>}
    </button>
  );
};

export default Button;
