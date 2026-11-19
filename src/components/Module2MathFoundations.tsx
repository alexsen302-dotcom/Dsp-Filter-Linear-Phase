import React, { useMemo, useState } from 'react';
import { SymmetryKind, evaluateLinearPhaseResponse } from '../utils/dspMath';
import { CheckCircle2, Lock } from 'lucide-react';

export const Module2MathFoundations: React.FC = () => {
  const [lengthM, setLengthM] = useState<number>(5);
  const [symmetry, setSymmetry] = useState<SymmetryKind>('symmetric');
  const [halfTaps, setHalfTaps] = useState<number[]>([0.4, 0.8, 1.2, 0.6, 0.3]);
  const [testOmega, setTestOmega] = useState<number>(1.2); // radians

  const isOdd = lengthM % 2 === 1;
  const numIndependent = symmetry === 'symmetric' ? Math.ceil(lengthM / 2) : Math.floor(lengthM / 2);
  const alpha = (lengthM - 1) / 2;

  // Build full impulse response h[n]
  const h = useMemo(() => {
    const arr = new Array(lengthM).fill(0);
    const pairs = Math.floor(lengthM / 2);
    for (let k = 0; k < pairs; k++) {
      const val = halfTaps[k] ?? 0.5;
      arr[k] = val;
      arr[lengthM - 1 - k] = symmetry === 'symmetric' ? val : -val;
    }
    if (isOdd) {
      const mid = (lengthM - 1) / 2;
      arr[mid] = symmetry === 'symmetric' ? (halfTaps[mid] ?? 1.0) : 0;
    }
    return arr;
  }, [lengthM, symmetry, halfTaps, isOdd]);

  const freqPoints = useMemo(() => evaluateLinearPhaseResponse(h, 120), [h]);

  // Verify Eq (8): sum h[n] sin(w(alpha - n)) for symmetric, or sum h[n] cos(w(alpha - n)) for antisymmetric
  const cancellationBreakdown = useMemo(() => {
    const pairs = Math.floor(lengthM / 2);
    const items: {
      k: number;
      mirror: number;
      hk: number;
      hm: number;
      leftTerm: number;
      rightTerm: number;
      pairSum: number;
    }[] = [];

    for (let k = 0; k < pairs; k++) {
      const mirror = lengthM - 1 - k;
      const d = alpha - k;
      if (symmetry === 'symmetric') {
        const leftTerm = h[k] * Math.sin(testOmega * d);
        const rightTerm = h[mirror] * Math.sin(testOmega * (alpha - mirror));
        items.push({
          k,
          mirror,
          hk: h[k],
          hm: h[mirror],
          leftTerm,
          rightTerm,
          pairSum: leftTerm + rightTerm,
        });
      } else {
        // Antisymmetric: real part vanishes => sum h[n]*cos(w(alpha-n)) = 0
        const leftTerm = h[k] * Math.cos(testOmega * d);
        const rightTerm = h[mirror] * Math.cos(testOmega * (alpha - mirror));
        items.push({
          k,
          mirror,
          hk: h[k],
          hm: h[mirror],
          leftTerm,
          rightTerm,
          pairSum: leftTerm + rightTerm,
        });
      }
    }
    return items;
  }, [h, lengthM, alpha, symmetry, testOmega]);

  const totalResidual = cancellationBreakdown.reduce((acc, item) => acc + item.pairSum, 0);

  // Stem Plot Geometry
  const W = 680;
  const H = 240;
  const padL = 46;
  const padR = 30;
  const padT = 26;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxVal = 1.6;
  const toX = (n: number) => padL + ((n + 0.5) / lengthM) * plotW;
  const toY = (v: number) => padT + ((maxVal - v) / (2 * maxVal)) * plotH;
  const zeroY = toY(0);

  const pairColors = ['#0284C7', '#059669', '#D97706', '#7C3AED', '#0F172A'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <p className="text-xs font-medium text-sky-700 mb-1">
          02 · Mathematical Foundations
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Pure vs. Generalized Linear Phase & Symmetry Conditions
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl">
          Linear phase forces the DTFT imaginary (or real) residual to vanish for all frequencies ω.
          Adjust filter length <span className="font-mono text-slate-900">M</span>, symmetry mode, and
          tap weights to observe exact center-of-symmetry mirroring and pairwise cancellation.
        </p>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Stage (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive Stem Plot */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Impulse Response h[n] Symmetry Geometry
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Center of symmetry at{' '}
                  <span className="font-mono font-semibold text-slate-800">
                    α = (M − 1)/2 = {alpha.toFixed(1)}
                  </span>{' '}
                  ({isOdd ? 'integer sample index' : 'half-integer midpoint between taps'})
                </p>
              </div>
              <span className="font-mono text-xs font-medium px-2.5 py-1 rounded bg-slate-100 text-slate-800">
                {symmetry === 'symmetric' ? 'θ(ω) = −αω (β = 0)' : 'θ(ω) = ±π/2 − αω'}
              </span>
            </div>

            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-auto bg-[#F8FAFC] border border-slate-200 rounded-lg"
              role="img"
              aria-label="Impulse response stem plot showing mirror symmetry"
            >
              {/* Horizontal amplitude grid */}
              {[-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5].map((v) => (
                <g key={v}>
                  <line
                    x1={padL}
                    x2={W - padR}
                    y1={toY(v)}
                    y2={toY(v)}
                    stroke={v === 0 ? '#94A3B8' : '#E2E8F0'}
                    strokeWidth={v === 0 ? 1.4 : 0.8}
                    strokeDasharray={v === 0 ? undefined : '3 3'}
                  />
                  <text
                    x={padL - 8}
                    y={toY(v) + 3.5}
                    textAnchor="end"
                    className="fill-slate-500 font-mono text-[10px]"
                  >
                    {v.toFixed(1)}
                  </text>
                </g>
              ))}

              {/* Center of symmetry vertical dashed line */}
              <line
                x1={toX(alpha)}
                x2={toX(alpha)}
                y1={padT - 8}
                y2={H - padB}
                stroke="#DC2626"
                strokeWidth={1.6}
                strokeDasharray="5 4"
              />
              <text
                x={toX(alpha)}
                y={14}
                textAnchor="middle"
                className="fill-red-600 font-mono text-[10px] font-semibold"
              >
                α = {alpha}
              </text>

              {/* Mirror pairing arcs */}
              {Array.from({ length: Math.floor(lengthM / 2) }).map((_, k) => {
                const mirror = lengthM - 1 - k;
                const x1 = toX(k);
                const x2 = toX(mirror);
                const arcY = H - padB + 4;
                const color = pairColors[k % pairColors.length];
                return (
                  <path
                    key={`arc-${k}`}
                    d={`M ${x1} ${zeroY} Q ${(x1 + x2) / 2} ${arcY} ${x2} ${zeroY}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    strokeOpacity={0.3}
                    strokeDasharray="2 2"
                  />
                );
              })}

              {/* Stems */}
              {h.map((val, n) => {
                const pairIdx = Math.min(n, lengthM - 1 - n);
                const isCenter = isOdd && n === (lengthM - 1) / 2;
                const color = isCenter
                  ? symmetry === 'antisymmetric'
                    ? '#DC2626'
                    : '#0F172A'
                  : pairColors[pairIdx % pairColors.length];
                const x = toX(n);
                const y = toY(val);
                return (
                  <g key={n}>
                    <line
                      x1={x}
                      x2={x}
                      y1={zeroY}
                      y2={y}
                      stroke={color}
                      strokeWidth={2.8}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={5.5}
                      fill={isCenter && symmetry === 'antisymmetric' ? '#FFFFFF' : color}
                      stroke={color}
                      strokeWidth={2}
                    />
                    <text
                      x={x}
                      y={val >= 0 ? y - 10 : y + 16}
                      textAnchor="middle"
                      className="fill-slate-800 font-mono text-[10px] font-semibold"
                    >
                      {val.toFixed(2)}
                    </text>
                    <text
                      x={x}
                      y={H - 10}
                      textAnchor="middle"
                      className="fill-slate-600 font-mono text-[10px]"
                    >
                      h[{n}]
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Odd-length Antisymmetric Proof Callout */}
            {isOdd && symmetry === 'antisymmetric' && (
              <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  Mandatory Center Tap Zero (Eq. 14)
                </div>
                <p className="font-mono text-[11px] leading-relaxed">
                  Center index n = (M−1)/2 = {alpha}: &nbsp; h[{alpha}] = −h[{lengthM - 1} − {alpha}] = −h[{alpha}]
                  &nbsp;⇒&nbsp; 2·h[{alpha}] = 0 &nbsp;⇒&nbsp; <strong>h[{alpha}] = 0</strong>
                </p>
                <p className="mt-1 text-amber-900">
                  Because the middle tap is strictly zero, it needs no multiplier and no adder in hardware!
                </p>
              </div>
            )}
          </div>

          {/* Live Pairwise Cancellation Proof (Eq. 8) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Live Pairwise Cancellation Verifier
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {symmetry === 'symmetric'
                    ? 'Pure linear phase requires Σ h[n]·sin(ω(α − n)) = 0 for every ω.'
                    : 'Generalized linear phase (β = ±π/2) requires Σ h[n]·cos(ω(α − n)) = 0 for every ω.'}
                </p>
              </div>
              <div className="w-48">
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="omega-test" className="font-medium text-slate-700">
                    Test Frequency ω
                  </label>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {testOmega.toFixed(2)} rad
                  </span>
                </div>
                <input
                  id="omega-test"
                  type="range"
                  min={0.1}
                  max={3.05}
                  step={0.05}
                  value={testOmega}
                  onChange={(e) => setTestOmega(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2 px-3">Mirror Pair</th>
                    <th className="py-2 px-3">Weights (h[k], h[M−1−k])</th>
                    <th className="py-2 px-3">Left Term</th>
                    <th className="py-2 px-3">Right Term</th>
                    <th className="py-2 px-3">Pair Sum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                  {cancellationBreakdown.map((row) => (
                    <tr key={row.k}>
                      <td className="py-2 px-3 text-slate-900 font-medium">
                        (n={row.k}, n={row.mirror})
                      </td>
                      <td className="py-2 px-3 text-slate-700">
                        ({row.hk.toFixed(2)}, {row.hm.toFixed(2)})
                      </td>
                      <td className="py-2 px-3 text-sky-700">
                        {row.leftTerm >= 0 ? '+' : ''}
                        {row.leftTerm.toFixed(4)}
                      </td>
                      <td className="py-2 px-3 text-amber-700">
                        {row.rightTerm >= 0 ? '+' : ''}
                        {row.rightTerm.toFixed(4)}
                      </td>
                      <td className="py-2 px-3 text-emerald-700 font-semibold">
                        {Math.abs(row.pairSum) < 1e-9 ? '0.0000' : row.pairSum.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                  {isOdd && (
                    <tr>
                      <td className="py-2 px-3 text-slate-900 font-medium">
                        Center (n={alpha})
                      </td>
                      <td className="py-2 px-3 text-slate-700">h[{alpha}] = {h[alpha].toFixed(2)}</td>
                      <td className="py-2 px-3 text-slate-500">
                        {symmetry === 'symmetric' ? 'sin(0) = 0' : 'h[α] = 0'}
                      </td>
                      <td className="py-2 px-3 text-slate-400">—</td>
                      <td className="py-2 px-3 text-emerald-700 font-semibold">0.0000</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
              <span className="inline-flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Total Unwanted Component Across All Terms:
              </span>
              <span className="font-mono font-bold tabular-nums">
                {Math.abs(totalResidual) < 1e-9 ? '0.000000' : totalResidual.toFixed(6)} (Exact Zero)
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls & Phase Result (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
            <h2 className="text-base font-semibold text-slate-900">Symmetry & Tap Controls</h2>

            {/* Symmetry Mode */}
            <div>
              <span className="block text-xs font-medium text-slate-700 mb-2">
                Impulse Response Symmetry
              </span>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSymmetry('symmetric')}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    symmetry === 'symmetric'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Even Symmetry (+)
                </button>
                <button
                  type="button"
                  onClick={() => setSymmetry('antisymmetric')}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    symmetry === 'antisymmetric'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Odd Antisymmetry (−)
                </button>
              </div>
            </div>

            {/* Filter Length M */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="length-m-slider" className="font-medium text-slate-700">
                  Filter Length M (Order N = {lengthM - 1})
                </label>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  M = {lengthM} ({isOdd ? 'Odd' : 'Even'})
                </span>
              </div>
              <input
                id="length-m-slider"
                type="range"
                min={4}
                max={9}
                step={1}
                value={lengthM}
                onChange={(e) => setLengthM(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Independent Tap Sliders */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="text-xs font-medium text-slate-700">
                Independent Taps (Mirror taps update automatically)
              </div>
              {Array.from({ length: numIndependent }).map((_, k) => {
                const isCenter = isOdd && k === (lengthM - 1) / 2;
                const mirrorIdx = lengthM - 1 - k;
                const val = halfTaps[k] ?? 0.5;
                return (
                  <div key={k}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <label htmlFor={`tap-${k}`} className="font-mono text-slate-700">
                        {isCenter
                          ? `h[${k}] (center tap)`
                          : `h[${k}] & h[${mirrorIdx}]`}
                      </label>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {val.toFixed(2)}
                        {!isCenter &&
                          ` / ${(symmetry === 'symmetric' ? val : -val).toFixed(2)}`}
                      </span>
                    </div>
                    <input
                      id={`tap-${k}`}
                      type="range"
                      min={-1.2}
                      max={1.4}
                      step={0.1}
                      value={val}
                      onChange={(e) => {
                        const next = [...halfTaps];
                        next[k] = Number(e.target.value);
                        setHalfTaps(next);
                      }}
                      className="w-full"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resulting Phase Response Summary Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Resulting Phase & Frequency Form
            </h3>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs space-y-1.5 text-slate-800">
              <div>
                <span className="text-slate-500">Phase Offset β:</span>{' '}
                <strong>{symmetry === 'symmetric' ? '0 rad (Pure Linear Phase)' : '±π/2 rad (Generalized Linear)'}</strong>
              </div>
              <div>
                <span className="text-slate-500">Group Delay τ_g:</span>{' '}
                <strong>(M − 1)/2 = {alpha.toFixed(1)} samples</strong>
              </div>
              <div>
                <span className="text-slate-500">Phase at ω = π:</span>{' '}
                <strong>
                  {freqPoints[freqPoints.length - 1].phase.toFixed(2)} rad
                </strong>
              </div>
            </div>

            {/* Derivation Summary */}
            <div className="text-xs text-slate-600 space-y-2 pt-1">
              <p>
                <strong className="text-slate-900">Why Generalized Linear Phase Still Preserves Envelopes:</strong>{' '}
                A constant ±π/2 phase offset (j factor) shifts the carrier by 90° (like a differentiator or Hilbert transformer),
                but its derivative <span className="font-mono">τ_g(ω) = −d(±π/2 − αω)/dω = α</span> remains strictly constant!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
