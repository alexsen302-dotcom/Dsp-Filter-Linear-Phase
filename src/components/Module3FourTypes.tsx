import React, { useMemo, useState } from 'react';
import {
  FILTER_TYPE_META,
  FilterTypeNumber,
  buildImpulseFromZPlaneZero,
  evaluateLinearPhaseResponse,
  getPresetImpulse,
} from '../utils/dspMath';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

type FilterRole = 'LPF' | 'HPF' | 'BPF' | 'BSF' | 'Differentiator';

export const Module3FourTypes: React.FC = () => {
  const [activeType, setActiveType] = useState<FilterTypeNumber>(2);
  const [mode, setMode] = useState<'constellation' | 'application'>('constellation');
  const [zeroR, setZeroR] = useState<number>(0.68);
  const [zeroThetaDeg, setZeroThetaDeg] = useState<number>(115);
  const [selectedRole, setSelectedRole] = useState<FilterRole>('HPF');

  const meta = FILTER_TYPE_META[activeType];
  const isRoleAllowed = meta.allowedFilters.includes(selectedRole);

  // Build impulse response & zeros based on exploration mode
  const { h, zeros } = useMemo(() => {
    if (mode === 'constellation') {
      return buildImpulseFromZPlaneZero(activeType, zeroR, (zeroThetaDeg * Math.PI) / 180);
    }
    const presetRole = isRoleAllowed ? selectedRole : meta.allowedFilters[0];
    const presetH = getPresetImpulse(activeType, presetRole);
    return { h: presetH, zeros: [] };
  }, [mode, activeType, zeroR, zeroThetaDeg, selectedRole, isRoleAllowed, meta]);

  const freqData = useMemo(() => evaluateLinearPhaseResponse(h, 160), [h]);

  // Z-Plane SVG geometry
  const ZSIZE = 280;
  const ZC = ZSIZE / 2;
  const ZSCALE = 68; // radius 1 = 68px, so radius 1.8 fits inside 140px

  // Amplitude & Magnitude SVG geometry
  const FW = 460;
  const FH = 230;
  const fPadL = 44;
  const fPadR = 16;
  const fPadT = 20;
  const fPadB = 30;
  const fPlotW = FW - fPadL - fPadR;
  const fPlotH = FH - fPadT - fPadB;

  const maxAmp = Math.max(1.2, ...freqData.map((p) => Math.abs(p.amp)));
  const fToX = (w: number) => fPadL + (w / Math.PI) * fPlotW;
  const fToY = (a: number) => fPadT + ((maxAmp - a) / (2 * maxAmp)) * fPlotH;

  const ampPath = freqData
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${fToX(p.omega).toFixed(1)} ${fToY(p.amp).toFixed(1)}`)
    .join(' ');

  const magPath = freqData
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${fToX(p.omega).toFixed(1)} ${fToY(p.mag).toFixed(1)}`)
    .join(' ');

  const dcVal = freqData[0].mag;
  const nyqVal = freqData[freqData.length - 1].mag;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-medium text-sky-700 mb-1">
            03 · Classification & Z-Plane Geometry
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            The Four Types of Linear-Phase FIR Filters
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl">
            Parity (Odd vs. Even length M) paired with Symmetry (Even vs. Odd) splits all linear-phase
            FIR filters into Types I–IV, dictating mandatory boundary zeros at DC (<span className="font-mono">z = +1</span>)
            and Nyquist (<span className="font-mono">z = −1</span>).
          </p>
        </div>

        {/* Type Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 self-start lg:self-auto">
          {([1, 2, 3, 4] as FilterTypeNumber[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveType(t)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeType === t
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Type {t === 1 ? 'I' : t === 2 ? 'II' : t === 3 ? 'III' : 'IV'}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Switch + Main Visual Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Z-Plane & Frequency Response (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {meta.label}: {meta.lengthParity} Length · {meta.symmetryLabel}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Group Delay <span className="font-mono">τ_g = {meta.groupDelayFormula}</span> · Phase Offset{' '}
                  <span className="font-mono">β = {meta.betaValue}</span>
                </p>
              </div>

              {/* Exploration Mode Switch */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMode('constellation')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    mode === 'constellation'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Z-Plane Zero Explorer
                </button>
                <button
                  type="button"
                  onClick={() => setMode('application')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    mode === 'application'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Filter Role Tester
                </button>
              </div>
            </div>

            {/* Dual Plots: Z-Plane + Frequency Response */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Z-Plane Plot */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="text-xs font-medium text-slate-700 mb-2">
                  Z-Plane Zero Constellation
                </div>
                <svg
                  viewBox={`0 0 ${ZSIZE} ${ZSIZE}`}
                  className="w-full max-w-[270px] h-auto bg-[#F8FAFC] border border-slate-200 rounded-lg"
                  role="img"
                  aria-label="Z-plane zero constellation showing unit circle and boundary zeros"
                >
                  {/* Axes */}
                  <line x1={ZC} y1={10} x2={ZC} y2={ZSIZE - 10} stroke="#CBD5E1" strokeWidth={1} />
                  <line x1={10} y1={ZC} x2={ZSIZE - 10} y2={ZC} stroke="#CBD5E1" strokeWidth={1} />
                  <text x={ZSIZE - 14} y={ZC - 6} textAnchor="end" className="fill-slate-500 font-mono text-[9px]">
                    Re(z)
                  </text>
                  <text x={ZC + 6} y={18} className="fill-slate-500 font-mono text-[9px]">
                    Im(z)
                  </text>

                  {/* Unit Circle */}
                  <circle
                    cx={ZC}
                    cy={ZC}
                    r={ZSCALE}
                    fill="none"
                    stroke="#0284C7"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                  />

                  {/* Boundary Point Markers at z = +1 and z = -1 */}
                  <circle
                    cx={ZC + ZSCALE}
                    cy={ZC}
                    r={meta.zeroAtDc ? 7.5 : 4}
                    fill={meta.zeroAtDc ? '#FEE2E2' : 'none'}
                    stroke={meta.zeroAtDc ? '#DC2626' : '#94A3B8'}
                    strokeWidth={meta.zeroAtDc ? 2.2 : 1.2}
                  />
                  <text
                    x={ZC + ZSCALE + 10}
                    y={ZC + 14}
                    className={`font-mono text-[9px] font-semibold ${
                      meta.zeroAtDc ? 'fill-red-700' : 'fill-slate-500'
                    }`}
                  >
                    +1 {meta.zeroAtDc ? '(Zero)' : '(Free)'}
                  </text>

                  <circle
                    cx={ZC - ZSCALE}
                    cy={ZC}
                    r={meta.zeroAtNyquist ? 7.5 : 4}
                    fill={meta.zeroAtNyquist ? '#FEE2E2' : 'none'}
                    stroke={meta.zeroAtNyquist ? '#DC2626' : '#94A3B8'}
                    strokeWidth={meta.zeroAtNyquist ? 2.2 : 1.2}
                  />
                  <text
                    x={ZC - ZSCALE - 8}
                    y={ZC + 14}
                    textAnchor="end"
                    className={`font-mono text-[9px] font-semibold ${
                      meta.zeroAtNyquist ? 'fill-red-700' : 'fill-slate-500'
                    }`}
                  >
                    −1 {meta.zeroAtNyquist ? '(Zero)' : '(Free)'}
                  </text>

                  {/* Movable / Quadruplet Zeros (in constellation mode) */}
                  {mode === 'constellation' &&
                    zeros.map((z, idx) => {
                      const cx = ZC + z.re * ZSCALE;
                      const cy = ZC - z.im * ZSCALE;
                      const isMandatory =
                        (meta.zeroAtDc && Math.abs(z.re - 1) < 0.01 && Math.abs(z.im) < 0.01) ||
                        (meta.zeroAtNyquist && Math.abs(z.re + 1) < 0.01 && Math.abs(z.im) < 0.01);
                      if (isMandatory) return null;
                      return (
                        <circle
                          key={idx}
                          cx={Math.max(12, Math.min(ZSIZE - 12, cx))}
                          cy={Math.max(12, Math.min(ZSIZE - 12, cy))}
                          r={4.8}
                          fill="#FFFFFF"
                          stroke="#0284C7"
                          strokeWidth={2.2}
                        />
                      );
                    })}
                </svg>

                {mode === 'constellation' && (
                  <p className="text-[11px] text-slate-500 mt-2 text-center">
                    {Math.abs(zeroR - 1) < 0.06
                      ? 'Unit-circle conjugate pair {e^jθ, e^−jθ}'
                      : 'Reciprocal conjugate quadruplet {z₀, z₀*, 1/z₀, 1/z₀*}'}
                  </p>
                )}
              </div>

              {/* Amplitude & Magnitude Plot */}
              <div className="md:col-span-7">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-medium text-slate-700">
                    Frequency Response A(ω) & |H(e^jω)|
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-sky-700 font-medium">
                      <span className="w-2.5 h-0.5 bg-sky-600 inline-block" /> |H(e^jω)|
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                      <span className="w-2.5 h-0.5 bg-slate-400 inline-block" /> A(ω)
                    </span>
                  </div>
                </div>

                <svg
                  viewBox={`0 0 ${FW} ${FH}`}
                  className="w-full h-auto bg-[#F8FAFC] border border-slate-200 rounded-lg"
                  role="img"
                  aria-label="Amplitude and magnitude frequency response plot"
                >
                  {[-1, -0.5, 0, 0.5, 1].map((frac) => {
                    const val = frac * maxAmp;
                    return (
                      <g key={frac}>
                        <line
                          x1={fPadL}
                          x2={FW - fPadR}
                          y1={fToY(val)}
                          y2={fToY(val)}
                          stroke={frac === 0 ? '#94A3B8' : '#E2E8F0'}
                          strokeWidth={frac === 0 ? 1.2 : 0.8}
                          strokeDasharray={frac === 0 ? undefined : '3 3'}
                        />
                        <text
                          x={fPadL - 6}
                          y={fToY(val) + 3}
                          textAnchor="end"
                          className="fill-slate-500 font-mono text-[9px]"
                        >
                          {val.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}

                  {[
                    { w: 0, label: '0 (DC)' },
                    { w: Math.PI / 2, label: 'π/2' },
                    { w: Math.PI, label: 'π (Nyquist)' },
                  ].map((t) => (
                    <text
                      key={t.label}
                      x={fToX(t.w)}
                      y={FH - 8}
                      textAnchor={t.w === 0 ? 'start' : t.w === Math.PI ? 'end' : 'middle'}
                      className="fill-slate-500 font-mono text-[9px]"
                    >
                      {t.label}
                    </text>
                  ))}

                  <path d={ampPath} fill="none" stroke="#94A3B8" strokeWidth={1.6} strokeDasharray="4 3" />
                  <path d={magPath} fill="none" stroke="#0284C7" strokeWidth={2.4} />

                  {/* Boundary indicators at w=0 and w=pi */}
                  <circle
                    cx={fToX(0)}
                    cy={fToY(dcVal)}
                    r={4.5}
                    fill={meta.zeroAtDc ? '#DC2626' : '#059669'}
                  />
                  <circle
                    cx={fToX(Math.PI)}
                    cy={fToY(nyqVal)}
                    r={4.5}
                    fill={meta.zeroAtNyquist ? '#DC2626' : '#059669'}
                  />
                </svg>

                <div className="grid grid-cols-2 gap-3 mt-3 text-xs font-mono tabular-nums">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 font-sans text-[11px]">At ω = 0 (z = +1)</div>
                    <div className={`font-semibold mt-0.5 ${meta.zeroAtDc ? 'text-red-700' : 'text-emerald-700'}`}>
                      |H(1)| = {dcVal.toFixed(3)} {meta.zeroAtDc ? '· FORCED ZERO' : '· FREE'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 font-sans text-[11px]">At ω = π (z = −1)</div>
                    <div className={`font-semibold mt-0.5 ${meta.zeroAtNyquist ? 'text-red-700' : 'text-emerald-700'}`}>
                      |H(−1)| = {nyqVal.toFixed(3)} {meta.zeroAtNyquist ? '· FORCED ZERO' : '· FREE'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comprehensive Type I-IV Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Complete Classification Matrix (Click any row to inspect)
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Length M</th>
                    <th className="py-2.5 px-3">Symmetry</th>
                    <th className="py-2.5 px-3">Group Delay τ_g</th>
                    <th className="py-2.5 px-3">Zero at ω = 0?</th>
                    <th className="py-2.5 px-3">Zero at ω = π?</th>
                    <th className="py-2.5 px-3">Allowed Filters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {([1, 2, 3, 4] as FilterTypeNumber[]).map((t) => {
                    const row = FILTER_TYPE_META[t];
                    const selected = activeType === t;
                    return (
                      <tr
                        key={t}
                        onClick={() => setActiveType(t)}
                        className={`cursor-pointer transition-colors ${
                          selected ? 'bg-sky-50/80' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{row.label}</td>
                        <td className="py-2.5 px-3">{row.lengthParity}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          {row.symmetry === 'symmetric' ? 'h[n] = h[M−1−n]' : 'h[n] = −h[M−1−n]'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">{row.groupDelayFormula}</td>
                        <td className={`py-2.5 px-3 font-medium ${row.zeroAtDc ? 'text-red-700' : 'text-slate-600'}`}>
                          {row.zeroAtDc ? 'Yes (Mandatory)' : 'No'}
                        </td>
                        <td className={`py-2.5 px-3 font-medium ${row.zeroAtNyquist ? 'text-red-700' : 'text-slate-600'}`}>
                          {row.zeroAtNyquist ? 'Yes (Mandatory)' : 'No'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800">{row.allowedFilters.join(', ')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Controls & Conceptual Insight (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {mode === 'constellation' ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Move Zero z₀ = r · e^(jθ)
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Observe how placing a zero automatically creates its reciprocal & conjugate partners to keep coefficients linear-phase.
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <label htmlFor="zero-r" className="font-medium text-slate-700">
                    Zero Radius r
                  </label>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {Math.abs(zeroR - 1) < 0.06 ? '1.00 (Unit Circle)' : zeroR.toFixed(2)}
                  </span>
                </div>
                <input
                  id="zero-r"
                  type="range"
                  min={0.35}
                  max={1.0}
                  step={0.01}
                  value={zeroR}
                  onChange={(e) => setZeroR(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => setZeroR(1.0)}
                    className="text-[11px] font-medium text-sky-700 hover:underline"
                  >
                    Snap to Unit Circle (Notch)
                  </button>
                  <button
                    type="button"
                    onClick={() => setZeroR(0.65)}
                    className="text-[11px] font-medium text-slate-600 hover:underline"
                  >
                    Set Off-Circle Quadruplet
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <label htmlFor="zero-theta" className="font-medium text-slate-700">
                    Notch Angle θ
                  </label>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {zeroThetaDeg}° ({((zeroThetaDeg * Math.PI) / 180).toFixed(2)} rad)
                  </span>
                </div>
                <input
                  id="zero-theta"
                  type="range"
                  min={15}
                  max={165}
                  step={1}
                  value={zeroThetaDeg}
                  onChange={(e) => setZeroThetaDeg(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="pt-3 border-t border-slate-200">
                <div className="text-xs font-medium text-slate-700 mb-2">
                  Synthesized Impulse Response h[n] (M = {h.length})
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 break-words tabular-nums">
                  [ {h.map((v) => v.toFixed(3)).join(', ')} ]
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Test Filter Role Compatibility
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Pick a target filter shape to test if {meta.label} can physically realize it.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(['LPF', 'HPF', 'BPF', 'BSF', 'Differentiator'] as FilterRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                      selectedRole === role
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <div
                className={`p-4 rounded-lg border text-xs ${
                  isRoleAllowed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-red-50 border-red-200 text-red-950'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold mb-1">
                  {isRoleAllowed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>
                    {isRoleAllowed
                      ? `ALLOWED: ${meta.label} supports ${selectedRole}`
                      : `FORBIDDEN: ${meta.label} cannot realize ${selectedRole}`}
                  </span>
                </div>
                <p className="leading-relaxed mt-1">{meta.forbiddenNote}</p>
              </div>
            </div>
          )}

          {/* Type II Nyquist Proof Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
            <h3 className="text-sm font-semibold text-slate-900">
              Boundary Zero Theorem ({meta.label})
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {activeType === 1 &&
                'Type I sums cos(ωk) terms plus a center tap h[(M−1)/2]. Neither ω = 0 nor ω = π forces cancellation, making Type I the universal choice for LPF, HPF, BPF, and BSF.'}
              {activeType === 2 &&
                'Type II pairs cos(ω(k − 1/2)). Evaluating at ω = π gives cos(πk − π/2) = 0 for every integer k, proving A(π) = 0 unconditionally. Never use Type II for an HPF or BSF.'}
              {activeType === 3 &&
                'Type III uses sin(ωk), which vanishes at both ω = 0 (sin 0 = 0) and ω = π (sin πk = 0). Furthermore, the center tap h[(M−1)/2] is zero.'}
              {activeType === 4 &&
                'Type IV uses sin(ω(k − 1/2)). At ω = 0 it vanishes (sin 0 = 0), but at ω = π, sin(πk − π/2) = ±1 ≠ 0, making Type IV ideal for wideband HPFs and differentiators.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
