// ────────────────────────────────────────────────────────────────────────────
// src/pages/ContactUs.tsx —
// ────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Github, Linkedin, ArrowLeft } from 'lucide-react';

interface LegalProps {
  onBack: () => void;
}

export const ContactUs: React.FC<LegalProps> = ({ onBack }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#0a0b0f] text-gray-300 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-xl mx-auto space-y-8">
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
            <Mail size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Get in Touch</h1>
            <p className="text-xs text-gray-600 mt-1 font-mono">User Support & Collaboration Channels</p>
          </div>
        </div>

        {/* Humanized copy with embedded SEO anchors */}
        <div className="space-y-5 text-sm leading-relaxed text-center">
          <p className="text-gray-400 text-left mb-6">
            CleanFlow AI is built for everyone who handles data, and your real-world feedback makes it better. Whether you have a brilliant feature request, want to submit a layout bug report, or simply want to chat about data preprocessing, pandas logic, or automated data profiling, feel free to drop a line! Reach out directly through any of the channels below:
          </p>

          <div className="space-y-3">
            {/* Email link */}
            <a 
              href="mailto:youremail@domain.com" 
              className="flex items-center gap-4 p-4 rounded-xl bg-[#111318] border border-white/5 hover:border-indigo-500/20 text-gray-300 hover:text-white transition-all group"
            >
              <Mail size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="text-xs text-gray-500 font-medium">Direct User Support Email</p>
                <p className="text-sm font-mono mt-0.5">youremail@domain.com</p>
              </div>
            </a>

            {/* GitHub Profile */}
            <a 
              href="https://github.com/konainfatima28" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl bg-[#111318] border border-white/5 hover:border-teal-500/20 text-gray-300 hover:text-white transition-all group"
            >
              <Github size={18} className="text-teal-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="text-xs text-gray-500 font-medium">Open Source Repository & Profile</p>
                <p className="text-sm font-mono mt-0.5">github.com/konainfatima28</p>
              </div>
            </a>

            {/* LinkedIn Profile */}
            <a 
              href="https://linkedin.com/in/konainfatima" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl bg-[#111318] border border-white/5 hover:border-sky-500/20 text-gray-300 hover:text-white transition-all group"
            >
              <Linkedin size={18} className="text-sky-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="text-xs text-gray-500 font-medium">Professional Networking</p>
                <p className="text-sm font-mono mt-0.5">linkedin.com/in/konainfatima</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
