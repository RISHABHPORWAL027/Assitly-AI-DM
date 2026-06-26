import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'instagram' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  instagram: 'btn-instagram',
  danger: 'btn-danger',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[variantClass[variant], sizeClass[size], className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
