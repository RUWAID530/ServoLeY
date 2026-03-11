import React from 'react';
import { cn } from '../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    disabled,
    children,
    ...props 
  }, ref) => {
    const baseClasses = [
      'inline-flex items-center justify-center',
      'font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ];

    const variants = {
      primary: [
        'bg-blue-600 text-white',
        'hover:bg-blue-700',
        'focus:ring-blue-500',
        'shadow-sm hover:shadow-md',
      ],
      secondary: [
        'bg-gray-100 text-gray-900',
        'hover:bg-gray-200',
        'focus:ring-gray-500',
        'border border-gray-300',
      ],
      outline: [
        'bg-transparent text-gray-700',
        'hover:bg-gray-50',
        'focus:ring-blue-500',
        'border border-gray-300',
      ],
      ghost: [
        'bg-transparent text-gray-700',
        'hover:bg-gray-100',
        'focus:ring-gray-500',
      ],
      danger: [
        'bg-red-600 text-white',
        'hover:bg-red-700',
        'focus:ring-red-500',
        'shadow-sm hover:shadow-md',
      ],
      success: [
        'bg-green-600 text-white',
        'hover:bg-green-700',
        'focus:ring-green-500',
        'shadow-sm hover:shadow-md',
      ],
    };

    const sizes = {
      xs: ['text-xs px-2.5 py-1.5 rounded'],
      sm: ['text-sm px-3 py-2 rounded-md'],
      md: ['text-sm px-4 py-2.5 rounded-lg'],
      lg: ['text-base px-6 py-3 rounded-lg'],
      xl: ['text-lg px-8 py-4 rounded-xl'],
    };

    const classes = cn(
      baseClasses,
      variants[variant],
      sizes[size],
      fullWidth && 'w-full',
      className
    );

    const renderIcon = () => {
      if (!icon) return null;
      
      const iconClasses = cn(
        'flex-shrink-0',
        size === 'xs' && 'h-3 w-3',
        size === 'sm' && 'h-4 w-4',
        size === 'md' && 'h-4 w-4',
        size === 'lg' && 'h-5 w-5',
        size === 'xl' && 'h-6 w-6',
        iconPosition === 'left' && 'mr-2',
        iconPosition === 'right' && 'ml-2'
      );

      return <span className={iconClasses}>{icon}</span>;
    };

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className={cn(
              'animate-spin',
              size === 'xs' && 'h-3 w-3',
              size === 'sm' && 'h-4 w-4',
              size === 'md' && 'h-4 w-4',
              size === 'lg' && 'h-5 w-5',
              size === 'xl' && 'h-6 w-6',
              iconPosition === 'left' ? 'mr-2' : 'mr-0',
              iconPosition === 'right' ? 'ml-2' : 'ml-0'
            )}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {!loading && iconPosition === 'left' && renderIcon()}
        
        <span className="flex-1">{children}</span>
        
        {!loading && iconPosition === 'right' && renderIcon()}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
