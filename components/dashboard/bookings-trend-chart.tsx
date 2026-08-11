"use client";

import { useState } from "react";

type DayPoint = { date: string; count: number };

const WIDTH = 640;
const HEIGHT = 200;
const PAD_LEFT = 32;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

function niceMax(value: number): number {
  if (value <= 4) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function BookingsTrendChart({ data }: { data: DayPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const max = niceMax(Math.max(...data.map((d) => d.count), 1));
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  const xFor = (i: number) => PAD_LEFT + i * stepX;
  const yFor = (count: number) => PAD_TOP + plotHeight - (count / max) * plotHeight;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(d.count)}`).join(" ");
  const areaPath = `${linePath} L ${xFor(data.length - 1)} ${PAD_TOP + plotHeight} L ${xFor(0)} ${PAD_TOP + plotHeight} Z`;

  const gridLines = [0, 0.5, 1].map((f) => PAD_TOP + plotHeight * (1 - f));
  const last = data[data.length - 1];
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  function handleMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const scale = WIDTH / rect.width;
    const svgX = relativeX * scale;
    const index = Math.round((svgX - PAD_LEFT) / (stepX || 1));
    setHoverIndex(Math.min(Math.max(index, 0), data.length - 1));
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label={`Bookings per day, last ${data.length} days`}>
        <defs>
          <linearGradient id="bookings-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-terracotta)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--color-terracotta)" stopOpacity={0} />
          </linearGradient>
        </defs>
        {gridLines.map((y, i) => (
          <line key={i} x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} stroke="#ede4d6" strokeWidth={1} />
        ))}

        <path d={areaPath} fill="url(#bookings-trend-fill)" />
        <path d={linePath} fill="none" stroke="var(--color-terracotta-700)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {data.map((d, i) => {
          const showLabel =
            i === hoverIndex || i === 0 || i === data.length - 1 || i % labelEvery === 0;
          return (
            <text key={i} x={xFor(i)} y={HEIGHT - 8} fontSize={10} textAnchor="middle" fill="#898781">
              {showLabel ? formatDayLabel(d.date) : ""}
            </text>
          );
        })}

        {last && (
          <>
            <circle cx={xFor(data.length - 1)} cy={yFor(last.count)} r={4} fill="var(--color-terracotta-700)" stroke="var(--color-cream)" strokeWidth={2} />
            <text x={xFor(data.length - 1) - 6} y={yFor(last.count) - 10} fontSize={11} textAnchor="end" fontWeight={600} fill="var(--color-espresso)">
              {last.count}
            </text>
          </>
        )}

        {hoverIndex !== null && (
          <line
            x1={xFor(hoverIndex)}
            x2={xFor(hoverIndex)}
            y1={PAD_TOP}
            y2={PAD_TOP + plotHeight}
            stroke="#c3c2b7"
            strokeWidth={1}
          />
        )}
        {hoverIndex !== null && data[hoverIndex] && (
          <circle
            cx={xFor(hoverIndex)}
            cy={yFor(data[hoverIndex].count)}
            r={5}
            fill="var(--color-terracotta-700)"
            stroke="var(--color-cream)"
            strokeWidth={2}
          />
        )}

        <rect
          x={PAD_LEFT}
          y={PAD_TOP}
          width={plotWidth}
          height={plotHeight}
          fill="transparent"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        />
      </svg>
      {hovered && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-terracotta/15 bg-white px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: `${(xFor(hoverIndex!) / WIDTH) * 100}%`,
            top: `${(yFor(hovered.count) / HEIGHT) * 100 - 4}%`,
          }}
        >
          <p className="font-semibold text-espresso">{hovered.count} bookings</p>
          <p className="text-espresso/50">{formatDayLabel(hovered.date)}</p>
        </div>
      )}
    </div>
  );
}
