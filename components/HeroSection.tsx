
import React from 'react';
import { motion } from 'framer-motion';
import { Microscope, Sparkles, BookOpen, Waves, Flower2 } from 'lucide-react';

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-24 px-6 mb-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
      {/* Decorative aquatic pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 10c0 22.091-17.909 40-40 40S-30 67.909-30 50 10 10 50 10z' fill='%2310b981' fill-opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '100px 100px',
      }} />

      {/* Gold top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-gold-muted via-gold to-gold-muted z-20" />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            AI-Powered Curator Pipeline
          </div>

          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
            The Living
            <br />
            <span className="italic text-gold">Conservatory</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 font-body max-w-2xl mx-auto leading-relaxed">
            An intelligent research engine that cross-references authoritative sources, 
            synthesizes biological truth, and curates your digital ecosystem with museum-grade placards.
          </p>

          <div className="flex flex-wrap justify-center gap-8 pt-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Microscope className="w-4 h-4 text-gold" />
              Multi-Source Synthesis
            </div>
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-cyan-400" />
              Aquatic Specialization
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Living Field Journal
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950/50 to-transparent" />
    </section>
  );
};
