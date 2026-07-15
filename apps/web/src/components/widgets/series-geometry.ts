import type { DashboardWidgetSeriesPoint } from "@/lib/widgets";

export type ChartPoint = {
  x: number;
  y: number;
  value: number;
  observed_on: string;
};

/** Map a series into view-box coordinates (y grows downward). */
export function seriesToChartPoints(
  series: DashboardWidgetSeriesPoint[],
  width: number,
  height: number,
  pad = 2,
): { points: ChartPoint[]; min: number; max: number } {
  if (series.length === 0) {
    return { points: [], min: 0, max: 1 };
  }

  const values = series.map((p) => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }

  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const n = series.length;

  const points = series.map((point, index) => {
    const x =
      n === 1 ? width / 2 : pad + (index / (n - 1)) * innerW;
    const t = (point.value - min) / (max - min);
    const y = pad + (1 - t) * innerH;
    return {
      x,
      y,
      value: point.value,
      observed_on: point.observed_on,
    };
  });

  return { points, min, max };
}

export function polylinePath(points: ChartPoint[]): string {
  if (points.length === 0) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
}
