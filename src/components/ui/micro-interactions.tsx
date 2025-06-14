
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({ 
  children, 
  delay = 0, 
  duration = 300, 
  className 
}) => {
  return (
    <div 
      className={cn(
        'animate-in fade-in-0 slide-in-from-bottom-4',
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};

interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
}

export const SlideIn: React.FC<SlideInProps> = ({ 
  children, 
  direction = 'up', 
  delay = 0, 
  duration = 300,
  className 
}) => {
  const getDirectionClass = () => {
    switch (direction) {
      case 'left': return 'slide-in-from-left-4';
      case 'right': return 'slide-in-from-right-4';
      case 'up': return 'slide-in-from-bottom-4';
      case 'down': return 'slide-in-from-top-4';
      default: return 'slide-in-from-bottom-4';
    }
  };

  return (
    <div 
      className={cn(
        'animate-in',
        getDirectionClass(),
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const ScaleIn: React.FC<ScaleInProps> = ({ 
  children, 
  delay = 0, 
  duration = 300,
  className 
}) => {
  return (
    <div 
      className={cn(
        'animate-in zoom-in-95',
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};

interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  staggerDelay = 100,
  className
}) => {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn key={index} delay={index * staggerDelay}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
};

interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
}

export const HoverCard: React.FC<HoverCardProps> = ({ children, className }) => {
  return (
    <div className={cn(
      'transition-all duration-300 ease-out',
      'hover:scale-[1.02] hover:shadow-lg hover:-translate-y-1',
      'active:scale-[0.98] active:shadow-sm active:translate-y-0',
      className
    )}>
      {children}
    </div>
  );
};

interface PulseProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

export const Pulse: React.FC<PulseProps> = ({ children, active = false, className }) => {
  return (
    <div className={cn(
      'transition-all duration-200',
      active ? 'animate-pulse' : '',
      className
    )}>
      {children}
    </div>
  );
};
