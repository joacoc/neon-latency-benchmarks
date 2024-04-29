import React, { useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import { ChartData } from "chart.js";
import { Chart as ChartJS, registerables } from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import "chartjs-adapter-date-fns";
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

const doubleZero = (num: number) => (num < 10 ? `0${num}` : num);

ChartJS.register(...registerables);
ChartJS.register(annotationPlugin);

interface Props {
  title?: string;
  p50?: number;
  p99?: number;
  stdDev?: number;
  minimalistic?: boolean;
  chartData: ChartData<"line">;
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
  const ref = useRef<ChartJS<"line">>(null);

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
    <Line
      ref={ref as any}
      data={chartData}
      options={{
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: { display: false },
          annotation: {
            annotations:
              1 === 1 //Disable annotations for now
                ? {}
                : {
                    p50: {
                      type: "line",
                      yMin: p50,
                      yMax: p50,
                      borderColor: themeColors["base-content"] + "AA",
                      borderWidth: 1,
                      borderDash: [3, 3],
                      label: {
                        content: `P50: ${p50 ? Math.round(p50) : "-"}ms`,
                        display: true,
                        position: "start",
                        backgroundColor: themeColors["base-100"],
                        color: themeColors["base-content"],
                        font: {
                          weight: "normal",
                          size: 11,
                        },
                      },
                    },
                    p99: {
                      type: "line",
                      yMin: p99,
                      yMax: p99,
                      borderColor: themeColors.error,
                      borderWidth: 1,
                      borderDash: [3, 3],
                      label: {
                        content: `P99: ${p99 ? Math.round(p99) : "-"}ms`,
                        display: true,
                        position: "start",
                        backgroundColor: themeColors["base-100"],
                        color: themeColors["base-content"],
                        font: {
                          weight: "normal",
                          size: 11,
                        },
                      },
                    },
                    stddev: {
                      type: "box",
                      yMin: p50 && stdDev ? p50 - stdDev : 0,
                      yMax: p50 && stdDev ? p50 + stdDev : 0,
                      borderColor: "#00000000",
                      backgroundColor: themeColors["base-content"] + "10",
                    },
                  },
          },
        },
        interaction: {
          mode: "nearest",
          intersect: false,
          axis: "x",
        },
        scales: {
          y: {
            stacked: true,
            beginAtZero: true,
            min: 0,
            suggestedMax: minimalistic
              ? (activeSeries.cold_start ? 500 : 0) +
                (activeSeries.connect ? 400 : 0) +
                (activeSeries.query ? 10 : 0)
              : undefined,
            grid: {
              display: false,
            },
            border: {
              color: themeColors["base-content"] + (minimalistic ? "33" : "66"),
            },
            ticks: {
              color: themeColors["base-content"] + "88",
              maxTicksLimit: 3,
              display: !minimalistic,
              callback: function (value, index, ticks) {
                if (typeof value === "number")
                  return `${Math.round(value / 100) / 10.0}s`;
              },
            },
          },
          x: {
            type: "timeseries",
            grid: {
              display: false,
            },
            border: {
              color: themeColors["base-content"] + (minimalistic ? "33" : "66"),
            },
            ticks: {
              maxTicksLimit: 5,
              display: !minimalistic,
              color: themeColors["base-content"] + "88",
              callback: function (value, index, ticks) {
                const d = new Date(value);
                return `${d.getMonth() + 1}/${d.getDate()} ${doubleZero(
                  d.getHours()
                )}:${doubleZero(d.getMinutes())}`;
              },
            },
          },
        },
      }}
    />
  );
};

export default Chart;
