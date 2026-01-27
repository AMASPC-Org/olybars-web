import React from 'react';

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  delayStep?: number; // ms to delay each child
  initialDelay?: number; // ms before starting
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className = '',
  delayStep = 50,
  initialDelay = 0
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        return (
          <div
            style={{
              animation: `fade-slide-up 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
              animationDelay: `${initialDelay + index * delayStep}ms`,
              opacity: 0 // Start hidden so animation reveals it
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};
