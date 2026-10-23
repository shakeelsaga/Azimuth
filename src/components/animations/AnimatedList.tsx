'use client';

import { motion, AnimatePresence } from 'motion/react';
import type { ReactNode } from 'react';

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  /** Unique key for remounting on day switch */
  listKey?: string;
}

export function AnimatedList({ children, className = '', listKey }: AnimatedListProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={listKey}
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
        {children.map((child, index) => (
          <motion.div
            key={index}
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
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
