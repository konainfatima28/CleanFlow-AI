// ────────────────────────────────────────────────────────────────────────────
// src/pages/TermsOfService.tsx — HUMANIZED & SEO OPTIMIZED PRODUCTION VERSION
// ────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';

interface LegalProps {
  onBack: () => void;
}

export const TermsOfService: React.FC<LegalProps> = ({ onBack }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#0a0b0f] text-gray-300 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Back navigation */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-indigo-400 transition-colors focus:outline-none"
        >
          <ArrowLeft size={14} /> Back to Application
        </button>

        {/* Title row */}
        <div className="flex items-center gap-3 pb-6 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Terms of Service</h1>
            <p className="text-xs text-gray-600 mt-1 font-mono">Fair Use Guidelines & Platform Responsibility</p>
          </div>
        </div>

        {/* Humanized & SEO-Friendly Content Blocks */}
        <div className="space-y-6 text-sm leading-relaxed text-gray-400">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">1. Ownership & Data Permissions</h2>
            <p>
              When you use CleanFlow AI to process spreadsheet structures, we expect that you have the proper right, permission, or ownership over the files you choose to import. Please make sure your use of our platform respects standard privacy guidelines and data compliance metrics before optimizing your datasets.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">2. Temporary Memory Processing</h2>
            <p>
              CleanFlow AI operates strictly as a local, transient workspace helper. Your datasets (CSV, XLSX) are temporarily opened in-memory to provide quick profiling statistics and one-click cleaning steps. We do not offer file backup options or permanent file storage. Once you close your active browser session tab, your rows are permanently discarded from memory.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">3. Disclaimers & Limitations</h2>
            <p>
              This utility is provided entirely **"as-is"**. While we try our best to make our automated cleaning operations and outlier parameters highly accurate, we cannot guarantee perfection. You maintain full responsibility for checking the formatting integrity of your exported sheets before using them in live data pipelines or machine learning applications.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
};
