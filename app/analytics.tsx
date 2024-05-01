"use client";
import { ChangeEventHandler, useCallback, useMemo, useState } from "react";
import Chart, { themeColors, ActiveSeries } from "@/components/chart";
import BarChart from "@/components/barChart";
import { ChartDataset, ScriptableContext } from "chart.js";
import Error from "@/components/error";
import useBenchmarks, { BranchBenchmark } from "@/hooks";
import ChartStat from "@/components/chartStat";

export enum Series {
  connect,
  query,
  cold_start,
}

export default function Analytics() {
  const { loading, error, data: benchmark } = useBenchmarks();
  const [activeSeries, setActiveSeries] = useState<ActiveSeries>({
    connect: true,
    query: true,
    cold_start: true,
  });

  const onChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      if (e.target.dataset.series && e.target.dataset.series in activeSeries) {
        setActiveSeries({
          ...activeSeries,
          [e.target.dataset.series]: e.target.checked,
        });
      }
    },
    [activeSeries]
  );

  const branchDatasets = useMemo<Array<Array<ChartDataset<"line">>>>(() => {
    if (benchmark) {
      const { branches } = benchmark;
      const datasets: Array<Array<ChartDataset<"line">>> = branches.map(
        (branch: BranchBenchmark) => {
          return [
            {
              data: branch.query.points,
              pointRadius: 0,
              borderWidth: 1,
              tension: 0.25,
              borderColor: themeColors.accent,
              label: "Query",
              hidden: !activeSeries.query,
              type: "line",
              fill: "start",
              backgroundColor: "#00000000",
            },
            {
              data: branch.connect.points,
              pointRadius: 0,
              borderWidth: 1,
              tension: 0.25,
              borderColor: themeColors.primary,
              label: "Connect",
              hidden: !activeSeries.connect,
              type: "line",
              fill: "start",
              backgroundColor: (context: ScriptableContext<"line">) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 60);
                gradient.addColorStop(0, themeColors.primary + "2a");
                gradient.addColorStop(1, themeColors.primary + "00");
                return gradient;
              },
            },
            {
              data: branch.cold_start.points,
              pointRadius: 0,
              borderWidth: 1,
              tension: 0.25,
              borderColor: themeColors.secondary,
              label: "Cold Start",
              hidden: !activeSeries.cold_start,
              type: "line",
              fill: "start",
              backgroundColor: (context: ScriptableContext<"line">) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 60);
                gradient.addColorStop(0, themeColors.secondary + "2a");
                gradient.addColorStop(1, themeColors.secondary + "00");
                return gradient;
              },
            },
          ];
        }
      );

      return datasets;
    }
    return [];
  }, [benchmark]);

  const summaryDataset = useMemo<Array<ChartDataset<"line">>>(() => {
    if (benchmark) {
      return [
        {
          data: benchmark ? benchmark.summary.query.points : [],
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.25,
          borderColor: themeColors.accent,
          label: "Query",
          hidden: !activeSeries.query,
          type: "line",
          fill: "start",
          backgroundColor: "#00000000",
        },
        {
          data: benchmark ? benchmark.summary.connect.points : [],
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.25,
          borderColor: themeColors.primary,
          label: "Connect",
          hidden: !activeSeries.connect,
          type: "line",
          fill: "start",
          backgroundColor: (context: ScriptableContext<"line">) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, themeColors.primary + "44");
            gradient.addColorStop(1, themeColors.primary + "00");
            return gradient;
          },
        },
        {
          data: benchmark ? benchmark.summary.cold_start.points : [],
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.25,
          borderColor: themeColors.secondary,
          label: "Cold Start",
          hidden: !activeSeries.cold_start,
          type: "line",
          fill: "start",
          backgroundColor: (context: ScriptableContext<"line">) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, themeColors.secondary + "44");
            gradient.addColorStop(1, themeColors.secondary + "00");
            return gradient;
          },
        },
      ];
    }
    return [];
  }, [benchmark]);

  const comparisonBenchmark = useMemo<Array<ChartDataset<"bar">>>(() => {
    if (benchmark) {
      return [
        {
          label: "Cold Start",
          data: benchmark.branches.map((branch) => branch.cold_start.p50),
          borderColor: themeColors.secondary,
          backgroundColor: themeColors.secondary,
        },
        {
          label: "Connect",
          data: benchmark.branches.map((branch) => branch.connect.p50),
          borderColor: themeColors.primary,
          backgroundColor: themeColors.primary,
        },
        {
          label: "Query",
          data: benchmark.branches.map((branch) => branch.query.p50),
          borderColor: themeColors.accent,
          backgroundColor: themeColors.accent,
        },
      ];
    }
    return [];
  }, [benchmark]);

  const { cold_start, connect, query } = useMemo(() => {
    return {
      cold_start: benchmark?.summary.cold_start || {
        p50: 0,
        p99: 0,
        stdDev: 0,
        points: [],
      },
      connect: benchmark?.summary.connect || {
        p50: 0,
        p99: 0,
        stdDev: 0,
        points: [],
      },
      query: benchmark?.summary.query || {
        p50: 0,
        p99: 0,
        stdDev: 0,
        points: [],
      },
    };
  }, [benchmark]);

  return (
    <section className="w-full flex flex-col gap-20">
      {loading && (
        <div className="flex items-center justify-center h-96">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}
      {error && (
        <div className="m-auto left-1/2 top-1/2 ">
          <Error message="Error processing your request." />
        </div>
      )}
      <div className={`${loading || error ? "invisible" : "visible"}`}>
        <div className="flex flex-col lg:flex-row gap-16 items-start justify-center">
          <table className="table table-lg w-auto">
            <tbody>
              <tr>
                <td></td>
                <td className="text-base-content/80">
                  <span
                    className="tooltip"
                    data-tip="50th percentile (median) latency value."
                  >
                    P50
                  </span>
                </td>
                <td className="text-base-content/60">
                  <span
                    className="tooltip"
                    data-tip="99th percentile latency value."
                  >
                    P99
                  </span>
                </td>
              </tr>
              <tr
                className={`transition-opacity ${
                  !activeSeries.query ? "opacity-50" : ""
                }`}
              >
                <td>
                  <label className="cursor-pointer flex gap-2 items-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="toggle toggle-xs toggle-accent"
                      data-series="query"
                      onChange={onChange}
                      checked={activeSeries.query}
                    />
                    <span>Query</span>
                  </label>
                </td>
                <td className="font-semibold">{query.p50}ms</td>
                <td className="text-base-content/60">{query.p99}ms</td>
              </tr>
              <tr
                className={`transition-opacity ${
                  !activeSeries.connect ? "opacity-50" : ""
                }`}
              >
                <td>
                  <label className="cursor-pointer flex gap-2 items-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="toggle toggle-xs toggle-primary"
                      data-series="connect"
                      onChange={onChange}
                      checked={activeSeries.connect}
                    />
                    <span>Connect</span>
                  </label>
                </td>
                <td className="font-semibold">{connect.p50}ms</td>
                <td className="text-base-content/60">{connect.p99}ms</td>
              </tr>
              <tr
                className={`transition-opacity ${
                  !activeSeries.cold_start ? "opacity-50" : ""
                }`}
              >
                <td>
                  <label className="cursor-pointer flex gap-2 items-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="toggle toggle-xs toggle-secondary"
                      data-series="cold_start"
                      onChange={onChange}
                      checked={activeSeries.cold_start}
                    />
                    <span>Cold Start</span>
                  </label>
                </td>
                <td className="font-semibold">{cold_start.p50}ms</td>
                <td className="text-base-content/60">{cold_start.p99}ms</td>
              </tr>
              <tr className="bg-base-200/20 dark:bg-neutral/60">
                <th className="whitespace-nowrap flex items-center gap-2 justify-start">
                  <span className="w-2 h-2 inline-block rounded"></span>
                  Total
                </th>
                <th>
                  {(activeSeries.cold_start ? cold_start.p50 : 0) +
                    (activeSeries.connect ? connect.p50 : 0) +
                    (activeSeries.query ? query.p50 : 0)}
                  ms
                </th>
                <th className="text-base-content/60">
                  {(activeSeries.cold_start ? cold_start.p99 : 0) +
                    (activeSeries.connect ? connect.p99 : 0) +
                    (activeSeries.query ? query.p99 : 0)}
                  ms
                </th>
              </tr>
            </tbody>
          </table>
          <div className="h-80 flex-1 w-full lg:w-auto">
            <Chart
              title="big"
              p50={cold_start.p50}
              p99={cold_start.p99}
              stdDev={cold_start.stdDev}
              chartData={{ datasets: summaryDataset }}
              activeSeries={activeSeries}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title">Connections</h3>
              <p className="text-base-content/70">
                Connecting to Postgres requires a TCP handshake and SSL
                negotiation. It takes{" "}
                <code className="text-neutral bg-neutral-content p-1 rounded">
                  ~{connect.p50}ms
                </code>{" "}
                in this benchmark. So connect + query on a warm instance takes{" "}
                <code className="text-neutral bg-neutral-content p-1 rounded">
                  ~{connect.p50 + query.p50}ms
                </code>
                .
                <br />
                <a href="#connections" className="link link-info">
                  ↓ Connection info
                </a>
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h3 className="card-title">Queries</h3>
              <p className="text-base-content/70">
                When a database is active and a connection is established, a
                SELECT query fetching a row by primary key takes{" "}
                <code className="text-neutral bg-neutral-content p-1 rounded">
                  ~{query.p50}ms
                </code>{" "}
                in this benchmark.
                <br />
                <a href="#queries" className="link link-info">
                  ↓ Query info
                </a>
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h3 className="card-title">Cold Starts</h3>
              <p className="text-base-content/70 text-base">
                Neon can autosuspend when idle and cold start when needed. In
                this benchmark, a cold start adds{" "}
                <code className="text-neutral bg-neutral-content p-1 rounded">
                  ~{cold_start.p50}ms
                </code>{" "}
                latency, resulting in the entire query taking{" "}
                <code className="text-neutral bg-neutral-content p-1 rounded">
                  ~{cold_start.p50 + connect.p50 + query.p50}ms
                </code>
                .
                <br />
                <a href="#cold-starts" className="link link-info">
                  ↓ Cold Start info
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-3xl font-bold">Latency by Database Variant</h3>
        <p className="text-base-content/70">
          How do latencies compare across different sizes and
          configurations of database?
        </p>
        <div className="h-64 my-12">
          <BarChart
            title="Comparison of Latencies by Database Variant"
            chartData={{
              labels: benchmark?.branches.map((br) => {
                return br.name;
              }),
              datasets: comparisonBenchmark,
            }}
            activeSeries={activeSeries}
          />
        </div>
      </div>

      <div>
        <h3 className="text-3xl font-bold">
          Detailed Stats by Database Variant
        </h3>
        <p className="text-base-content/70">
          Latencies for specific variations of Neon databases.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-10">
          {benchmark &&
            benchmark.branches.map((branchBenchmark, i) => (
              <ChartStat
                key={branchBenchmark.name}
                branchBenchmark={branchBenchmark}
                datasets={branchDatasets[i]}
                activeSeries={activeSeries}
              />
            ))}
        </div>
      </div>
    </section>
  );
}
