import React from 'react';
import { cn } from '../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = [
      'flex w-full rounded-lg border px-3 py-2 text-sm',
      'placeholder:text-gray-500',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-colors duration-200',
    ];

    const variants = {
      default: [
        'border-gray-300 bg-white',
        'focus:border-blue-500',
      ],
      filled: [
        'border-gray-200 bg-gray-50',
        'focus:border-blue-500 focus:bg-white',
      ],
      outlined: [
        'border-2 border-gray-300 bg-transparent',
        'focus:border-blue-500',
      ],
    };

    const inputClasses = cn(
      baseClasses,
      variants[variant],
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            className={inputClasses}
            disabled={disabled}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
