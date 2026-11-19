import React, { useMemo, useState } from 'react';
import { classifyFilter, computeHardwareAudit, evaluateLinearPhaseResponse } from '../utils/dspMath';
import { CheckCircle2, XCircle, Eye } from 'lucide-react';

interface WorkedExample {
  id: string;
  title: string;
  subtitle: string;
  h: number[];
  directEq: string;
  foldedEq: string;
  notes: string;
}

const EXAMPLES: WorkedExample[] = [
  {
    id: 'ex16_1',
    title: 'Example 16.1 · Odd Symmetric (M = 5)',
    subtitle: 'h[n] = { 1, 2, 3, 2, 1 }',
    h: [1, 2, 3, 2, 1],
    directEq: 'y[n] = 1·x[n] + 2·x[n−1] + 3·x[n−2] + 2·x[n−3] + 1·x[n−4]',
    foldedEq: 'y[n] = 1·(x[n] + x[n−4]) + 2·(x[n−1] + x[n−3]) + 3·x[n−2]',
    notes: 'Center tap h[2] = 3 stands alone (no pre-adder). Multipliers drop from 5 to (5+1)/2 = 3 (40% saved). Total adders stay 2 + 2 = 4.',
  },
  {
    id: 'ex16_2',
    title: 'Example 16.2 · Even Symmetric (M = 6)',
    subtitle: 'h[n] = { 0.5, −1.2, 2.5, 2.5, −1.2, 0.5 }',
    h: [0.5, -1.2, 2.5, 2.5, -1.2, 0.5],
    directEq: 'y[n] = 0.5x[n] − 1.2x[n−1] + 2.5x[n−2] + 2.5x[n−3] − 1.2x[n−4] + 0.5x[n−5]',
    foldedEq: 'y[n] = 0.5(x[n] + x[n−5]) − 1.2(x[n−1] + x[n−4]) + 2.5(x[n−2] + x[n−3])',
    notes: 'Half-integer center α = 2.5 samples. All 6 taps pair cleanly into 3 pre-added branches. Multipliers drop from 6 to 3 (50% saved).',
  },
  {
    id: 'ex16_3',
    title: 'Example 16.3 · Odd Antisymmetric (M = 5)',
    subtitle: 'h[n] = { 1, 2, 0, −2, −1 }',
    h: [1, 2, 0, -2, -1],
    directEq: 'y[n] = 1·x[n] + 2·x[n−1] + 0·x[n−2] − 2·x[n−3] − 1·x[n−4]',
    foldedEq: 'y[n] = 1·(x[n] − x[n−4]) + 2·(x[n−1] − x[n−3])',
    notes: 'Type III filter: middle sample h[2] = 0 is completely omitted! Multipliers drop from 5 to (5−1)/2 = 2 (60% saved), and adders/subtractors drop to M − 2 = 3.',
  },
];

interface MisconceptionItem {
  id: number;
  question: string;
  correctAnswer: boolean;
  reality: string;
}

const MISCONCEPTIONS: MisconceptionItem[] = [
  {
    id: 1,
    question: 'Does pre-addition increase the total number of adders in a symmetric linear-phase FIR filter?',
    correctAnswer: false,
    reality:
      'No. Total adders remain invariant at M − 1. Standard direct form places all M − 1 additions in the accumulation bus; folded form shifts ⌊M/2⌋ additions before the multipliers, leaving ⌈M/2⌉ − 1 for accumulation.',
  },
  {
    id: 2,
    question: 'Does folding the delay line change the transfer function H(z) or frequency response H(e^jω)?',
    correctAnswer: false,
    reality:
      'No. H(z) and H(e^jω) are mathematically identical. Folding is purely an algebraic factorization via the distributive law: a·x₁ + a·x₂ = a(x₁ + x₂).',
  },
  {
    id: 3,
    question: 'Can a Type II (even-length, symmetric) FIR filter be used to design an audio tweeter high-pass filter?',
    correctAnswer: false,
    reality:
      'No. Type II has a mandatory transmission zero at ω = π (z = −1), forcing zero gain at the highest discrete frequency. Designing an HPF with Type II is a fatal design error.',
  },
  {
    id: 4,
    question: 'Can an IIR filter achieve exact linear phase using the pre-addition symmetry technique?',
    correctAnswer: false,
    reality:
      'No. Causal stable IIR filters have infinite impulse responses without finite symmetry, and recursive feedback loops (y[n − k]) prevent symmetric input tap grouping.',
  },
];

