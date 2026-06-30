// ────────────────────────────────────────────────────────────────────────────
// src/pages/AboutUs.tsx —
// ────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Cpu, Database, ArrowLeft } from 'lucide-react';

interface LegalProps {
  onBack: () => void;
}

export const AboutUs: React.FC<LegalProps> = ({ onBack }) => {
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
            <Terminal size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">About CleanFlow AI</h1>
            <p className="text-xs text-gray-600 mt-1 font-mono">Our Vision & Core Architecture</p>
          </div>
        </div>

        {/* Humanized & SEO Rich Content Section */}
        <div className="space-y-6 text-sm leading-relaxed text-gray-400">
          <p>
            CleanFlow AI was born out of a very simple realization: spending hours writing repetitive scripts just to fix broken spreadsheets is frustrating. Whether you are a developer, a market researcher, a student, or a business analyst, wrestling with null inputs, formatting anomalies, and duplicate fields takes away from the real work you want to do.
          </p>
          <p>
            We designed this **free AI-powered data cleaning tool strictly for people**. We believe that advanced data profiling and dataset optimization should be accessible to everyone through a fast, point-and-click interface—without requiring you to run complex Python scripts or pay for enterprise-tier software.
          </p>

          {/* Interactive Feature Value Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-[#111318] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                <Cpu size={14} /> Automated Data Profiling
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Our platform applies real-time math matrices to assess missing data fields, evaluate category string formats, and trigger automatic outlier detection algorithms.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111318] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
                <Database size={14} /> Local-First Security First
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                By utilizing transient, stateless memory streams, your uploaded data is never saved to a database. Everything stays safe within your open session context.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
