import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';

interface LegalProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<LegalProps> = ({ onBack }) => {
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
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-gray-600 mt-1 font-mono">Last updated: July 2026</p>
          </div>
        </div>

        {/* Content blocks */}
        <div className="space-y-6 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">1. Data Minimization & Processing Integrity</h2>
            <p>
              CleanFlow AI processes uploading operations utilizing ephemeral, transient in-memory memory mapping architecture sequences. **Your imported workspace data matrices (CSV, XLSX) are never committed to permanent storage structures, data repositories, or underlying cloud databases.** </p>
            <p>
              All cleaning transformations run securely in the memory footprint runtime context and clear immediately when your active browsing session instance is terminated or expired.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">2. Third-Party Advertising & Cookies</h2>
            <p>
              This digital platform integrates Google AdSense behavioral telemetry services. Google utilizes tracking assets (including cookies) to serve custom advertisements based on user navigation paths across this interface and external destination targets.
            </p>
            <p>
              Users retain complete control to toggle off personalized tracking options via individual Google account dashboard preferences or browser cookie management adjustments.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">3. Information Protection</h2>
            <p>
              Communication vectors traveling between your local workstation client interface and our hosting endpoints are encrypted using standardized Transport Layer Security protocol tunnels.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
};
