import React from "react";
import { cn } from "../../lib/utils";

interface InteractionBaseProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  as?: any;
  debug?: boolean;
  disabled?: boolean;
}

/**
 * [DRUNK THUMB PROTOCOL] InteractionBase
 *
 * This component systematically enforces the 44px minimum touch target requirement
 * mandated by the Drunk Thumb UI standard. It uses a combination of padding and
 * invisible Hit Area expansion.
 */
export const InteractionBase: React.FC<InteractionBaseProps> = ({
  children,
  onClick,
  className,
  as: Component = "button",
  debug = false,
  disabled = false,
}) => {
  return (
    <Component
      onClick={onClick}
      disabled={disabled && Component === "button"}
      className={cn(
        "relative transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100",
        // The "Drunk Thumb" Expansion Layer
        // Ensures 44px minimum hit area even if visual element is smaller
        "before:content-[''] before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2",
        "before:min-w-[44px] before:min-h-[44px] before:w-full before:h-full",
        debug && "before:bg-primary/20 before:border before:border-primary",
        className,
      )}
    >
      {children}
      {debug && (
        <span className="absolute -top-6 left-0 text-[8px] font-bold bg-primary text-black px-1 rounded uppercase tracking-tighter">
          Drunk Thumb Area
        </span>
      )}
    </Component>
  );
};
