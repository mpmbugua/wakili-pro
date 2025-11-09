import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'bordered';
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, ...props }, ref) => {
    const variants = {
      default: [
        'bg-white border border-gray-200/60',
        'shadow-sm shadow-gray-900/5',
        'rounded-2xl'
      ],
      glass: [
        'bg-white/80 backdrop-blur-xl border border-white/20',
        'shadow-lg shadow-gray-900/10',
        'rounded-2xl'
      ],
      elevated: [
        'bg-white border-0',
        'shadow-xl shadow-gray-900/10',
        'rounded-2xl'
      ],
      bordered: [
        'bg-white border-2 border-gray-100',
        'shadow-none',
        'rounded-2xl'
      ]
    };

    const hoverEffects = hover ? [
      'transition-all duration-300 ease-out',
      'hover:shadow-xl hover:shadow-gray-900/15',
      'hover:-translate-y-1 hover:scale-[1.02]',
      'cursor-pointer'
    ] : [];

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          'text-gray-900',
          variants[variant],
          hoverEffects,
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-2 p-6 pb-4',
      className
    )}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-xl font-semibold text-gray-900',
      'leading-tight tracking-tight',
      '-apple-system, BlinkMacSystemFont, San Francisco, sans-serif',
      className
    )}
    {...props}
  />
));

CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-sm text-gray-600 leading-relaxed',
      className
    )}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn('px-6 pb-6', className)} 
    {...props} 
  />
));

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-between px-6 py-4',
      'border-t border-gray-100 bg-gray-50/50',
      className
    )}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };