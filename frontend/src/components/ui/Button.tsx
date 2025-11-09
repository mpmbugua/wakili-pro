import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'default';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    icon,
    iconPosition = 'left',
    children,
    disabled,
    ...props 
  }, ref) => {
    
    const baseStyles = [
      // Base styling with modern Apple-inspired design
      'inline-flex items-center justify-center',
      'font-medium transition-all duration-200 ease-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none',
      'active:transform active:scale-[0.98]',
      'select-none relative overflow-hidden'
    ];

    const variants = {
      default: [
        'bg-gradient-to-r from-gray-500 to-gray-600',
        'text-white shadow-lg shadow-gray-500/25',
        'hover:from-gray-600 hover:to-gray-700 hover:shadow-xl hover:shadow-gray-500/30',
        'focus:ring-gray-500/50',
        'border-0'
      ],
      primary: [
        'bg-gradient-to-r from-blue-500 to-blue-600',
        'text-white shadow-lg shadow-blue-500/25',
        'hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-500/30',
        'focus:ring-blue-500/50',
        'border-0'
      ],
      secondary: [
        'bg-gradient-to-r from-amber-500 to-amber-600',
        'text-white shadow-lg shadow-amber-500/25',
        'hover:from-amber-600 hover:to-amber-700 hover:shadow-xl hover:shadow-amber-500/30',
        'focus:ring-amber-500/50',
        'border-0'
      ],
      outline: [
        'bg-white/80 backdrop-blur-sm',
        'text-gray-700 border-2 border-gray-200',
        'hover:bg-gray-50 hover:border-gray-300 hover:shadow-md',
        'focus:ring-gray-500/50',
        'shadow-sm'
      ],
      ghost: [
        'bg-transparent text-gray-700',
        'hover:bg-gray-100/80 hover:text-gray-900',
        'focus:ring-gray-500/50',
        'border-0'
      ],
      destructive: [
        'bg-gradient-to-r from-red-500 to-red-600',
        'text-white shadow-lg shadow-red-500/25',
        'hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/30',
        'focus:ring-red-500/50',
        'border-0'
      ],
      success: [
        'bg-gradient-to-r from-emerald-500 to-emerald-600',
        'text-white shadow-lg shadow-emerald-500/25',
        'hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl hover:shadow-emerald-500/30',
        'focus:ring-emerald-500/50',
        'border-0'
      ]
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm rounded-lg min-h-[36px]',
      md: 'px-4 py-2.5 text-sm rounded-lg min-h-[40px]',
      lg: 'px-6 py-3 text-base rounded-xl min-h-[48px]',
      xl: 'px-8 py-4 text-lg rounded-xl min-h-[56px]'
    };

    const loadingSpinner = (
      <svg 
        className="animate-spin h-4 w-4" 
        xmlns="http://www.w3.org/2000/svg" 
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
    );

    const iconElement = isLoading ? loadingSpinner : icon;

    return (
      <button
        ref={ref}
        className={cn(
          ...baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {iconElement && iconPosition === 'left' && (
          <span className={cn("flex items-center", children ? "mr-2" : "")}>
            {iconElement}
          </span>
        )}
        
        {children && (
          <span className={isLoading ? "opacity-70" : ""}>
            {children}
          </span>
        )}
        
        {iconElement && iconPosition === 'right' && (
          <span className={cn("flex items-center", children ? "ml-2" : "")}>
            {iconElement}
          </span>
        )}

        {/* Subtle shine effect on hover */}
        <span className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };