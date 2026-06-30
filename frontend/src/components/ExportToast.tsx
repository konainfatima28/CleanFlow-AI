import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Coffee, X } from 'lucide-react';

interface ExportToastProps {
  isVisible: boolean;
  onClose: () => void;
  rowCount?: number;
}

export const ExportToast: React.FC<ExportToastProps> = ({ isVisible, onClose, rowCount = 0 }) => {
  const DONATION_URL = "https://www.buymeacoffee.com/yourusername";

  // Automatically dismiss the popup after 7 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 7000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 w-85 rounded-xl bg-white p-4 shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col gap-3"
        >
          {/* Header Row */}
          <div className="flex items-start justify-between">
            <div className="flex gap-2.5">
              <CheckCircle className="text-teal-500 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Dataset Exported!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  CleanFlow optimized your file seamlessly.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={16} />
            </button>
          </div>

          {/* Micro-Note & Call to Action */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
            Saved your debugging time? Support this completely free workspace!
          </div>

          <div className="flex gap-2 justify-end">
            <button 
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Dismiss
            </button>
            <a
              href={DONATION_URL}
              target="_blank"
              rel="noreferrer"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors shadow-sm"
            >
              <Coffee size={12} />
              Support Creator
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
