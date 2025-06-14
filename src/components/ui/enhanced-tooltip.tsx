
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Info, HelpCircle } from 'lucide-react';

interface EnhancedTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  title?: string;
  variant?: 'default' | 'info' | 'help' | 'rich';
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  showIcon?: boolean;
  delay?: number;
}

export const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  children,
  content,
  title,
  variant = 'default',
  side = 'top',
  className,
  showIcon = false,
  delay = 200,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900 max-w-xs';
      case 'help':
        return 'bg-purple-50 border-purple-200 text-purple-900 max-w-sm';
      case 'rich':
        return 'bg-white border-slate-200 text-slate-900 max-w-md shadow-lg';
      default:
        return 'bg-slate-900 border-slate-800 text-white max-w-xs';
    }
  };

  const renderIcon = () => {
    if (!showIcon) return null;
    
    switch (variant) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'help':
        return <HelpCircle className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <TooltipProvider delayDuration={delay}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 cursor-help">
            {children}
            {renderIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className={cn(
            'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            getVariantStyles(),
            className
          )}
        >
          {variant === 'rich' && title && (
            <div className="font-semibold text-sm mb-2 text-slate-900">
              {title}
            </div>
          )}
          <div className={cn(
            'text-sm',
            variant === 'rich' ? 'text-slate-700' : ''
          )}>
            {content}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default EnhancedTooltip;
