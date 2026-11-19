import React, { useState } from 'react';
import { Module1Motivation } from './components/Module1Motivation';
import { Module2MathFoundations } from './components/Module2MathFoundations';
import { Module3FourTypes } from './components/Module3FourTypes';
import { Module4Architecture } from './components/Module4Architecture';
import { Module5Practice } from './components/Module5Practice';
import { FormulaSheetDrawer } from './components/FormulaSheetDrawer';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';

type ModuleId = 'motivation' | 'math' | 'types' | 'architecture' | 'practice';

const MODULES: { id: ModuleId; navLabel: string; stepTitle: string }[] = [
  { id: 'motivation', navLabel: 'Why Linear Phase', stepTitle: '01. Phase Distortion & Motivation' },
  { id: 'math', navLabel: 'Symmetry & Phase', stepTitle: '02. Symmetry & Linear Phase Math' },
  { id: 'types', navLabel: '4 Filter Types', stepTitle: '03. Types I–IV & Z-Plane Zeros' },
  { id: 'architecture', navLabel: 'Folded Architecture', stepTitle: '04. Folded & Cascade Realization' },
  { id: 'practice', navLabel: 'Worked Practice', stepTitle: '05. Worked Examples & Exam Check' },
];

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('motivation');
  const [formulaOpen, setFormulaOpen] = useState<boolean>(false);

  const activeIdx = MODULES.findIndex((m) => m.id === activeModule);
  const prevModule = activeIdx > 0 ? MODULES[activeIdx - 1] : null;
  const nextModule = activeIdx < MODULES.length - 1 ? MODULES[activeIdx + 1] : null;

  const handleSelectModule = (id: ModuleId) => {
    setActiveModule(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Navigation Bar: Strict 3-zone contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => handleSelectModule('motivation')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display focus-visible:outline-2 focus-visible:outline-sky-600 rounded"
          >
            LinearPhase DSP
          </button>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav
            aria-label="Lecture modules"
            className="hidden lg:flex items-center gap-6 text-sm font-medium"
          >
            {MODULES.map((mod) => {
              const isActive = mod.id === activeModule;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => handleSelectModule(mod.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'text-sky-700 border-sky-600 font-semibold'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {mod.navLabel}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setFormulaOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-600"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Formula Sheet
            </button>
          </div>
        </div>

        {/* Mobile / Tablet compact horizontal module switcher */}
        <div className="lg:hidden border-t border-slate-200 bg-slate-50 px-4 py-2 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {MODULES.map((mod) => {
              const isActive = mod.id === activeModule;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => handleSelectModule(mod.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white text-sky-700 shadow-sm border border-slate-200 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mod.navLabel}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Interactive Learning Stage */}
      <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-8 py-8">
        {activeModule === 'motivation' && <Module1Motivation />}
        {activeModule === 'math' && <Module2MathFoundations />}
        {activeModule === 'types' && <Module3FourTypes />}
        {activeModule === 'architecture' && <Module4Architecture />}
        {activeModule === 'practice' && <Module5Practice />}

        {/* Sequential Stage Navigation */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          {prevModule ? (
            <button
              type="button"
              onClick={() => handleSelectModule(prevModule.id)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous: {prevModule.stepTitle}
            </button>
          ) : (
            <div />
          )}

          {nextModule && (
            <button
              type="button"
              onClick={() => handleSelectModule(nextModule.id)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors"
            >
              Next: {nextModule.stepTitle}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 px-4 sm:px-8">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>EE3621 Digital Signal Processing · Lecture 16: FIR Filter — Linear-Phase Realization</span>
          <span>
            <button
              type="button"
              onClick={() => setFormulaOpen(true)}
              className="text-sky-700 hover:underline font-medium"
            >
              Open Complete Lecture 16 Formula Sheet
            </button>
          </span>
        </div>
      </footer>

      <FormulaSheetDrawer open={formulaOpen} onClose={() => setFormulaOpen(false)} />
    </div>
  );
}
