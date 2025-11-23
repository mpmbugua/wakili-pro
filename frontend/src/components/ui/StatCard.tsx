import React from 'react';
import { ArrowUp, ArrowDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  iconColor?: string;
  description?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  iconColor = 'text-primary-600',
  description,
  className,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4" />;
      case 'down':
        return <ArrowDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className={cn('bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-slate-900">{value}</p>
          
          {description && (
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          )}
        </div>

        {Icon && (
          <div className={cn('p-3 rounded-lg bg-primary-50', iconColor)}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="mt-4 flex items-center gap-2">
          <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium', getTrendColor())}>
            {getTrendIcon()}
            {change}
          </span>
          <span className="text-xs text-slate-500">vs last period</span>
        </div>
      )}
    </div>
  );
};
