export type FilterTypeNumber = 1 | 2 | 3 | 4;
export type SymmetryKind = 'symmetric' | 'antisymmetric';

export interface Complex {
  re: number;
  im: number;
}

export interface FrequencyPoint {
  omega: number; // 0 to pi
  mag: number;
  amp: number; // A(omega)
  phase: number; // unwrapped phase in radians
  tauP: number; // phase delay
  tauG: number; // group delay
}

export interface HardwareAudit {
  lengthM: number;
  orderN: number;
  symmetry: SymmetryKind;
  type: FilterTypeNumber;
  alpha: number;
  betaLabel: string;
  directMultipliers: number;
  directAdders: number;
  directDelays: number;
  foldedMultipliers: number;
  preAdders: number;
  accumAdders: number;
  totalFoldedAdders: number;
  foldedDelays: number;
  savingsPercent: number;
  centerTapZero: boolean;
}

export interface FilterTypeMeta {
  type: FilterTypeNumber;
  label: string;
  lengthParity: 'Odd' | 'Even';
  symmetry: SymmetryKind;
  symmetryLabel: string;
  groupDelayFormula: string;
  betaValue: string;
  zeroAtDc: boolean;
  zeroAtNyquist: boolean;
  allowedFilters: ('LPF' | 'HPF' | 'BPF' | 'BSF' | 'Differentiator')[];
  forbiddenNote: string;
}

export const FILTER_TYPE_META: Record<FilterTypeNumber, FilterTypeMeta> = {
  1: {
    type: 1,
    label: 'Type I',
    lengthParity: 'Odd',
    symmetry: 'symmetric',
    symmetryLabel: 'Even Symmetry (h[n] = h[M−1−n])',
    groupDelayFormula: '(M − 1) / 2 (Integer)',
    betaValue: '0',
    zeroAtDc: false,
    zeroAtNyquist: false,
    allowedFilters: ['LPF', 'HPF', 'BPF', 'BSF'],
    forbiddenNote: 'No mandatory boundary zeros — can realize any standard magnitude shape.',
  },
  2: {
    type: 2,
    label: 'Type II',
    lengthParity: 'Even',
    symmetry: 'symmetric',
    symmetryLabel: 'Even Symmetry (h[n] = h[M−1−n])',
    groupDelayFormula: '(M − 1) / 2 (Half-integer)',
    betaValue: '0',
    zeroAtDc: false,
    zeroAtNyquist: true,
    allowedFilters: ['LPF', 'BPF'],
    forbiddenNote: 'Mandatory zero at z = −1 (ω = π) permanently prevents HPF and BSF designs.',
  },
  3: {
    type: 3,
    label: 'Type III',
    lengthParity: 'Odd',
    symmetry: 'antisymmetric',
    symmetryLabel: 'Odd Symmetry (h[n] = −h[M−1−n])',
    groupDelayFormula: '(M − 1) / 2 (Integer)',
    betaValue: '±π / 2',
    zeroAtDc: true,
    zeroAtNyquist: true,
    allowedFilters: ['BPF', 'Differentiator'],
    forbiddenNote: 'Mandatory zeros at both z = +1 (ω = 0) and z = −1 (ω = π); center tap h[(M−1)/2] = 0.',
  },
  4: {
    type: 4,
    label: 'Type IV',
    lengthParity: 'Even',
    symmetry: 'antisymmetric',
    symmetryLabel: 'Odd Symmetry (h[n] = −h[M−1−n])',
    groupDelayFormula: '(M − 1) / 2 (Half-integer)',
    betaValue: '±π / 2',
    zeroAtDc: true,
    zeroAtNyquist: false,
    allowedFilters: ['HPF', 'Differentiator'],
    forbiddenNote: 'Mandatory zero at z = +1 (ω = 0) blocks LPF/BSF, while passing ω = π for wideband HPF & differentiators.',
  },
};

export function classifyFilter(h: number[]): FilterTypeNumber {
  const M = h.length;
  const isOdd = M % 2 === 1;
  let isAntisym = true;
  for (let i = 0; i < Math.floor(M / 2); i++) {
    if (Math.abs(h[i] + h[M - 1 - i]) > 1e-4) {
      isAntisym = false;
      break;
    }
  }
  if (isOdd && Math.abs(h[(M - 1) / 2]) > 1e-4) {
    isAntisym = false;
  }
  if (isOdd && !isAntisym) return 1;
  if (!isOdd && !isAntisym) return 2;
  if (isOdd && isAntisym) return 3;
  return 4;
}

