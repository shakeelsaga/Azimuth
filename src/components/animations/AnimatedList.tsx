'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Children, isValidElement, type ReactNode } from 'react';

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  /** Unique key for remounting on day switch */
  listKey?: string;
}

export function AnimatedList({ children, className = '', listKey }: AnimatedListProps) {
  const flatChildren = Children.toArray(children);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={listKey || 'animated-list'}
        className={className}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.06 },
          },
        }}
      >
        {flatChildren.map((child, index) => {
          const itemKey = isValidElement(child) && child.key ? `anim-${child.key}` : `anim-item-${index}`;
          return (
            <motion.div
              key={itemKey}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
                },
              }}
            >
              {child}
            </motion.div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
