import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface CardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', children, hoverEffect = true, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={`bg-c-surface border border-white/5 rounded-[2rem] overflow-hidden ${hoverEffect ? 'hover:bg-white/5 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 hover:shadow-[0_40px_100px_rgba(0,0,0,0.6)]' : ''} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Card.displayName = 'Card';
