"use client";

import { useId } from "react";
import {
  formatMetric,
  monthLabels,
  type Metric,
} from "@/lib/stats/progress";

const W = 320;
const H = 150;
const PAD = { top: 12, right: 38, bottom: 22, left: 6 };

/** "Nice" rounded ceiling so the top gridline reads cleanly. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

export function ProgressChart({
  series,
  starts,
  metric,
  color = "var(--primary)",
}: {
  series: number[];
  starts: number[];
  metric: Metric;
  color?: string;
}) {
  const gradId = useId();
  const n = series.length;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(...series, 0));

  const x = (i: number) => PAD.left + (n <= 1 ? 0 : (i / (n - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH * (1 - v / max);

  const pts = series.map((v, i) => [x(i), y(v)] as const);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area =
    `M${pts[0][0]},${PAD.top + plotH} ` +
    pts.map((p) => `L${p[0]},${p[1]}`).join(" ") +
    ` L${pts[n - 1][0]},${PAD.top + plotH} Z`;

  const labels = monthLabels(starts);
  const last = pts[n - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Past 12 weeks progress"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* gridlines + right-side value labels */}
      {[1, 0.5, 0].map((frac) => {
        const gy = PAD.top + plotH * (1 - frac);
        return (
          <g key={frac}>
            <line
              x1={PAD.left}
              y1={gy}
              x2={W - PAD.right}
              y2={gy}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray={frac === 0 ? undefined : "3 4"}
            />
            <text
              x={W - PAD.right + 5}
              y={gy + 3}
              fontSize={9}
              fill="var(--muted)"
              className="font-display"
            >
              {formatMetric(max * frac, metric)}
            </text>
          </g>
        );
      })}

      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* end marker */}
      <circle cx={last[0]} cy={last[1]} r={4.5} fill={color} />
      <circle cx={last[0]} cy={last[1]} r={2} fill="#fff" />

      {/* month labels */}
      {labels.map((label, i) =>
        label ? (
          <text
            key={i}
            x={x(i)}
            y={H - 6}
            fontSize={9}
            fill="var(--muted)"
            textAnchor="middle"
            className="font-display"
          >
            {label}
          </text>
        ) : null,
      )}
    </svg>
  );
}
