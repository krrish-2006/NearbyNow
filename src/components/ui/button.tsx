import { ButtonHTMLAttributes } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "danger";

interface Props
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: Props) {
  const baseStyles =
    "cursor-pointer rounded-2xl px-6 py-3 font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50";

  const variants = {
    primary:
      "bg-black text-white shadow-md hover:scale-[1.03] hover:shadow-xl",

    secondary:
      "border bg-white shadow-sm hover:scale-[1.03] hover:bg-neutral-100 hover:shadow-lg",

    danger:
      "border-2 border-red-500 bg-red-100 text-red-600 shadow-sm hover:scale-[1.03] hover:bg-red-600 hover:text-white hover:shadow-xl",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
