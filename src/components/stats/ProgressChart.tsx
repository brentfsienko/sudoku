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
const HIT_R = 22; // touch hit area radius per data point

/** "Nice" rounded ceiling so the top gridline reads cleanly. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function chartAxis(
  dataMax: number,
  metric: Metric,
): { max: number; ticks: number[] } {
  if (metric === "time") {
    const max = niceMax(dataMax);
    return { max, ticks: [0, max / 2, max] };
  }
  let max: number;
  if (dataMax <= 0) max = 2;
  else if (dataMax <= 2) max = 2;
  else max = Math.max(3, niceMax(dataMax));
  const mid = Math.max(1, Math.round(max / 2));
  const ticks = [...new Set([0, mid, max])].sort((a, b) => a - b);
  return { max, ticks };
}

export function ProgressChart({
  series,
  starts,
  metric,
  color = "var(--primary)",
  selectedIndex = null,
  onSelect,
}: {
  series: number[];
  starts: number[];
  metric: Metric;
  color?: string;
  selectedIndex?: number | null;
  onSelect?: (index: number | null) => void;
}) {
  const gradId = useId();
  const n = series.length;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const dataMax = Math.max(...series, 0);
  const { max, ticks } = chartAxis(dataMax, metric);

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
      className="h-auto w-full cursor-pointer"
      role="img"
      aria-label="Past 12 weeks progress"
      onClick={(e) => {
        if (!onSelect) return;
        const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        const svgX = ((e.clientX - rect.left) / rect.width) * W;
        // Find closest data point
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i < n; i++) {
          const d = Math.abs(pts[i][0] - svgX);
          if (d < bestDist) { bestDist = d; best = i; }
        }
        onSelect(selectedIndex === best ? null : best);
      }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* gridlines + right-side value labels */}
      {ticks.map((tick) => {
        const gy = y(tick);
        return (
          <g key={tick}>
            <line
              x1={PAD.left}
              y1={gy}
              x2={W - PAD.right}
              y2={gy}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray={tick === 0 ? undefined : "3 4"}
            />
            <text
              x={W - PAD.right + 5}
              y={gy + 3}
              fontSize={9}
              fill="var(--muted)"
              className="font-display"
            >
              {formatMetric(tick, metric)}
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

      {/* Invisible wide hit-area strip across the chart */}
      {onSelect && pts.map(([px, py], i) => (
        <circle
          key={i}
          cx={px}
          cy={py}
          r={HIT_R}
          fill="transparent"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(selectedIndex === i ? null : i);
          }}
        />
      ))}

      {/* All data points — small dots; selected one is larger + inverted */}
      {pts.map(([px, py], i) => {
        const isSelected = selectedIndex === i;
        const isLast = i === n - 1 && selectedIndex == null;
        if (isSelected) {
          return (
            <g key={i}>
              <circle cx={px} cy={py} r={7} fill={color} />
              <circle cx={px} cy={py} r={3} fill="#fff" />
            </g>
          );
        }
        if (isLast) {
          return (
            <g key={i}>
              <circle cx={px} cy={py} r={4.5} fill={color} />
              <circle cx={px} cy={py} r={2} fill="#fff" />
            </g>
          );
        }
        return (
          <circle key={i} cx={px} cy={py} r={2.5} fill={color} opacity={0.5} />
        );
      })}

      {/* month labels */}
      {labels.map((label, i) =>
        label ? (
          <text
            key={i}
            x={x(i)}
            y={H - 6}
            fontSize={9}
            fill={selectedIndex === i ? color : "var(--muted)"}
            textAnchor="middle"
            className="font-display"
            fontWeight={selectedIndex === i ? 700 : 400}
          >
            {label}
          </text>
        ) : null,
      )}
    </svg>
  );
}