export const Module5Practice: React.FC = () => {
  const [selectedExampleId, setSelectedExampleId] = useState<string>('ex16_1');
  const [stepProgress, setStepProgress] = useState<number>(4);

  // Exam Problem 1 state: h[n] = {-0.1, 0.2, 0.6, 0.6, 0.2, -0.1}
  const [ansType, setAnsType] = useState<string>('');
  const [ansOrder, setAnsOrder] = useState<string>('');
  const [ansTauG, setAnsTauG] = useState<string>('');
  const [ansMults, setAnsMults] = useState<string>('');
  const [ansAdders, setAnsAdders] = useState<string>('');
  const [checkedExam, setCheckedExam] = useState<boolean>(false);
  const [showExamSolution, setShowExamSolution] = useState<boolean>(false);

  // Misconceptions state
  const [mythVotes, setMythVotes] = useState<Record<number, boolean | null>>({});

  const activeEx = EXAMPLES.find((e) => e.id === selectedExampleId) ?? EXAMPLES[0];
  const exType = useMemo(() => classifyFilter(activeEx.h), [activeEx]);
  const exAudit = useMemo(() => computeHardwareAudit(activeEx.h, exType), [activeEx, exType]);
  const exFreq = useMemo(() => evaluateLinearPhaseResponse(activeEx.h, 100), [activeEx]);

  const maxMag = Math.max(1, ...exFreq.map((p) => p.mag));
  const magPath = exFreq
    .map((p, i) => {
      const x = 30 + (p.omega / Math.PI) * 260;
      const y = 115 - (p.mag / maxMag) * 95;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const examResults = {
    type: ansType === 'Type II',
    order: ansOrder.trim() === '5',
    tauG: ansTauG.trim() === '2.5',
    mults: ansMults.trim() === '3',
    adders: ansAdders.trim() === '5',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <p className="text-xs font-medium text-sky-700 mb-1">
          05 · Worked Examples, Misconceptions & Exam Practice
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Step-by-Step Numerical Walkthrough & Self-Check
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl">
          Trace Examples 16.1–16.3 step by step, verify common DSP misconceptions, and solve
          the University Exam Problem with instant automated grading.
        </p>
      </div>

      {/* Section A: Worked Numerical Examples */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            Worked Numerical Examples (Section 7)
          </h2>
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => {
                  setSelectedExampleId(ex.id);
                  setStepProgress(4);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedExampleId === ex.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ex.title.split('·')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 4-Step Progressive Derivation */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm font-semibold text-slate-900">
                {activeEx.subtitle}
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStepProgress(s)}
                    className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                      stepProgress >= s
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Step {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {stepProgress >= 1 && (
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="font-semibold text-slate-900 mb-1">
                    Step 1 · Classification & Group Delay
                  </div>
                  <div className="font-mono text-slate-800">
                    Length M = {exAudit.lengthM} · Order N = {exAudit.orderN} ·{' '}
                    <strong>Type {exType === 1 ? 'I' : exType === 2 ? 'II' : exType === 3 ? 'III' : 'IV'}</strong> ·{' '}
                    τ_g = (M−1)/2 = <strong>{exAudit.alpha} samples</strong>
                  </div>
                </div>
              )}
              {stepProgress >= 2 && (
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="font-semibold text-slate-900 mb-1">
                    Step 2 · Standard Direct-Form Difference Equation
                  </div>
                  <div className="font-mono text-slate-800 break-words">{activeEx.directEq}</div>
                </div>
              )}
              {stepProgress >= 3 && (
                <div className="p-3.5 rounded-lg bg-sky-50 border border-sky-200 text-xs">
                  <div className="font-semibold text-sky-950 mb-1">
                    Step 3 · Linear-Phase Folded Equation (Grouped Pairs)
                  </div>
                  <div className="font-mono text-sky-900 font-medium break-words">
                    {activeEx.foldedEq}
                  </div>
                </div>
              )}
              {stepProgress >= 4 && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                  <div className="font-semibold text-emerald-950 mb-1">
                    Step 4 · Hardware Audit & Multiplier Savings
                  </div>
                  <div className="font-mono text-emerald-900 tabular-nums">
                    Multipliers: {exAudit.directMultipliers} → <strong>{exAudit.foldedMultipliers}</strong> ({exAudit.savingsPercent.toFixed(0)}% savings) ·
                    Adders: <strong>{exAudit.totalFoldedAdders}</strong> ({exAudit.preAdders} pre + {exAudit.accumAdders} accum) ·
                    Delays: <strong>{exAudit.foldedDelays}</strong>
                  </div>
                  <p className="text-emerald-900 mt-1.5">{activeEx.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Live Magnitude Preview */}
          <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-slate-900 mb-2">
              Magnitude Response |H(e^jω)|
            </div>
            <svg
              viewBox="0 0 310 140"
              className="w-full h-auto bg-white border border-slate-200 rounded"
              role="img"
              aria-label="Magnitude response of selected worked example"
            >
              <line x1={30} y1={115} x2={290} y2={115} stroke="#CBD5E1" strokeWidth={1} />
              <line x1={30} y1={15} x2={30} y2={115} stroke="#CBD5E1" strokeWidth={1} />
              <path d={magPath} fill="none" stroke="#0284C7" strokeWidth={2.2} />
              <text x={30} y={132} className="fill-slate-500 font-mono text-[9px]">
                0
              </text>
              <text x={160} y={132} textAnchor="middle" className="fill-slate-500 font-mono text-[9px]">
                π/2
              </text>
              <text x={290} y={132} textAnchor="end" className="fill-slate-500 font-mono text-[9px]">
                π
              </text>
            </svg>
            <div className="mt-2.5 text-[11px] font-mono text-slate-600 tabular-nums">
              |H(e^j0)| = {exFreq[0].mag.toFixed(2)} · |H(e^jπ)| = {exFreq[exFreq.length - 1].mag.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Section B: University Exam Practice & Misconceptions Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Exam Problem 1 Interactive Self-Test (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <p className="text-xs font-medium text-sky-700">University Exam Practice (Section 9)</p>
            <h2 className="text-base font-semibold text-slate-900 mt-0.5">
              Problem 1: Analyze & Realize a Low-Pass FIR Filter
            </h2>
            <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900">
              h[n] = {'{ −0.1, 0.2, 0.6, 0.6, 0.2, −0.1 }'}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label htmlFor="exam-type" className="block font-medium text-slate-700 mb-1">
                1. Filter Type
              </label>
              <select
                id="exam-type"
                value={ansType}
                onChange={(e) => setAnsType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
              >
                <option value="">Select Type...</option>
                <option value="Type I">Type I</option>
                <option value="Type II">Type II</option>
                <option value="Type III">Type III</option>
                <option value="Type IV">Type IV</option>
              </select>
              {checkedExam && (
                <div className={`mt-1 flex items-center gap-1 ${examResults.type ? 'text-emerald-700' : 'text-red-600'}`}>
                  {examResults.type ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{examResults.type ? 'Correct (Even M, Symm)' : 'Check M=6 and h[n]=h[5−n]'}</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="exam-order" className="block font-medium text-slate-700 mb-1">
                2. Filter Order N
              </label>
              <input
                id="exam-order"
                type="text"
                placeholder="e.g. 5"
                value={ansOrder}
                onChange={(e) => setAnsOrder(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
              />
              {checkedExam && (
                <div className={`mt-1 flex items-center gap-1 ${examResults.order ? 'text-emerald-700' : 'text-red-600'}`}>
                  {examResults.order ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{examResults.order ? 'Correct (N = M − 1 = 5)' : 'Order N = M − 1'}</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="exam-tau" className="block font-medium text-slate-700 mb-1">
                3. Group Delay τ_g (samples)
              </label>
              <input
                id="exam-tau"
                type="text"
                placeholder="e.g. 2.5"
                value={ansTauG}
                onChange={(e) => setAnsTauG(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
              />
              {checkedExam && (
                <div className={`mt-1 flex items-center gap-1 ${examResults.tauG ? 'text-emerald-700' : 'text-red-600'}`}>
                  {examResults.tauG ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{examResults.tauG ? 'Correct (5/2 = 2.5)' : 'τ_g = (M − 1)/2'}</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="exam-mults" className="block font-medium text-slate-700 mb-1">
                4. Folded Multipliers Needed
              </label>
              <input
                id="exam-mults"
                type="text"
                placeholder="e.g. 3"
                value={ansMults}
                onChange={(e) => setAnsMults(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
              />
              {checkedExam && (
                <div className={`mt-1 flex items-center gap-1 ${examResults.mults ? 'text-emerald-700' : 'text-red-600'}`}>
                  {examResults.mults ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{examResults.mults ? 'Correct (M/2 = 3)' : 'Even symmetric uses M/2'}</span>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="exam-adders" className="block font-medium text-slate-700 mb-1">
                5. Total Adders in Folded Form
              </label>
              <input
                id="exam-adders"
                type="text"
                placeholder="e.g. 5"
                value={ansAdders}
                onChange={(e) => setAnsAdders(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
              />
              {checkedExam && (
                <div className={`mt-1 flex items-center gap-1 ${examResults.adders ? 'text-emerald-700' : 'text-red-600'}`}>
                  {examResults.adders ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{examResults.adders ? 'Correct (M − 1 = 5)' : '3 pre-adders + 2 accum = 5'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCheckedExam(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors"
            >
              Check My Answers
            </button>
            <button
              type="button"
              onClick={() => setShowExamSolution((s) => !s)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              {showExamSolution ? 'Hide Marking Scheme' : 'Show Marking Scheme'}
            </button>
          </div>

          {showExamSolution && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-800">
              <div><strong>Type & Order:</strong> M = 6, N = 5, symmetric ⇒ <strong>Type II</strong></div>
              <div><strong>Delays:</strong> τ_g = τ_p = (6−1)/2 = <strong>2.5 samples</strong></div>
              <div className="font-mono text-[11px]">
                <strong>Linear-Phase Eq:</strong> y[n] = −0.1(x[n]+x[n−5]) + 0.2(x[n−1]+x[n−4]) + 0.6(x[n−2]+x[n−3])
              </div>
              <div><strong>Hardware:</strong> 3 Multipliers (50% savings), 5 Adders, 5 Delays.</div>
            </div>
          )}
        </div>

        {/* Common Misconceptions Myth-Buster (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <p className="text-xs font-medium text-sky-700">Pedagogical Checkpoints (Section 8)</p>
            <h2 className="text-base font-semibold text-slate-900 mt-0.5">
              Verify 4 Common Misconceptions
            </h2>
          </div>

          <div className="space-y-3">
            {MISCONCEPTIONS.map((item) => {
              const vote = mythVotes[item.id] ?? null;
              const isAnswered = vote !== null;
              const isRight = vote === item.correctAnswer;

              return (
                <div key={item.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-medium text-slate-900 leading-relaxed">
                      {item.id}. {item.question}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setMythVotes((prev) => ({ ...prev, [item.id]: true }))}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                          vote === true
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setMythVotes((prev) => ({ ...prev, [item.id]: false }))}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                          vote === false
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {isAnswered && (
                    <div
                      className={`text-xs p-2.5 rounded border ${
                        isRight
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50 border-amber-200 text-amber-950'
                      }`}
                    >
                      <span className="font-semibold">
                        {isRight ? 'Correct: ' : 'Watch out: '}
                      </span>
                      {item.reality}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
