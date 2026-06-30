// ────────────────────────────────────────────────────────────────────────────
// src/pages/PrivacyPolicy.tsx — 
// ────────────────────────────────────────────────────────────────────────────

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

        {/* Humanized & SEO-Friendly Content Blocks */}
        <div className="space-y-6 text-sm leading-relaxed text-gray-400">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">1. Your Data Stays Yours (In-Memory Processing)</h2>
            <p>
              We believe your data belongs to you. CleanFlow AI is built to handle file uploads entirely within transient, temporary in-memory sessions. **Your uploaded workspace files (like CSV datasets or Excel XLSX spreadsheets) are never saved to a database, cloud repository, or permanent storage disk.**
            </p>
            <p>
              All data cleaning operations, outlier filtering, and profiling features run inside a fleeting runtime context. The moment you close your tab or let your session expire, everything disappears completely.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">2. Google AdSense & Third-Party Cookies</h2>
            <p>
              To keep this app free for everyone, we use Google AdSense to serve relevant advertisements. Google uses cookies and unique tracking tokens to serve custom ads based on your visits to CleanFlow AI and other corners of the web.
            </p>
            <p>
              You are completely in control of your advertising footprint. You can opt out of personalized tracking at any time by updating your personal Google Ad preferences or adjusting your web browser's cookie blocking settings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">3. Secure Information Protection</h2>
            <p>
              Even though your data is strictly temporary, your transmission vectors are treated with enterprise safety parameters. All communication between your local computer and our hosting infrastructure is shielded behind secure Transport Layer Security (TLS) encryption protocols.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
};
