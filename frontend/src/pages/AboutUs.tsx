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
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-indigo-400 transition-colors focus:outline-none"
        >
          <ArrowLeft size={14} /> Back to Application
        </button>

        <div className="flex items-center gap-3 pb-6 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Terminal size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">About CleanFlow AI</h1>
            <p className="text-xs text-gray-600 mt-1 font-mono">Platform Purpose & Architecture</p>
          </div>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          <p>
            CleanFlow AI was engineered to address a persistent bottleneck in modern data pipelines: the repetitive, manual script-writing required to perform standard data profiling and cleansing workflows. 
          </p>
          <p>
            Developed as a specialized **B.Tech Computer Science Engineering capstone project**, the platform bridges the gap between raw data matrices and machine learning-ready datasets through an intuitive web-based interface.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-[#111318] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                <Cpu size={14} /> Computational Scoring
              </div>
              <p className="text-xs text-gray-400">
                Utilizes dynamic mathematical rule sets to calculate composite data quality metrics across completeness, category formatting, and outlier bounds.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111318] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
                <Database size={14} /> Stateless Architecture
              </div>
              <p className="text-xs text-gray-400">
                Employs transient memory-mapping tunnels that eliminate persistent database risk, giving engineers total compliance security while dealing with large matrices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
