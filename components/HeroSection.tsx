import { motion } from 'framer-motion';
import { Microscope, Sparkles, BookOpen } from 'lucide-react';

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden gradient-hero py-24 px-6 rounded-b-[3rem] mb-12">
      {/* Decorative botanical pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5c0 13.807-11.193 25-25 25S-20 43.807-20 30 30 5 30 5z' fill='%23fff' fill-opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px',
      }} />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground/80 text-sm font-body">
            <Sparkles className="w-3.5 h-3.5" />
            Digital Cabinet of Curiosities
          </div>

          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-[1.1] tracking-tight">
            The Digital
            <br />
            <span className="italic text-gold">Conservatory</span>
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/75 font-body max-w-2xl mx-auto leading-relaxed">
            A high-fidelity archive for the serious steward. 
            Protect life, document wonder, and bridge the ancestral gap.
          </p>

          <div className="flex flex-wrap justify-center gap-8 pt-4 text-primary-foreground/60 text-sm font-body">
            <div className="flex items-center gap-2">
              <Microscope className="w-4 h-4" />
              Cultivar Synthesis
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Living Placards
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Stewardship Journal
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background/20 to-transparent" />
    </section>
  );
};
