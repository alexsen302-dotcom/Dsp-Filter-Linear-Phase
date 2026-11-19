import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface FormulaSheetDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const FormulaSheetDrawer: React.FC<FormulaSheetDrawerProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="formula-drawer-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl h-full overflow-y-auto bg-white border-l border-slate-200 p-6 sm:p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <p className="text-xs font-medium text-sky-700">EE3621 · Lecture 16 Quick Reference</p>
            <h2 id="formula-drawer-title" className="text-xl font-bold text-slate-900 mt-1">
              Linear-Phase FIR Formulas & Classification
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-sky-600"
            aria-label="Close formula sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-8 text-sm text-slate-700">
          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-3">
              01. Delay Metrics & Phase Conditions
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs font-medium text-slate-500 mb-1">Phase Delay</div>
                <div className="font-mono text-sm text-slate-900">τ_p(ω) = −θ(ω) / ω</div>
                <p className="text-xs text-slate-600 mt-1.5">Delay of a single pure sinusoidal carrier.</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs font-medium text-slate-500 mb-1">Group Delay</div>
                <div className="font-mono text-sm text-slate-900">τ_g(ω) = −dθ(ω) / dω</div>
                <p className="text-xs text-slate-600 mt-1.5">Delay of the modulation envelope / packet.</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs font-medium text-slate-500 mb-1">Pure Linear Phase (Symmetric)</div>
                <div className="font-mono text-sm text-slate-900">θ(ω) = −αω, β = 0</div>
                <div className="font-mono text-xs text-sky-700 mt-1">h[n] = h[M − 1 − n], α = (M−1)/2</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs font-medium text-slate-500 mb-1">Generalized Linear Phase (Antisymmetric)</div>
                <div className="font-mono text-sm text-slate-900">θ(ω) = ±π/2 − αω</div>
                <div className="font-mono text-xs text-sky-700 mt-1">h[n] = −h[M − 1 − n], α = (M−1)/2</div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-3">
              02. The Four Linear-Phase FIR Filter Types
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Length M</th>
                    <th className="py-2.5 px-3">Symmetry</th>
                    <th className="py-2.5 px-3">Group Delay τ_g</th>
                    <th className="py-2.5 px-3">ω = 0</th>
                    <th className="py-2.5 px-3">ω = π</th>
                    <th className="py-2.5 px-3">Allowed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">Type I</td>
                    <td className="py-2.5 px-3">Odd</td>
                    <td className="py-2.5 px-3">Even (+)</td>
                    <td className="py-2.5 px-3">(M−1)/2 (int)</td>
                    <td className="py-2.5 px-3 text-emerald-700">Free</td>
                    <td className="py-2.5 px-3 text-emerald-700">Free</td>
                    <td className="py-2.5 px-3 font-sans">LPF, HPF, BPF, BSF</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">Type II</td>
                    <td className="py-2.5 px-3">Even</td>
                    <td className="py-2.5 px-3">Even (+)</td>
                    <td className="py-2.5 px-3">(M−1)/2 (half)</td>
                    <td className="py-2.5 px-3 text-emerald-700">Free</td>
                    <td className="py-2.5 px-3 text-red-700 font-semibold">Zero</td>
                    <td className="py-2.5 px-3 font-sans">LPF, BPF only</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">Type III</td>
                    <td className="py-2.5 px-3">Odd</td>
                    <td className="py-2.5 px-3">Odd (−)</td>
                    <td className="py-2.5 px-3">(M−1)/2 (int)</td>
                    <td className="py-2.5 px-3 text-red-700 font-semibold">Zero</td>
                    <td className="py-2.5 px-3 text-red-700 font-semibold">Zero</td>
                    <td className="py-2.5 px-3 font-sans">BPF, Diff</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">Type IV</td>
                    <td className="py-2.5 px-3">Even</td>
                    <td className="py-2.5 px-3">Odd (−)</td>
                    <td className="py-2.5 px-3">(M−1)/2 (half)</td>
                    <td className="py-2.5 px-3 text-red-700 font-semibold">Zero</td>
                    <td className="py-2.5 px-3 text-emerald-700">Free</td>
                    <td className="py-2.5 px-3 font-sans">HPF, Diff</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-3">
              03. Folded Direct-Form Hardware Resource Counts
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Configuration</th>
                    <th className="py-2.5 px-3">Multipliers</th>
                    <th className="py-2.5 px-3">Pre-Adders</th>
                    <th className="py-2.5 px-3">Accum Adders</th>
                    <th className="py-2.5 px-3">Total Adders</th>
                    <th className="py-2.5 px-3">Delays</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">Standard Direct Form</td>
                    <td className="py-2.5 px-3">M</td>
                    <td className="py-2.5 px-3">0</td>
                    <td className="py-2.5 px-3">M − 1</td>
                    <td className="py-2.5 px-3">M − 1</td>
                    <td className="py-2.5 px-3">M − 1</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">Type I (Odd, Symm)</td>
                    <td className="py-2.5 px-3 text-sky-700 font-semibold">(M + 1)/2</td>
                    <td className="py-2.5 px-3">(M − 1)/2</td>
                    <td className="py-2.5 px-3">(M − 1)/2</td>
                    <td className="py-2.5 px-3">M − 1</td>
                    <td className="py-2.5 px-3">M − 1</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">Type II (Even, Symm)</td>
                    <td className="py-2.5 px-3 text-sky-700 font-semibold">M / 2</td>
                    <td className="py-2.5 px-3">M / 2</td>
                    <td className="py-2.5 px-3">M/2 − 1</td>
                    <td className="py-2.5 px-3">M − 1</td>
                    <td className="py-2.5 px-3">M − 1</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">Type III (Odd, Antisymm)</td>
                    <td className="py-2.5 px-3 text-sky-700 font-semibold">(M − 1)/2</td>
                    <td className="py-2.5 px-3">(M − 1)/2</td>
                    <td className="py-2.5 px-3">(M − 3)/2</td>
                    <td className="py-2.5 px-3">M − 2</td>
                    <td className="py-2.5 px-3">M − 1</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">Type IV (Even, Antisymm)</td>
                    <td className="py-2.5 px-3 text-sky-700 font-semibold">M / 2</td>
                    <td className="py-2.5 px-3">M / 2</td>
                    <td className="py-2.5 px-3">M/2 − 1</td>
                    <td className="py-2.5 px-3">M − 1</td>
                    <td className="py-2.5 px-3">M − 1</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              04. Real Amplitude & Cascade Equations
            </h3>
            <div className="space-y-2.5 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-800">
              <div><span className="font-sans font-semibold text-slate-900">Type I:</span> A(ω) = h[(M−1)/2] + Σ 2·h[(M−1)/2 − k]·cos(ωk)</div>
              <div><span className="font-sans font-semibold text-slate-900">Type II:</span> A(ω) = Σ 2·h[M/2 − k]·cos(ω(k − 1/2)) &nbsp;⇒&nbsp; A(π) = 0</div>
              <div><span className="font-sans font-semibold text-slate-900">Cascade SOS (Unit Circle):</span> H_k(z) = 1 − 2cos(θ_k)z⁻¹ + z⁻²</div>
              <div><span className="font-sans font-semibold text-slate-900">Cascade SOS (Real Pair):</span> H_k(z) = 1 − (r_k + r_k⁻¹)z⁻¹ + z⁻²</div>
              <div><span className="font-sans font-semibold text-slate-900">FPGA DSP48E Slice:</span> P = (A + D) × B + C &nbsp;(Single clock cycle)</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
