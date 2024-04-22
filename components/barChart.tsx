import React, { useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { ChartData } from "chart.js";
import { Chart as ChartJS } from "chart.js";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfigRaw from "@/tailwind.config.ts";

const tailwindConfig = resolveConfig(tailwindConfigRaw);
let currentTheme = "light";
if (
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
) {
  currentTheme = "dark";
}
export const themeColors = tailwindConfig.daisyui.themes[0][currentTheme];

export interface ActiveSeries {
  cold_start: boolean;
  connect: boolean;
  query: boolean;
}

interface Props {
  title?: string;
  p50?: number;
  p99?: number;
  stdDev?: number;
  minimalistic?: boolean;
  chartData: ChartData<"bar">;
  activeSeries: ActiveSeries;
}

const Chart = (props: Props) => {
  const {
    title = "test",
    p50,
    p99,
    stdDev,
    chartData,
    minimalistic,
    activeSeries,
  } = props;
  const ref = useRef<ChartJS<"bar">>(null);

  useEffect(() => {
    if (activeSeries && ref?.current?.data) {
      //Find the matching dataset and set visibility
      ref.current?.data.datasets?.forEach((dataset) => {
        if (dataset.label === "Cold Start") {
          dataset.hidden = !activeSeries.cold_start;
        } else if (dataset.label === "Connect") {
          dataset.hidden = !activeSeries.connect;
        } else if (dataset.label === "Query") {
          dataset.hidden = !activeSeries.query;
        }
      });
    }
    if (ref.current?.options?.scales?.y) {
      ref.current.options.scales.y.suggestedMax = minimalistic
        ? (activeSeries.cold_start ? 500 : 0) +
          (activeSeries.connect ? 400 : 0) +
          (activeSeries.query ? 10 : 0)
        : undefined;
    }
    ref.current?.update();
  }, [activeSeries]);

  return (
    // Casting ref to avoid type issues over `ChartJSOrUndefined`.
    <Bar
      ref={ref as any}
      data={chartData}
      options={{
        maintainAspectRatio: false,
        responsive: true,
        indexAxis: 'y',
        plugins: {
          legend: {display: false},
        },
        scales: {
            x: {
              stacked: true,
            },
            y: {
              stacked: true
            }
          }
      }}
    />
  );
};

export default Chart;