export function computeRealAmplitude(h: number[], omega: number, type: FilterTypeNumber): number {
  const M = h.length;
  if (type === 1) {
    const center = (M - 1) / 2;
    let sum = h[center];
    for (let k = 1; k <= center; k++) {
      sum += 2 * h[center - k] * Math.cos(omega * k);
    }
    return sum;
  }
  if (type === 2) {
    const half = M / 2;
    let sum = 0;
    for (let k = 1; k <= half; k++) {
      sum += 2 * h[half - k] * Math.cos(omega * (k - 0.5));
    }
    return sum;
  }
  if (type === 3) {
    const center = (M - 1) / 2;
    let sum = 0;
    for (let k = 1; k <= center; k++) {
      sum += 2 * h[center - k] * Math.sin(omega * k);
    }
    return sum;
  }
  // Type IV
  const half = M / 2;
  let sum = 0;
  for (let k = 1; k <= half; k++) {
    sum += 2 * h[half - k] * Math.sin(omega * (k - 0.5));
  }
  return sum;
}

export function evaluateLinearPhaseResponse(
  h: number[],
  numPoints = 180
): FrequencyPoint[] {
  const M = h.length;
  const type = classifyFilter(h);
  const alpha = (M - 1) / 2;
  const beta = type === 3 || type === 4 ? Math.PI / 2 : 0;

  const points: FrequencyPoint[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const omega = (i / numPoints) * Math.PI;
    const amp = computeRealAmplitude(h, omega, type);
    const mag = Math.abs(amp);
    const phase = beta - alpha * omega;
    const tauP = omega > 0.02 ? -phase / omega : alpha;
    const tauG = alpha;
    points.push({ omega, mag, amp, phase, tauP, tauG });
  }
  return points;
}

export function computeHardwareAudit(h: number[], typeOverride?: FilterTypeNumber): HardwareAudit {
  const M = h.length;
  const type = typeOverride ?? classifyFilter(h);
  const symmetry: SymmetryKind = type === 1 || type === 2 ? 'symmetric' : 'antisymmetric';
  const isOdd = M % 2 === 1;
  const alpha = (M - 1) / 2;

  let foldedMultipliers: number;
  let preAdders: number;
  let accumAdders: number;
  let totalFoldedAdders: number;

  if (symmetry === 'symmetric') {
    if (isOdd) {
      foldedMultipliers = (M + 1) / 2;
      preAdders = (M - 1) / 2;
      accumAdders = (M - 1) / 2;
      totalFoldedAdders = M - 1;
    } else {
      foldedMultipliers = M / 2;
      preAdders = M / 2;
      accumAdders = M / 2 - 1;
      totalFoldedAdders = M - 1;
    }
  } else {
    if (isOdd) {
      foldedMultipliers = (M - 1) / 2;
      preAdders = (M - 1) / 2;
      accumAdders = Math.max(0, (M - 3) / 2);
      totalFoldedAdders = Math.max(0, M - 2);
    } else {
      foldedMultipliers = M / 2;
      preAdders = M / 2;
      accumAdders = M / 2 - 1;
      totalFoldedAdders = M - 1;
    }
  }

  const savingsPercent = ((M - foldedMultipliers) / M) * 100;

  return {
    lengthM: M,
    orderN: M - 1,
    symmetry,
    type,
    alpha,
    betaLabel: symmetry === 'symmetric' ? '0' : '±π/2',
    directMultipliers: M,
    directAdders: M - 1,
    directDelays: M - 1,
    foldedMultipliers,
    preAdders,
    accumAdders,
    totalFoldedAdders,
    foldedDelays: M - 1,
    savingsPercent,
    centerTapZero: isOdd && symmetry === 'antisymmetric',
  };
}

/**
 * Construct impulse response h[n] directly from a set of Z-plane zeros
 * guaranteeing exact linear-phase reciprocal symmetry.
 */
export function polyMul(a: number[], b: number[]): number[] {
  const res = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      res[i + j] += a[i] * b[j];
    }
  }
  return res;
}

