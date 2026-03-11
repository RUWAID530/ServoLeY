import React from 'react';
import { cn } from '../utils/cn';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallback?: string;
  children?: React.ReactNode;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ 
    className, 
    src, 
    alt = '', 
    size = 'md', 
    fallback,
    children,
    ...props 
  }, ref) => {
    const sizes = {
      xs: ['h-6 w-6 text-xs'],
      sm: ['h-8 w-8 text-sm'],
      md: ['h-10 w-10 text-base'],
      lg: ['h-12 w-12 text-lg'],
      xl: ['h-16 w-16 text-xl'],
      '2xl': ['h-20 w-20 text-2xl'],
    };

    const classes = cn(
      'relative inline-flex items-center justify-center',
      'rounded-full bg-gray-100 text-gray-600 font-medium',
      'border-2 border-white shadow-sm',
      sizes[size],
      className
    );

    if (src) {
      return (
        <div ref={ref} className={classes} {...props}>
          <img
            src={src}
            alt={alt}
            className="h-full w-full rounded-full object-cover"
            onError={(e) => {
              // Hide broken image and show fallback
              e.currentTarget.style.display = 'none';
            }}
          />
          {fallback && (
            <span className="absolute inset-0 flex items-center justify-center">
              {fallback.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      );
    }

    return (
      <div ref={ref} className={classes} {...props}>
        {children || (fallback && fallback.charAt(0).toUpperCase())}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
