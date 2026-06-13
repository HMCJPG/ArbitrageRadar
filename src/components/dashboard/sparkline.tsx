"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

import type { HistoricalDataPoint } from "@/types/trends";

interface SparklineProps {
  data: HistoricalDataPoint[];
  /** Stroke / fill color (any CSS color, typically an hsl(var(--...)) token). */
  color: string;
  height?: number;
}

/**
 * A minimal, axis-free area chart for the 7-day volume vector. Uses a unique
 * gradient id per instance (via `useId`) so multiple sparklines never collide.
 */
export function Sparkline({ data, color, height = 56 }: SparklineProps) {
  const gradientId = `spark-${useId().replace(/[:]/g, "")}`;
  const chartData = data.map((point, index) => ({
    index,
    volume: point.volume,
  }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 2, bottom: 0, left: 2 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Hidden axis just tightens the domain for a flattering shape. */}
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area
            type="monotone"
            dataKey="volume"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