export function buildImpulseFromZPlaneZero(
  type: FilterTypeNumber,
  r: number,
  theta: number
): { h: number[]; zeros: Complex[] } {
  const zeros: Complex[] = [];
  // Clamp r away from 0 to avoid singular 1/r
  const safeR = Math.max(0.25, Math.min(0.98, r));
  const onUnitCircle = Math.abs(r - 1) < 0.06;
  const effectiveR = onUnitCircle ? 1 : safeR;

  let poly: number[] = [1];

  // Mandatory boundary zeros by type
  if (type === 2) {
    // Zero at z = -1 => (1 + z^-1)
    poly = polyMul(poly, [1, 1]);
    zeros.push({ re: -1, im: 0 });
  } else if (type === 3) {
    // Zeros at z = +1 and z = -1 => (1 - z^-1)(1 + z^-1) = 1 - z^-2
    poly = polyMul(poly, [1, 0, -1]);
    zeros.push({ re: 1, im: 0 }, { re: -1, im: 0 });
  } else if (type === 4) {
    // Zero at z = +1 => (1 - z^-1)
    poly = polyMul(poly, [1, -1]);
    zeros.push({ re: 1, im: 0 });
  }

  // User-controlled movable zero(s)
  if (onUnitCircle) {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    // Avoid degenerate collision with +/-1 if very close to 0 or pi
    if (Math.abs(s) < 0.05) {
      const sign = c >= 0 ? 1 : -1;
      poly = polyMul(poly, [1, -2 * sign, 1]);
      zeros.push({ re: sign, im: 0 }, { re: sign, im: 0 });
    } else {
      poly = polyMul(poly, [1, -2 * c, 1]);
      zeros.push({ re: c, im: s }, { re: c, im: -s });
    }
  } else {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    // Complex quadruplet: (1 - 2*r*cos(th)*z^-1 + r^2*z^-2) * (1 - 2*(1/r)*cos(th)*z^-1 + (1/r^2)*z^-2)
    // Scale by r^2 so coefficients stay symmetric and normalized
    const invR = 1 / effectiveR;
    const p1 = [1, -2 * effectiveR * c, effectiveR * effectiveR];
    const p2 = [1, -2 * invR * c, invR * invR];
    poly = polyMul(poly, polyMul(p1, p2));
    zeros.push(
      { re: effectiveR * c, im: effectiveR * s },
      { re: effectiveR * c, im: -effectiveR * s },
      { re: invR * c, im: invR * s },
      { re: invR * c, im: -invR * s }
    );
  }

  // Normalize max magnitude to 1 for clean plotting
  const maxAbs = Math.max(...poly.map((v) => Math.abs(v)), 1e-6);
  const h = poly.map((v) => Number((v / maxAbs).toFixed(4)));
  return { h, zeros };
}

/**
 * Generates preset filter coefficients for each of the 4 Types
 */
export function getPresetImpulse(type: FilterTypeNumber, role: 'LPF' | 'HPF' | 'BPF' | 'BSF' | 'Differentiator'): number[] {
  if (type === 1) {
    if (role === 'HPF') return [-0.08, 0.14, -0.24, 0.62, -0.24, 0.14, -0.08];
    if (role === 'BPF') return [-0.15, 0, 0.35, 0, -0.4, 0, 0.35, 0, -0.15].map((_, i) => {
      // Type I BPF: M=7 symmetric bandpass
      const vals = [-0.18, 0, 0.36, 0.64, 0.36, 0, -0.18];
      return vals[i] ?? 0;
    }).slice(0, 7);
    if (role === 'BSF') return [0.12, 0.18, -0.2, 0.72, -0.2, 0.18, 0.12];
    // LPF (M=7)
    return [0.05, 0.12, 0.24, 0.38, 0.24, 0.12, 0.05];
  }
  if (type === 2) {
    if (role === 'BPF') return [-0.14, -0.18, 0.38, 0.38, -0.18, -0.14];
    // LPF (M=6)
    return [-0.1, 0.2, 0.6, 0.6, 0.2, -0.1];
  }
  if (type === 3) {
    if (role === 'Differentiator') return [-0.1, 0.35, -0.75, 0, 0.75, -0.35, 0.1];
    // BPF (M=7)
    return [-0.18, -0.32, 0.45, 0, -0.45, 0.32, 0.18];
  }
  // Type IV
  if (role === 'Differentiator') return [-0.08, 0.22, -0.85, 0.85, -0.22, 0.08];
  // HPF (M=6)
  return [0.06, -0.18, 0.65, -0.65, 0.18, -0.06];
}

/**
 * Module 1 Simulation: Phase distortion & dispersion on multi-component waveforms
 */
export type WaveformKind = 'ecg' | 'qam_pulse' | 'audio_transient' | 'square_burst';

export interface DispersionSimulation {
  t: number[];
  input: number[];
  linearOutput: number[];
  dispersedOutput: number[];
  frequencies: number[];
  linearPhases: number[];
  dispersedPhases: number[];
  linearGroupDelay: number[];
  dispersedGroupDelay: number[];
}

