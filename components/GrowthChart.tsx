
import React from 'react';
import { TrendingUp } from 'lucide-react';

interface DataPoint {
  timestamp: number;
  value: number;
  label?: string;
  unit?: string;
}

interface GrowthChartProps {
  data: DataPoint[];
  title?: string;
  accentColor?: string; // CSS color
}

export const GrowthChart: React.FC<GrowthChartProps> = ({
  data,
  title = 'Growth History',
  accentColor = '#10b981' // emerald-500
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-6 text-slate-600 text-xs italic">
        No observations recorded yet.
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);
  const values = sorted.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // SVG dimensions
  const W = 280;
  const H = 80;
  const PAD_X = 8;
  const PAD_Y = 12;
  const plotW = W - PAD_X * 2;
  const plotH = H - PAD_Y * 2;

  const points = sorted.map((d, i) => {
    const x = PAD_X + (sorted.length === 1 ? plotW / 2 : (i / (sorted.length - 1)) * plotW);
    const y = PAD_Y + plotH - ((d.value - minVal) / range) * plotH;
    return { x, y, ...d };
  });

  // Simple Bezier smoothing (Midpoint based)
  let linePath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const midX = (p0.x + p1.x) / 2;
        linePath += ` Q ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} ${midX.toFixed(1)} ${(p0.y + p1.y) / 2}`;
    }
    const last = points[points.length - 1];
    linePath += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  }
  
  // Gradient fill area
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${H - PAD_Y} L ${points[0].x.toFixed(1)} ${H - PAD_Y} Z`
    : '';

  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  const delta = latest.value - first.value;
  const deltaPercent = first.value !== 0 ? ((delta / first.value) * 100).toFixed(0) : '∞';

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: accentColor }} />
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>{title}</h3>
        </div>
        {sorted.length > 1 && (
          <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${delta >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)} ({deltaPercent}%)
          </div>
        )}
      </div>

      {/* SVG Sparkline */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Fill area */}
        <path d={areaPath} fill="url(#chartGrad)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={accentColor} stroke="#0f172a" strokeWidth="1.5" />
        ))}
      </svg>

      {/* Legend */}
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{formatDate(sorted[0].timestamp)}</span>
        <span className="text-slate-300 font-bold">
          Latest: {latest.value}{latest.unit ? ` ${latest.unit}` : ''}
        </span>
        <span>{formatDate(sorted[sorted.length - 1].timestamp)}</span>
      </div>
    </div>
  );
};
