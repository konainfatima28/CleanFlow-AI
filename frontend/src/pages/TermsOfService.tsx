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
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-indigo-400 transition-colors focus:outline-none"
        >
          <ArrowLeft size={14} /> Back to Application
        </button>

        <div className="flex items-center gap-3 pb-6 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Terms of Service</h1>
            <p className="text-xs text-gray-600 mt-1 font-mono">Usage Policy & Platform Agreements</p>
          </div>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">1. Platform Usage Consent</h2>
            <p>
              By uploading data assets to the CleanFlow AI web application dashboard, you affirm that you possess the explicit distribution rights, ownership parameters, or regulatory compliance permissions for the target matrix. 
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">2. Transient Computational Boundaries</h2>
            <p>
              CleanFlow AI acts strictly as a mathematical processing wrapper utility. Data ingestion is executed fully within transient memory spaces. The platform does not guarantee backup redundancy channels, and files are auto-erased systematically upon browser session termination. 
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">3. Absolute Limitation of Liability</h2>
            <p>
              The platform, code frameworks, and analytical parsing output generation are delivered completely **"as-is"**. The creators maintain zero liability for processing anomalies, dataset structural drops, or data loss events occurring during algorithmic operations.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
};