export function simulatePhaseDistortion(
  kind: WaveformKind,
  alphaDelay: number,
  dispersionSeverity: number // 0 to 3.0
): DispersionSimulation {
  const N = 160;
  const t: number[] = [];
  const input: number[] = [];
  const linearOutput: number[] = [];
  const dispersedOutput: number[] = [];

  // Harmonic specification for each engineering waveform
  let harmonics: { k: number; amp: number; phase: number }[] = [];

  if (kind === 'ecg') {
    // Synthesized QRS-like + P/T wave pulse using localized harmonics
    harmonics = [
      { k: 1, amp: 0.18, phase: -0.2 },
      { k: 2, amp: 0.28, phase: 0.0 },
      { k: 3, amp: 0.36, phase: 0.0 },
      { k: 4, amp: 0.32, phase: 0.0 },
      { k: 5, amp: 0.24, phase: 0.0 },
      { k: 6, amp: 0.16, phase: 0.0 },
      { k: 7, amp: 0.1, phase: 0.0 },
    ];
  } else if (kind === 'qam_pulse') {
    // Raised-cosine like telecom symbol pulse centered in window
    harmonics = [
      { k: 1, amp: 0.35, phase: 0 },
      { k: 2, amp: 0.3, phase: 0 },
      { k: 3, amp: 0.22, phase: 0 },
      { k: 4, amp: 0.14, phase: 0 },
      { k: 5, amp: 0.07, phase: 0 },
    ];
  } else if (kind === 'audio_transient') {
    // Sharp percussive transient attack
    harmonics = [
      { k: 1, amp: 0.2, phase: 0 },
      { k: 2, amp: 0.22, phase: 0 },
      { k: 3, amp: 0.22, phase: 0 },
      { k: 4, amp: 0.2, phase: 0 },
      { k: 5, amp: 0.18, phase: 0 },
      { k: 6, amp: 0.15, phase: 0 },
      { k: 7, amp: 0.12, phase: 0 },
      { k: 8, amp: 0.09, phase: 0 },
    ];
  } else {
    // Square burst (odd harmonics)
    harmonics = [
      { k: 1, amp: 0.65, phase: 0 },
      { k: 3, amp: 0.22, phase: 0 },
      { k: 5, amp: 0.13, phase: 0 },
      { k: 7, amp: 0.09, phase: 0 },
    ];
  }

  const centerSample = 48;
  const omega0 = (2 * Math.PI) / N;

  const evaluateSignal = (samplePos: number, phaseOffsetFn: (omega: number) => number) => {
    let val = 0;
    for (const h of harmonics) {
      const w = h.k * omega0 * 2.2;
      const phi = phaseOffsetFn(w);
      if (kind === 'ecg') {
        // Modulate QRS sharpness + P/T wave baseline
        val += h.amp * Math.cos(w * (samplePos - centerSample) + h.phase + phi);
      } else {
        val += h.amp * Math.cos(w * (samplePos - centerSample) + h.phase + phi);
      }
    }
    if (kind === 'ecg') {
      // Add subtle P and T lobes via low-freq Gaussian envelope
      const pPos = samplePos - (centerSample - 18) - (phaseOffsetFn(0.08) ? -alphaDelay : 0);
      const tPos = samplePos - (centerSample + 22) - (phaseOffsetFn(0.08) ? -alphaDelay : 0);
      void pPos;
      void tPos;
    }
    return val;
  };

  // Non-linear all-pass phase: theta(w) = -alpha*w - d * sin(3*w) or quadratic dispersion -d * w^2
  // Here |H(e^jw)| = 1 for ALL frequencies, isolating pure phase distortion!
  for (let n = 0; n < N; n++) {
    t.push(n);
    const xVal = evaluateSignal(n, () => 0);
    const linVal = evaluateSignal(n - alphaDelay, () => 0);
    // Each harmonic experiences a frequency-dependent extra phase shift = -dispersionSeverity * (w / 0.6)^2
    const dispVal = evaluateSignal(n - alphaDelay, (w) => {
      const normW = w / 0.65;
      return -dispersionSeverity * 1.45 * normW * normW;
    });

    input.push(xVal);
    linearOutput.push(linVal);
    dispersedOutput.push(dispVal);
  }

  // Frequency curves for omega in [0, pi]
  const frequencies: number[] = [];
  const linearPhases: number[] = [];
  const dispersedPhases: number[] = [];
  const linearGroupDelay: number[] = [];
  const dispersedGroupDelay: number[] = [];

  const numFreq = 80;
  for (let i = 0; i <= numFreq; i++) {
    const w = (i / numFreq) * Math.PI;
    frequencies.push(w);
    linearPhases.push(-alphaDelay * w);
    const nonlinearTerm = -dispersionSeverity * 1.15 * w * w;
    dispersedPhases.push(-alphaDelay * w + nonlinearTerm);
    linearGroupDelay.push(alphaDelay);
    // tau_g(w) = -d(theta)/dw = alpha + 2 * 1.15 * dispersionSeverity * w
    dispersedGroupDelay.push(alphaDelay + 2.3 * dispersionSeverity * w);
  }

  return {
    t,
    input,
    linearOutput,
    dispersedOutput,
    frequencies,
    linearPhases,
    dispersedPhases,
    linearGroupDelay,
    dispersedGroupDelay,
  };
}
