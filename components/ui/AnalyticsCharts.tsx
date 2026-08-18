"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ChartPoint } from "@/lib/data/analytics";

type AnalyticsBarChartProps = {
  title: string;
  description: string;
  data: ChartPoint[];
  valueLabel: string;
  color?: string;
};

export function AnalyticsBarChart({ title, description, data, valueLabel, color = "#136f43" }: AnalyticsBarChartProps) {
  if (!data.length) {
    return (
      <section className="analytics-chart-panel" aria-label={title}>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="chart-empty">No chartable data is available for this filter.</div>
      </section>
    );
  }

  return (
    <section className="analytics-chart-panel" aria-label={title}>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="analytics-chart" role="img" aria-label={`${title}. ${data.map((point) => `${point.label}: ${point.value}`).join(", ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 24, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" interval={0} angle={-18} textAnchor="end" height={56} tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => [value, valueLabel]} cursor={{ fill: "rgba(19, 111, 67, 0.08)" }} />
            <Bar dataKey="value" fill={color} radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
