import React, { useEffect, useMemo, useState } from 'react';
import { SymmetryKind, computeHardwareAudit } from '../utils/dspMath';
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';

const TABLE_2_ROWS = [
  { label: 'M = 4 (Even, Symm)', m: 4, sym: 'symmetric' as SymmetryKind },
  { label: 'M = 5 (Odd, Symm)', m: 5, sym: 'symmetric' as SymmetryKind },
  { label: 'M = 8 (Even, Symm)', m: 8, sym: 'symmetric' as SymmetryKind },
  { label: 'M = 9 (Odd, Symm)', m: 9, sym: 'symmetric' as SymmetryKind },
  { label: 'M = 31 (Odd, Symm)', m: 31, sym: 'symmetric' as SymmetryKind },
  { label: 'M = 64 (Even, Symm)', m: 64, sym: 'symmetric' as SymmetryKind },
  { label: 'M = 128 (Even, Symm)', m: 128, sym: 'symmetric' as SymmetryKind },
];

export const Module4Architecture: React.FC = () => {
  const [lengthM, setLengthM] = useState<number>(4);
  const [symmetry, setSymmetry] = useState<SymmetryKind>('symmetric');
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [subTab, setSubTab] = useState<'dsp48e' | 'cascade'>('dsp48e');
  const [wordWidthB, setWordWidthB] = useState<number>(18);
  const [cascadeThetaDeg, setCascadeThetaDeg] = useState<number>(60);

  const isOdd = lengthM % 2 === 1;

  // Generate clean integer/half-integer coefficients matching lecture examples
  const h = useMemo(() => {
    const arr = new Array(lengthM).fill(0);
    const pairs = Math.floor(lengthM / 2);
    for (let k = 0; k < pairs; k++) {
      const val = k + 1;
      arr[k] = val;
      arr[lengthM - 1 - k] = symmetry === 'symmetric' ? val : -val;
    }
    if (isOdd) {
      arr[(lengthM - 1) / 2] = symmetry === 'symmetric' ? pairs + 1 : 0;
    }
    return arr;
  }, [lengthM, symmetry, isOdd]);

  const audit = useMemo(
    () => computeHardwareAudit(h, isOdd ? (symmetry === 'symmetric' ? 1 : 3) : symmetry === 'symmetric' ? 2 : 4),
    [h, isOdd, symmetry]
  );

  // Discrete input stream x[n]: pulse sequence [1, 2, 3, 1, 0, 0, ...]
  const inputStream = [1, 2, 3, 1, -1, 0, 0, 0, 0, 0, 0, 0];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setStepIdx((prev) => (prev + 1) % 10);
    }, 1100);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const getSample = (n: number) => (n >= 0 && n < inputStream.length ? inputStream[n] : 0);
  const tapValues = Array.from({ length: lengthM }, (_, k) => getSample(stepIdx - k));

  // Direct and Folded outputs (mathematically identical)
  const yOutput = tapValues.reduce((acc, xk, k) => acc + xk * h[k], 0);

  // SVG Layout constants for signal flow graphs
  const svgW = 740;
  const directH = 210;
  const xStart = 76;
  const xStep = Math.min(118, (svgW - 150) / Math.max(1, lengthM - 1));

  // Folded diagram layout
  const pairsCount = Math.floor(lengthM / 2);
  const numFoldedCols = isOdd && symmetry === 'symmetric' ? pairsCount + 1 : pairsCount;
  const foldedH = 250;
  const foldStep = Math.min(135, (svgW - 180) / Math.max(1, numFoldedCols));

  // DSP48E scaling metrics
  const adderArea = wordWidthB;
  const multArea = wordWidthB * wordWidthB;
  const cascadeBeta1 = -2 * Math.cos((cascadeThetaDeg * Math.PI) / 180);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-medium text-sky-700 mb-1">
            04 · Folded Direct Form, Cascade & Silicon Cost
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Linear-Phase Realization Architecture (50% Multiplier Savings)
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl">
            By folding the delay line and pre-adding symmetric taps before multiplication,{' '}
            <span className="font-mono text-slate-900">h[k]x[n−k] ± h[k]x[n−M+1+k] = h[k](x[n−k] ± x[n−M+1+k])</span>,
            we cut multipliers roughly in half while keeping total adders invariant.
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors whitespace-nowrap"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pause' : 'Animate Samples'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setStepIdx((prev) => (prev + 1) % 10);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Step n
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setStepIdx(0);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Controls Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <label htmlFor="arch-m" className="font-medium text-slate-700">
              Filter Length M
            </label>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              M = {lengthM} taps ({isOdd ? 'Odd' : 'Even'})
            </span>
          </div>
          <input
            id="arch-m"
            type="range"
            min={4}
            max={8}
            step={1}
            value={lengthM}
            onChange={(e) => setLengthM(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <span className="block text-xs font-medium text-slate-700 mb-1.5">
            Coefficient Symmetry
          </span>
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setSymmetry('symmetric')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                symmetry === 'symmetric'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Symmetric (+)
            </button>
            <button
              type="button"
              onClick={() => setSymmetry('antisymmetric')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                symmetry === 'antisymmetric'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Antisymmetric (−)
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-6 font-mono text-xs tabular-nums">
          <div>
            <div className="text-slate-500 font-sans">Time Index</div>
            <div className="text-base font-bold text-slate-900">n = {stepIdx}</div>
          </div>
          <div>
            <div className="text-slate-500 font-sans">Input x[{stepIdx}]</div>
            <div className="text-base font-bold text-sky-700">{getSample(stepIdx)}</div>
          </div>
          <div>
            <div className="text-slate-500 font-sans">Output y[{stepIdx}]</div>
            <div className="text-base font-bold text-emerald-700">{yOutput}</div>
          </div>
        </div>
      </div>

      {/* Signal Flow Comparison Stage */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 space-y-6">
          {/* (a) Standard Unfolded Direct Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                (a) Standard Direct-Form FIR Structure (Unfolded)
              </h2>
              <span className="font-mono text-xs font-semibold text-red-700">
                {audit.directMultipliers} Multipliers · {audit.directAdders} Adders · {audit.directDelays} Delays
              </span>
            </div>

            <svg
              viewBox={`0 0 ${svgW} ${directH}`}
              className="w-full h-auto bg-[#F8FAFC] border border-slate-200 rounded-lg"
              role="img"
              aria-label="Standard unfolded direct-form FIR signal flow diagram"
            >
              {/* Input label */}
              <text x={18} y={42} className="fill-slate-800 font-mono text-xs font-semibold">
                x[n]
              </text>
              <line x1={48} y1={38} x2={xStart} y2={38} stroke="#334155" strokeWidth={1.8} />

              {/* Delay line */}
              {Array.from({ length: lengthM }).map((_, k) => {
                const cx = xStart + k * xStep;
                const nextX = xStart + (k + 1) * xStep;
                return (
                  <g key={k}>
                    {/* Delay box to next tap */}
                    {k < lengthM - 1 && (
                      <g>
                        <line x1={cx} y1={38} x2={nextX} y2={38} stroke="#334155" strokeWidth={1.8} />
                        <rect
                          x={(cx + nextX) / 2 - 18}
                          y={24}
                          width={36}
                          height={28}
                          rx={5}
                          fill="#FFFFFF"
                          stroke="#0284C7"
                          strokeWidth={1.6}
                        />
                        <text
                          x={(cx + nextX) / 2}
                          y={42}
                          textAnchor="middle"
                          className="fill-sky-800 font-mono text-[11px] font-semibold"
                        >
                          z⁻¹
                        </text>
                      </g>
                    )}

                    {/* Tap node */}
                    <circle cx={cx} cy={38} r={4} fill="#0F172A" />
                    <text
                      x={cx}
                      y={16}
                      textAnchor="middle"
                      className="fill-sky-700 font-mono text-[10px] font-semibold"
                    >
                      {tapValues[k]}
                    </text>

                    {/* Multiplier branch down */}
                    <line x1={cx} y1={38} x2={cx} y2={166} stroke="#475569" strokeWidth={1.4} />
                    <rect
                      x={cx - 22}
                      y={84}
                      width={44}
                      height={28}
                      rx={14}
                      fill="#EEF2FF"
                      stroke="#6366F1"
                      strokeWidth={1.6}
                    />
                    <text
                      x={cx}
                      y={102}
                      textAnchor="middle"
                      className="fill-indigo-950 font-mono text-[11px] font-semibold"
                    >
                      ×{h[k]}
                    </text>

                    {/* Product value */}
                    <text
                      x={cx + 8}
                      y={136}
                      className="fill-slate-600 font-mono text-[10px]"
                    >
                      ={tapValues[k] * h[k]}
                    </text>

                    {/* Adder bus */}
                    {k > 0 && (
                      <g>
                        <line
                          x1={xStart + (k - 1) * xStep}
                          y1={166}
                          x2={cx}
                          y2={166}
                          stroke="#334155"
                          strokeWidth={1.8}
                        />
                        <circle
                          cx={cx}
                          cy={166}
                          r={12}
                          fill="#DCFCE7"
                          stroke="#059669"
                          strokeWidth={1.6}
                        />
                        <text
                          x={cx}
                          y={170}
                          textAnchor="middle"
                          className="fill-emerald-900 font-mono text-sm font-bold"
                        >
                          +
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Output arrow */}
              <line
                x1={xStart + (lengthM - 1) * xStep + 12}
                y1={166}
                x2={svgW - 58}
                y2={166}
                stroke="#0F172A"
                strokeWidth={2}
              />
              <text
                x={svgW - 50}
                y={170}
                className="fill-emerald-700 font-mono text-xs font-bold"
              >
                y[n]={yOutput}
              </text>
            </svg>
          </div>

          {/* (b) Folded Linear-Phase Direct Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                (b) Folded Linear-Phase Structure (Pre-Addition Exploiting Symmetry)
              </h2>
              <span className="font-mono text-xs font-semibold text-emerald-700">
                {audit.foldedMultipliers} Multipliers ({audit.savingsPercent.toFixed(1)}% Saved) ·{' '}
                {audit.totalFoldedAdders} Total Adders · {audit.foldedDelays} Delays
              </span>
            </div>

            <svg
              viewBox={`0 0 ${svgW} ${foldedH}`}
              className="w-full h-auto bg-[#F8FAFC] border border-slate-200 rounded-lg"
              role="img"
              aria-label="Folded linear-phase FIR signal flow diagram with pre-adders"
            >
              <text x={18} y={40} className="fill-slate-800 font-mono text-xs font-semibold">
                x[n]
              </text>
              <line x1={48} y1={36} x2={xStart} y2={36} stroke="#334155" strokeWidth={1.8} />

              {/* Top forward rail & bottom folded return rail */}
              {Array.from({ length: numFoldedCols }).map((_, k) => {
                const cx = xStart + k * foldStep;
                const nextX = xStart + (k + 1) * foldStep;
                const isCenterOdd = isOdd && symmetry === 'symmetric' && k === pairsCount;
                const mirrorIdx = lengthM - 1 - k;
                const topVal = tapValues[k];
                const botVal = tapValues[mirrorIdx];
                const preSum = symmetry === 'symmetric' ? topVal + botVal : topVal - botVal;
                const multVal = isCenterOdd ? topVal * h[k] : preSum * h[k];

                return (
                  <g key={k}>
                    {/* Top delay segment */}
                    {k < numFoldedCols - 1 && (
                      <g>
                        <line x1={cx} y1={36} x2={nextX} y2={36} stroke="#334155" strokeWidth={1.8} />
                        <rect
                          x={(cx + nextX) / 2 - 17}
                          y={23}
                          width={34}
                          height={26}
                          rx={5}
                          fill="#FFFFFF"
                          stroke="#0284C7"
                          strokeWidth={1.6}
                        />
                        <text
                          x={(cx + nextX) / 2}
                          y={40}
                          textAnchor="middle"
                          className="fill-sky-800 font-mono text-[10px] font-semibold"
                        >
                          z⁻¹
                        </text>
                      </g>
                    )}

                    {/* Top tap dot + value */}
                    <circle cx={cx} cy={36} r={4} fill="#0F172A" />
                    <text
                      x={cx}
                      y={16}
                      textAnchor="middle"
                      className="fill-sky-700 font-mono text-[10px] font-semibold"
                    >
                      x[n−{k}]={topVal}
                    </text>

                    {/* Fold turnaround on the rightmost column */}
                    {k === numFoldedCols - 1 && (
                      <g>
                        {isOdd ? (
                          // Odd length: turnaround has 1 or 2 delays depending on center tap
                          <g>
                            <path
                              d={`M ${cx} 36 L ${cx + 52} 36 L ${cx + 52} 170 L ${cx} 170`}
                              fill="none"
                              stroke="#334155"
                              strokeWidth={1.8}
                            />
                            {symmetry === 'antisymmetric' && (
                              <g>
                                <rect
                                  x={cx + 35}
                                  y={64}
                                  width={34}
                                  height={24}
                                  rx={5}
                                  fill="#FFFFFF"
                                  stroke="#0284C7"
                                  strokeWidth={1.5}
                                />
                                <text
                                  x={cx + 52}
                                  y={80}
                                  textAnchor="middle"
                                  className="fill-sky-800 font-mono text-[10px] font-semibold"
                                >
                                  z⁻¹
                                </text>
                                <rect
                                  x={cx + 35}
                                  y={114}
                                  width={34}
                                  height={24}
                                  rx={5}
                                  fill="#FFFFFF"
                                  stroke="#0284C7"
                                  strokeWidth={1.5}
                                />
                                <text
                                  x={cx + 52}
                                  y={130}
                                  textAnchor="middle"
                                  className="fill-sky-800 font-mono text-[10px] font-semibold"
                                >
                                  z⁻¹
                                </text>
                                <text
                                  x={cx + 76}
                                  y={104}
                                  className="fill-amber-700 font-mono text-[9px] font-semibold"
                                >
                                  h[{pairsCount}]=0 skipped!
                                </text>
                              </g>
                            )}
                          </g>
                        ) : (
                          // Even length: single z^-1 on vertical turnaround
                          <g>
                            <path
                              d={`M ${cx} 36 L ${cx + 52} 36 L ${cx + 52} 170 L ${cx} 170`}
                              fill="none"
                              stroke="#334155"
                              strokeWidth={1.8}
                            />
                            <rect
                              x={cx + 35}
                              y={90}
                              width={34}
                              height={26}
                              rx={5}
                              fill="#FFFFFF"
                              stroke="#0284C7"
                              strokeWidth={1.6}
                            />
                            <text
                              x={cx + 52}
                              y={107}
                              textAnchor="middle"
                              className="fill-sky-800 font-mono text-[10px] font-semibold"
                            >
                              z⁻¹
                            </text>
                          </g>
                        )}
                      </g>
                    )}

                    {/* Bottom return delay segments (from right to left) */}
                    {!isCenterOdd && k < numFoldedCols - 1 && (
                      <g>
                        <line x1={nextX} y1={170} x2={cx} y2={170} stroke="#334155" strokeWidth={1.8} />
                        <rect
                          x={(cx + nextX) / 2 - 17}
                          y={157}
                          width={34}
                          height={26}
                          rx={5}
                          fill="#FFFFFF"
                          stroke="#0284C7"
                          strokeWidth={1.6}
                        />
                        <text
                          x={(cx + nextX) / 2}
                          y={174}
                          textAnchor="middle"
                          className="fill-sky-800 font-mono text-[10px] font-semibold"
                        >
                          z⁻¹
                        </text>
                      </g>
                    )}

                    {/* Pre-adder / Subtractor node (if paired) */}
                    {!isCenterOdd ? (
                      <g>
                        <circle cx={cx} cy={170} r={4} fill="#0F172A" />
                        <text
                          x={cx}
                          y={190}
                          textAnchor="middle"
                          className="fill-slate-600 font-mono text-[10px]"
                        >
                          x[n−{mirrorIdx}]={botVal}
                        </text>
                        <line x1={cx} y1={36} x2={cx} y2={170} stroke="#475569" strokeWidth={1.4} />
                        {/* Pre-adder circle */}
                        <circle
                          cx={cx}
                          cy={84}
                          r={12}
                          fill="#FEF3C7"
                          stroke="#D97706"
                          strokeWidth={1.6}
                        />
                        <text
                          x={cx}
                          y={88}
                          textAnchor="middle"
                          className="fill-amber-950 font-mono text-sm font-bold"
                        >
                          {symmetry === 'symmetric' ? '+' : '−'}
                        </text>
                        <text
                          x={cx + 16}
                          y={88}
                          className="fill-amber-800 font-mono text-[10px] font-semibold"
                        >
                          ={preSum}
                        </text>
                        {/* Shared Multiplier */}
                        <rect
                          x={cx - 22}
                          y={114}
                          width={44}
                          height={26}
                          rx={13}
                          fill="#EEF2FF"
                          stroke="#6366F1"
                          strokeWidth={1.6}
                        />
                        <text
                          x={cx}
                          y={131}
                          textAnchor="middle"
                          className="fill-indigo-950 font-mono text-[11px] font-semibold"
                        >
                          ×{h[k]}
                        </text>
                      </g>
                    ) : (
                      /* Center tap for odd symmetric (no pre-adder) */
                      <g>
                        <line x1={cx} y1={36} x2={cx} y2={215} stroke="#475569" strokeWidth={1.4} />
                        <rect
                          x={cx - 22}
                          y={114}
                          width={44}
                          height={26}
                          rx={13}
                          fill="#EEF2FF"
                          stroke="#6366F1"
                          strokeWidth={1.6}
                        />
                        <text
                          x={cx}
                          y={131}
                          textAnchor="middle"
                          className="fill-indigo-950 font-mono text-[11px] font-semibold"
                        >
                          ×{h[k]}
                        </text>
                      </g>
                    )}

                    {/* Accumulator bus at y=215 */}
                    <line x1={cx} y1={140} x2={cx} y2={215} stroke="#475569" strokeWidth={1.4} />
                    <text x={cx + 8} y={205} className="fill-slate-600 font-mono text-[10px]">
                      ={multVal}
                    </text>
                    {k > 0 && (
                      <g>
                        <line
                          x1={xStart + (k - 1) * foldStep}
                          y1={215}
                          x2={cx}
                          y2={215}
                          stroke="#334155"
                          strokeWidth={1.8}
                        />
                        <circle
                          cx={cx}
                          cy={215}
                          r={11}
                          fill="#DCFCE7"
                          stroke="#059669"
                          strokeWidth={1.6}
                        />
                        <text
                          x={cx}
                          y={219}
                          textAnchor="middle"
                          className="fill-emerald-900 font-mono text-sm font-bold"
                        >
                          +
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Output arrow */}
              <line
                x1={xStart + (numFoldedCols - 1) * foldStep + 11}
                y1={215}
                x2={svgW - 64}
                y2={215}
                stroke="#0F172A"
                strokeWidth={2}
              />
              <text
                x={svgW - 56}
                y={219}
                className="fill-emerald-700 font-mono text-xs font-bold"
              >
                y[n]={yOutput}
              </text>
            </svg>
          </div>
        </div>

        {/* Right Side: Live Hardware Audit & Multi-Length Table (4 cols) */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">
              Live Hardware Resource Audit (M = {lengthM})
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500">Direct Multipliers</div>
                <div className="font-mono text-lg font-bold text-red-700 mt-0.5 tabular-nums">
                  {audit.directMultipliers}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="text-emerald-800">Folded Multipliers</div>
                <div className="font-mono text-lg font-bold text-emerald-700 mt-0.5 tabular-nums">
                  {audit.foldedMultipliers}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500">Pre-Adders + Accum</div>
                <div className="font-mono text-sm font-bold text-slate-900 mt-1 tabular-nums">
                  {audit.preAdders} + {audit.accumAdders} = {audit.totalFoldedAdders}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500">Multiplier Savings</div>
                <div className="font-mono text-lg font-bold text-sky-700 mt-0.5 tabular-nums">
                  {audit.savingsPercent.toFixed(1)}%
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900">Key Invariance:</strong> Total adders remain{' '}
              <span className="font-mono font-semibold text-slate-900">
                {audit.centerTapZero ? 'M − 2' : 'M − 1'} = {audit.totalFoldedAdders}
              </span>
              . Pre-addition does not create extra additions—it simply moves{' '}
              <span className="font-mono">⌊M/2⌋</span> additions <em>before</em> multiplication.
            </p>
          </div>

          {/* Table 2 Reference */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Scaling Across Filter Lengths (Table 2)
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2 px-2.5">Length M</th>
                    <th className="py-2 px-2.5">Direct</th>
                    <th className="py-2 px-2.5">Folded</th>
                    <th className="py-2 px-2.5">Savings</th>
                    <th className="py-2 px-2.5">Adders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                  {TABLE_2_ROWS.map((r) => {
                    const rowAudit = computeHardwareAudit(new Array(r.m).fill(1), r.m % 2 === 0 ? 2 : 1);
                    return (
                      <tr key={r.label} className={r.m === lengthM ? 'bg-sky-50 font-semibold' : ''}>
                        <td className="py-1.5 px-2.5 font-sans text-slate-900">{r.label}</td>
                        <td className="py-1.5 px-2.5">{rowAudit.directMultipliers}</td>
                        <td className="py-1.5 px-2.5 text-sky-700">{rowAudit.foldedMultipliers}</td>
                        <td className="py-1.5 px-2.5 text-emerald-700">
                          {rowAudit.savingsPercent.toFixed(1)}%
                        </td>
                        <td className="py-1.5 px-2.5">{rowAudit.totalFoldedAdders}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Deep-Dive: VLSI/FPGA DSP48E Slice vs Cascade Second-Order Sections */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Hardware & Structural Extensions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Explore why multipliers dominate silicon cost and how Cascade Form preserves linear phase.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setSubTab('dsp48e')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                subTab === 'dsp48e' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              VLSI & FPGA DSP48E Slice
            </button>
            <button
              type="button"
              onClick={() => setSubTab('cascade')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                subTab === 'cascade' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Cascade Second-Order Form
            </button>
          </div>
        </div>

        {subTab === 'dsp48e' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7">
              <svg
                viewBox="0 0 640 165"
                className="w-full h-auto bg-[#F8FAFC] border border-slate-200 rounded-lg"
                role="img"
                aria-label="FPGA DSP48E slice architecture computing P = (A + D) * B + C"
              >
                {/* Inputs A, D -> Pre-Adder */}
                <text x={24} y={48} className="fill-slate-800 font-mono text-xs font-semibold">
                  A = x[n−k] (25-bit)
                </text>
                <text x={24} y={96} className="fill-slate-800 font-mono text-xs font-semibold">
                  D = x[n−M+1+k]
                </text>
                <line x1={152} y1={44} x2={205} y2={58} stroke="#334155" strokeWidth={1.8} />
                <line x1={152} y1={92} x2={205} y2={76} stroke="#334155" strokeWidth={1.8} />

                {/* Pre-Adder block */}
                <rect x={205} y={42} width={86} height={50} rx={8} fill="#FEF3C7" stroke="#D97706" strokeWidth={1.8} />
                <text x={248} y={64} textAnchor="middle" className="fill-amber-950 font-sans text-[11px] font-semibold">
                  Pre-Adder
                </text>
                <text x={248} y={80} textAnchor="middle" className="fill-amber-900 font-mono text-[11px]">
                  (A + D)
                </text>

                {/* To Multiplier */}
                <line x1={291} y1={67} x2={342} y2={67} stroke="#334155" strokeWidth={1.8} />
                <text x={350} y={28} textAnchor="middle" className="fill-slate-800 font-mono text-xs font-semibold">
                  B = h[k] (18-bit)
                </text>
                <line x1={380} y1={34} x2={380} y2={46} stroke="#334155" strokeWidth={1.8} />

                {/* 25x18 Multiplier */}
                <rect x={342} y={46} width={92} height={50} rx={8} fill="#EEF2FF" stroke="#6366F1" strokeWidth={1.8} />
                <text x={388} y={68} textAnchor="middle" className="fill-indigo-950 font-sans text-[11px] font-semibold">
                  25×18 Mult
                </text>
                <text x={388} y={84} textAnchor="middle" className="fill-indigo-900 font-mono text-[11px]">
                  (A+D) × B
                </text>

                {/* To Accumulator */}
                <line x1={434} y1={71} x2={476} y2={71} stroke="#334155" strokeWidth={1.8} />
                <text x={522} y={134} textAnchor="middle" className="fill-slate-800 font-mono text-xs font-semibold">
                  C (48-bit cascade)
                </text>
                <line x1={522} y1={118} x2={522} y2={96} stroke="#334155" strokeWidth={1.8} />

                {/* Accumulator */}
                <rect x={476} y={46} width={92} height={50} rx={8} fill="#DCFCE7" stroke="#059669" strokeWidth={1.8} />
                <text x={522} y={68} textAnchor="middle" className="fill-emerald-950 font-sans text-[11px] font-semibold">
                  48-bit Accum
                </text>
                <text x={522} y={84} textAnchor="middle" className="fill-emerald-900 font-mono text-[11px]">
                  + C
                </text>

                {/* Output P */}
                <line x1={568} y1={71} x2={604} y2={71} stroke="#0F172A" strokeWidth={2} />
                <text x={612} y={75} className="fill-emerald-800 font-mono text-xs font-bold">
                  P
                </text>
              </svg>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <label htmlFor="word-b" className="font-medium text-slate-700">
                    Datapath Word Length B
                  </label>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {wordWidthB} bits
                  </span>
                </div>
                <input
                  id="word-b"
                  type="range"
                  min={8}
                  max={32}
                  step={2}
                  value={wordWidthB}
                  onChange={(e) => setWordWidthB(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono tabular-nums">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-sans">Adder Complexity O(B)</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{adderArea} units</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-sans">Multiplier Area O(B²)</div>
                  <div className="text-base font-bold text-red-700 mt-0.5">{multArea} units</div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Hard-wired AMD/Xilinx DSP48E blocks natively implement{' '}
                <span className="font-mono text-slate-900">P = (A + D) × B + C</span> in silicon, executing
                an entire folded linear-phase tap in a single clock cycle with zero extra LUTs.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs space-y-2 text-slate-800">
                <div className="font-sans font-semibold text-slate-900 text-sm">
                  Factored Transfer Function: H(z) = b₀ · ∏ H_k(z)
                </div>
                <div>
                  • Unit Circle Pair (z = e^±jθ_k): H_k(z) = 1 − 2cos(θ_k)z⁻¹ + z⁻² ={' '}
                  <strong className="text-sky-700">1 + ({cascadeBeta1.toFixed(3)})z⁻¹ + z⁻²</strong>
                </div>
                <div>
                  • Real Reciprocal Pair (r_k, 1/r_k): H_k(z) = 1 − (r_k + r_k⁻¹)z⁻¹ + z⁻²
                </div>
                <div>
                  • Off-Circle Complex Quadruplet: 1 + c₁z⁻¹ + c₂z⁻² + c₁z⁻³ + z⁻⁴
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 space-y-3">
              <div className="flex justify-between text-xs">
                <label htmlFor="casc-theta" className="font-medium text-slate-700">
                  Section Notch Angle θ_k
                </label>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {cascadeThetaDeg}°
                </span>
              </div>
              <input
                id="casc-theta"
                type="range"
                min={10}
                max={170}
                step={5}
                value={cascadeThetaDeg}
                onChange={(e) => setCascadeThetaDeg(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-600 leading-relaxed">
                Notice the leading and trailing coefficients are both <span className="font-mono">1</span>, so each
                symmetric second-order section needs only <strong>1 non-trivial multiplier</strong> (β₁_k) and 2 adders.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
