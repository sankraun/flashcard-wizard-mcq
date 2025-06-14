
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AnimatedButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean;
  success?: boolean;
  animationType?: 'scale' | 'slide' | 'bounce' | 'pulse';
  children: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  loading = false,
  success = false,
  animationType = 'scale',
  className,
  children,
  disabled,
  ...props
}) => {
  const getAnimationClass = () => {
    switch (animationType) {
      case 'scale':
        return 'transition-all duration-200 hover:scale-105 active:scale-95';
      case 'slide':
        return 'transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg active:translate-y-0';
      case 'bounce':
        return 'transition-all duration-200 hover:animate-bounce';
      case 'pulse':
        return 'transition-all duration-200 hover:animate-pulse';
      default:
        return '';
    }
  };

  const getStateClass = () => {
    if (loading) return 'opacity-80 cursor-not-allowed';
    if (success) return 'bg-green-500 hover:bg-green-600 border-green-500';
    return '';
  };

  return (
    <Button
      className={cn(
        getAnimationClass(),
        getStateClass(),
        'relative overflow-hidden',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      <span className={cn(
        'flex items-center gap-2 transition-opacity duration-200',
        loading ? 'opacity-0' : 'opacity-100'
      )}>
        {children}
      </span>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}
      
      {success && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500 transition-all duration-300">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </Button>
  );
};

export default AnimatedButton;
