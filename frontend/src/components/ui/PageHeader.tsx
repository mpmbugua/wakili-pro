import React from 'react';
import { cn } from '../../utils/cn';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: React.ReactNode;
  tabs?: Array<{
    label: string;
    href: string;
    active?: boolean;
  }>;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  description,
  actions,
  tabs,
  className,
}) => {
  return (
    <div className={cn('mb-6', className)}>
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {subtitle && (
            <p className="text-sm font-medium text-primary-600 mb-1">{subtitle}</p>
          )}
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-slate-600 max-w-3xl">{description}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-3 ml-4">
            {actions}
          </div>
        )}
      </div>

      {/* Tabs Section */}
      {tabs && tabs.length > 0 && (
        <div className="border-b border-slate-200">
          <nav className="flex gap-6">
            {tabs.map((tab) => (
              <a
                key={tab.label}
                href={tab.href}
                className={cn(
                  'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
                  tab.active
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                )}
              >
                {tab.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
};
