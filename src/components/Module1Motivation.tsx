import React, { useMemo, useState } from 'react';
import { simulatePhaseDistortion, WaveformKind } from '../utils/dspMath';
import { AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';

const DOMAIN_INFO: Record<
  WaveformKind,
  {
    label: string;
    domain: string;
    consequence: string;
  }
> = {
  ecg: {
    label: 'ECG Pulse',
    domain: 'Biomedical (ECG / EEG)',
    consequence:
      'Non-linear phase alters QRS peak heights and shifts the ST segment, risking false-positive or false-negative clinical diagnoses.',
  },
  qam_pulse: {
    label: 'Telecom Symbol',
    domain: 'Digital Telecom (QAM / OFDM)',
    consequence:
      'Pulse tails smear across adjacent symbol slots, causing Inter-Symbol Interference (ISI) and collapsing the eye diagram.',
  },
  audio_transient: {
    label: 'Audio Transient',
    domain: 'High-Fidelity Audio',
    consequence:
      'High-frequency attack harmonics lag behind low-frequency fundamentals, smearing drum/piano transients and dulling clarity.',
  },
  square_burst: {
    label: 'Edge / Step',
    domain: 'Image & Edge Processing',
    consequence:
      'Asymmetric phase dispersion causes overshoot on one side of an edge, creating artificial ghost outlines.',
  },
};

export const Module1Motivation: React.FC = () => {
  const [waveform, setWaveform] = useState<WaveformKind>('ecg');
  const [alphaDelay, setAlphaDelay] = useState<number>(8);
  const [dispersion, setDispersion] = useState<number>(1.6);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [poleRadius, setPoleRadius] = useState<number>(0.72);
  const [poleAngleDeg, setPoleAngleDeg] = useState<number>(42);

  const sim = useMemo(
    () => simulatePhaseDistortion(waveform, alphaDelay, dispersion),
    [waveform, alphaDelay, dispersion]
  );

  // SVG dimensions for Time-Domain Chart
  const W = 720;
  const H_TIME = 230;
  const padL = 46;
  const padR = 18;
  const padT = 20;
  const padB = 30;
  const plotW = W - padL - padR;
  const plotH = H_TIME - padT - padB;

  const yMin = -1.3;
  const yMax = 1.65;
  const toX = (idx: number) => padL + (idx / (sim.t.length - 1)) * plotW;
  const toY = (val: number) => padT + ((yMax - val) / (yMax - yMin)) * plotH;

  const buildPath = (arr: number[]) =>
    arr
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`)
      .join(' ');

  // Phase & Group Delay charts
  const H_SMALL = 165;
  const sW = 340;
  const sPadL = 44;
  const sPadR = 14;
  const sPadT = 16;
  const sPadB = 26;
  const sPlotW = sW - sPadL - sPadR;
  const sPlotH = H_SMALL - sPadT - sPadB;

  const freqToX = (w: number) => sPadL + (w / Math.PI) * sPlotW;
  const phaseMin = -45;
  const phaseMax = 2;
  const phaseToY = (p: number) => {
    const clamped = Math.max(phaseMin, Math.min(phaseMax, p));
    return sPadT + ((phaseMax - clamped) / (phaseMax - phaseMin)) * sPlotH;
  };

  const maxGd = Math.max(22, ...sim.dispersedGroupDelay, alphaDelay + 6);
  const gdToY = (g: number) => sPadT + ((maxGd - Math.min(maxGd, g)) / maxGd) * sPlotH;

  const buildFreqPath = (vals: number[], yMap: (v: number) => number) =>
    sim.frequencies
      .map((w, i) => `${i === 0 ? 'M' : 'L'} ${freqToX(w).toFixed(1)} ${yMap(vals[i]).toFixed(1)}`)
      .join(' ');

  // IIR Mirror Pole math
  const poleRad = (poleAngleDeg * Math.PI) / 180;
  const p1Re = poleRadius * Math.cos(poleRad);
  const p1Im = poleRadius * Math.sin(poleRad);
  const mirrorR = 1 / poleRadius;
  const p2Re = mirrorR * Math.cos(poleRad);
  const p2Im = mirrorR * Math.sin(poleRad);

  const info = DOMAIN_INFO[waveform];

  return (
    <div className="space-y-8">
      {/* Header Lead */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-medium text-sky-700 mb-1">
            01 · Motivation & Physical Significance
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Why Linear Phase Preserves Waveform Shape
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl">
            Even an <span className="font-mono text-slate-900">|H(e^jω)| = 1</span> all-pass filter
            destroys a pulse if its group delay{' '}
            <span className="font-mono text-slate-900">τ_g(ω) = −dθ/dω</span> varies with frequency.
            Explore how constant delay shifts signals intact while non-linear phase disperses them.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setWaveform('ecg');
            setAlphaDelay(8);
            setDispersion(1.6);
            setShowOverlay(true);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 self-start lg:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Lab
        </button>
      </div>

      {/* Main Two-Zone Simulation Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Interactive Stage (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Time Domain Waveform Comparison */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Time-Domain Output Comparison (All-Pass |H(e^jω)| = 1)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparing pure linear-phase delay <span className="font-mono">y[n] = x[n − α]</span> against dispersive non-linear phase.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                  <span className="w-3 h-0.5 bg-slate-400 inline-block" /> Input x[n]
                </span>
                <span className="inline-flex items-center gap-1.5 text-sky-700 font-medium">
                  <span className="w-3 h-0.5 bg-sky-600 inline-block" /> Linear Phase (Undistorted)
                </span>
                <span className="inline-flex items-center gap-1.5 text-red-600 font-medium">
                  <span className="w-3 h-0.5 bg-red-600 inline-block" /> Non-Linear (Dispersed)
                </span>
              </div>
            </div>

            <svg
              viewBox={`0 0 ${W} ${H_TIME}`}
              className="w-full h-auto bg-[#F8FAFC] border border-slate-200 rounded-lg"
              role="img"
              aria-label="Time domain comparison of input, linear phase output, and dispersed output"
            >
              {/* Grid lines */}
              {[-1, -0.5, 0, 0.5, 1, 1.5].map((val) => (
                <g key={val}>
                  <line
                    x1={padL}
                    x2={W - padR}
                    y1={toY(val)}
                    y2={toY(val)}
                    stroke={val === 0 ? '#CBD5E1' : '#E2E8F0'}
                    strokeWidth={val === 0 ? 1.2 : 0.8}
                    strokeDasharray={val === 0 ? undefined : '3 3'}
                  />
                  <text
                    x={padL - 8}
                    y={toY(val) + 3.5}
                    textAnchor="end"
                    className="fill-slate-500 font-mono text-[10px]"
                  >
                    {val.toFixed(1)}
                  </text>
                </g>
              ))}

              {/* X-axis sample ticks */}
              {[0, 30, 60, 90, 120, 150].map((n) => (
                <g key={n}>
                  <line
                    x1={toX(n)}
                    x2={toX(n)}
                    y1={padT}
                    y2={H_TIME - padB}
                    stroke="#E2E8F0"
                    strokeWidth={0.8}
                    strokeDasharray="3 3"
                  />
                  <text
                    x={toX(n)}
                    y={H_TIME - 10}
                    textAnchor="middle"
                    className="fill-slate-500 font-mono text-[10px]"
                  >
                    {n}
                  </text>
                </g>
              ))}

              <text
                x={W - padR}
                y={H_TIME - 10}
                textAnchor="end"
                className="fill-slate-500 font-mono text-[10px]"
              >
                Sample n
              </text>

              {/* Delay arrow indicator between input peak (~48) and linear output peak (48 + alpha) */}
              {alphaDelay > 0 && (
                <g>
                  <line
                    x1={toX(48)}
                    x2={toX(48 + alphaDelay)}
                    y1={toY(1.48)}
                    y2={toY(1.48)}
                    stroke="#0284C7"
                    strokeWidth={1.5}
                  />
                  <text
                    x={(toX(48) + toX(48 + alphaDelay)) / 2}
                    y={toY(1.48) - 5}
                    textAnchor="middle"
                    className="fill-sky-700 font-mono text-[10px] font-medium"
                  >
                    α = {alphaDelay}
                  </text>
                </g>
              )}

              {/* Waveforms */}
              <path
                d={buildPath(sim.input)}
                fill="none"
                stroke="#94A3B8"
                strokeWidth={1.6}
                strokeDasharray="4 3"
              />
              {showOverlay && (
                <path
                  d={buildPath(sim.linearOutput)}
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth={2.2}
                />
              )}
              <path
                d={buildPath(sim.dispersedOutput)}
                fill="none"
                stroke={dispersion < 0.05 ? '#059669' : '#DC2626'}
                strokeWidth={2.1}
              />
            </svg>

            {/* Explicit State Callout */}
            <div className="mt-4 flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
              {dispersion < 0.05 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold text-slate-900">
                  {dispersion < 0.05 ? 'NOMINAL — Zero Dispersion: ' : `DISPERSIVE — ${info.domain}: `}
                </span>
                {dispersion < 0.05
                  ? `All frequency components experience identical group delay τ_g(ω) = ${alphaDelay} samples. Output is a pure time-shifted replica.`
                  : info.consequence}
              </div>
            </div>
          </div>

          {/* Synchronized Phase & Group Delay Curves */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phase Response theta(omega) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900">Phase Response θ(ω)</h3>
                <span className="font-mono text-xs text-slate-500">θ(ω) = −αω</span>
              </div>
              <svg
                viewBox={`0 0 ${sW} ${H_SMALL}`}
                className="w-full h-auto bg-[#F8FAFC] border border-slate-200 rounded-lg"
                role="img"
                aria-label="Phase response plot"
              >
                {[0, -15, -30, -45].map((p) => (
                  <g key={p}>
                    <line
                      x1={sPadL}
                      x2={sW - sPadR}
                      y1={phaseToY(p)}
                      y2={phaseToY(p)}
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={sPadL - 6}
                      y={phaseToY(p) + 3}
                      textAnchor="end"
                      className="fill-slate-500 font-mono text-[10px]"
                    >
                      {p}
                    </text>
                  </g>
                ))}
                {[
                  { w: 0, label: '0' },
                  { w: Math.PI / 2, label: 'π/2' },
                  { w: Math.PI, label: 'π' },
                ].map((tick) => (
                  <text
                    key={tick.label}
                    x={freqToX(tick.w)}
                    y={H_SMALL - 8}
                    textAnchor="middle"
                    className="fill-slate-500 font-mono text-[10px]"
                  >
                    {tick.label}
                  </text>
                ))}
                <path
                  d={buildFreqPath(sim.linearPhases, phaseToY)}
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth={2}
                />
                <path
                  d={buildFreqPath(sim.dispersedPhases, phaseToY)}
                  fill="none"
                  stroke={dispersion < 0.05 ? '#059669' : '#DC2626'}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                />
              </svg>
              <p className="text-xs text-slate-600 mt-2">
                Straight line = constant slope = linear phase. Curvature means high frequencies lag further behind.
              </p>
            </div>

            {/* Group Delay tau_g(omega) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900">Group Delay τ_g(ω)</h3>
                <span className="font-mono text-xs text-slate-500">−dθ(ω)/dω</span>
              </div>
              <svg
                viewBox={`0 0 ${sW} ${H_SMALL}`}
                className="w-full h-auto bg-[#F8FAFC] border border-slate-200 rounded-lg"
                role="img"
                aria-label="Group delay plot"
              >
                {[0, Math.round(maxGd / 2), Math.round(maxGd)].map((g) => (
                  <g key={g}>
                    <line
                      x1={sPadL}
                      x2={sW - sPadR}
                      y1={gdToY(g)}
                      y2={gdToY(g)}
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={sPadL - 6}
                      y={gdToY(g) + 3}
                      textAnchor="end"
                      className="fill-slate-500 font-mono text-[10px]"
                    >
                      {g}
                    </text>
                  </g>
                ))}
                {[
                  { w: 0, label: '0' },
                  { w: Math.PI / 2, label: 'π/2' },
                  { w: Math.PI, label: 'π' },
                ].map((tick) => (
                  <text
                    key={tick.label}
                    x={freqToX(tick.w)}
                    y={H_SMALL - 8}
                    textAnchor="middle"
                    className="fill-slate-500 font-mono text-[10px]"
                  >
                    {tick.label}
                  </text>
                ))}
                <path
                  d={buildFreqPath(sim.linearGroupDelay, gdToY)}
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth={2}
                />
                <path
                  d={buildFreqPath(sim.dispersedGroupDelay, gdToY)}
                  fill="none"
                  stroke={dispersion < 0.05 ? '#059669' : '#DC2626'}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                />
              </svg>
              <p className="text-xs text-slate-600 mt-2">
                Constant <span className="font-mono">τ_g = {alphaDelay}</span> keeps every frequency aligned in time.
              </p>
            </div>
          </div>
        </div>

        {/* Right Control & Concept Deck (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
            <h2 className="text-base font-semibold text-slate-900">Signal & Dispersion Controls</h2>

            {/* Signal Domain Preset */}
            <div>
              <span className="block text-xs font-medium text-slate-700 mb-2">
                Engineering Signal Domain
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(DOMAIN_INFO) as WaveformKind[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setWaveform(key)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-colors whitespace-nowrap truncate ${
                      waveform === key
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {DOMAIN_INFO[key].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Alpha Delay Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="alpha-slider" className="font-medium text-slate-700">
                  Target Delay α
                </label>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {alphaDelay} samples
                </span>
              </div>
              <input
                id="alpha-slider"
                type="range"
                min={0}
                max={16}
                step={1}
                value={alphaDelay}
                onChange={(e) => setAlphaDelay(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Dispersion Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="dispersion-slider" className="font-medium text-slate-700">
                  Phase Non-Linearity (Dispersion)
                </label>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {dispersion.toFixed(2)} rad/ω²
                </span>
              </div>
              <input
                id="dispersion-slider"
                type="range"
                min={0}
                max={2.5}
                step={0.05}
                value={dispersion}
                onChange={(e) => setDispersion(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>0.0 (Linear Phase)</span>
                <span>2.5 (Severe Smearing)</span>
              </div>
            </div>

            {/* Overlay Toggle */}
            <label className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200 cursor-pointer">
              <span className="text-xs font-medium text-slate-700">
                Overlay Ideal Linear-Phase Output
              </span>
              <input
                type="checkbox"
                checked={showOverlay}
                onChange={(e) => setShowOverlay(e.target.checked)}
                className="w-4 h-4 accent-sky-600 rounded"
              />
            </label>
          </div>

          {/* Why FIR instead of IIR Interactive Proof */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Why FIR Instead of IIR?
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                For an IIR filter to have linear phase, its poles must occur in reciprocal mirror pairs{' '}
                <span className="font-mono text-slate-900">(p_k, 1/p_k*)</span>.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <svg
                viewBox="0 0 150 150"
                className="w-36 h-36 shrink-0 bg-[#F8FAFC] border border-slate-200 rounded-lg"
                role="img"
                aria-label="Z-plane illustrating unstable reciprocal IIR pole"
              >
                {/* Axes */}
                <line x1={75} y1={8} x2={75} y2={142} stroke="#CBD5E1" strokeWidth={1} />
                <line x1={8} y1={75} x2={142} y2={75} stroke="#CBD5E1" strokeWidth={1} />
                {/* Unit Circle r = 34px */}
                <circle
                  cx={75}
                  cy={75}
                  r={34}
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth={1.4}
                  strokeDasharray="3 2"
                />
                {/* Stable pole p_k inside */}
                <g transform={`translate(${75 + p1Re * 34}, ${75 - p1Im * 34})`}>
                  <line x1={-4} y1={-4} x2={4} y2={4} stroke="#059669" strokeWidth={2} />
                  <line x1={-4} y1={4} x2={4} y2={-4} stroke="#059669" strokeWidth={2} />
                </g>
                {/* Conjugate pole */}
                <g transform={`translate(${75 + p1Re * 34}, ${75 + p1Im * 34})`}>
                  <line x1={-4} y1={-4} x2={4} y2={4} stroke="#059669" strokeWidth={2} />
                  <line x1={-4} y1={4} x2={4} y2={-4} stroke="#059669" strokeWidth={2} />
                </g>
                {/* Unstable reciprocal mirror pole 1/p_k* */}
                <g
                  transform={`translate(${Math.min(140, Math.max(10, 75 + p2Re * 34))}, ${Math.min(
                    140,
                    Math.max(10, 75 - p2Im * 34)
                  )})`}
                >
                  <line x1={-4} y1={-4} x2={4} y2={4} stroke="#DC2626" strokeWidth={2} />
                  <line x1={-4} y1={4} x2={4} y2={-4} stroke="#DC2626" strokeWidth={2} />
                </g>
                <g
                  transform={`translate(${Math.min(140, Math.max(10, 75 + p2Re * 34))}, ${Math.min(
                    140,
                    Math.max(10, 75 + p2Im * 34)
                  )})`}
                >
                  <line x1={-4} y1={-4} x2={4} y2={4} stroke="#DC2626" strokeWidth={2} />
                  <line x1={-4} y1={4} x2={4} y2={-4} stroke="#DC2626" strokeWidth={2} />
                </g>
              </svg>

              <div className="space-y-2.5 text-xs flex-1 min-w-0">
                <div>
                  <div className="flex justify-between mb-1">
                    <label htmlFor="pole-r" className="text-slate-700 font-medium">
                      Pole |p_k|
                    </label>
                    <span className="font-mono text-emerald-700 font-semibold tabular-nums">
                      {poleRadius.toFixed(2)}
                    </span>
                  </div>
                  <input
                    id="pole-r"
                    type="range"
                    min={0.5}
                    max={0.95}
                    step={0.01}
                    value={poleRadius}
                    onChange={(e) => setPoleRadius(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label htmlFor="pole-ang" className="text-slate-700 font-medium">
                      Angle φ
                    </label>
                    <span className="font-mono text-slate-800 tabular-nums">{poleAngleDeg}°</span>
                  </div>
                  <input
                    id="pole-ang"
                    type="range"
                    min={10}
                    max={170}
                    step={2}
                    value={poleAngleDeg}
                    onChange={(e) => setPoleAngleDeg(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="p-2 rounded bg-red-50 border border-red-200 text-red-800 font-mono text-[11px] tabular-nums">
                  Mirror |1/p_k*| = {mirrorR.toFixed(2)} &gt; 1 (Unstable!)
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              A pole inside the unit circle forces its mirror partner outside, violating causal BIBO
              stability. Therefore, exact linear phase requires an <strong className="text-slate-900">FIR filter</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
