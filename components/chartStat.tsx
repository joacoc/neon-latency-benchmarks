import { BranchBenchmark } from "@/hooks";
import { ChartDataset } from "chart.js";
import React from "react";
import Chart, { ActiveSeries } from "@/components/chart";

interface Props {
    branchBenchmark: BranchBenchmark;
    datasets: Array<ChartDataset<"line">>;
    activeSeries: ActiveSeries;
}

const ChartStat = (props: Props) => {
    const { branchBenchmark, datasets, activeSeries } = props;
    const {
        description,
        name,
        cold_start,
        connect,
        query
    } = branchBenchmark;

    return (
        <div id={name} key={name} className='p-4 group'>
            <div className="flex justify-between">
              <div className="flex flex-col py-1">
                  <h4 className="text-xl font-bold">{
                      name
                  }</h4>
                  <p className="text-base-content/70">{description}</p>
              </div>
              <button className="btn btn-ghost btn-xs hidden">View SQL</button>
            </div>
            <div className='h-20 mt-4'>
                <Chart
                    p50={cold_start.p50}
                    chartData={{ datasets: datasets }}
                    minimalistic={true}
                    activeSeries={activeSeries}
                />
            </div>
            <div className="overflow-x-auto">
  <table className="table table-sm">
    <thead>
      <tr>
        <th></th>
        <th>P50</th>
        <th>P99</th>
        <th>StdDev</th>
      </tr>
    </thead>
    <tbody>
      <tr className={`transition-opacity ${!activeSeries.query ? 'opacity-50' : ''}`}>
        <td><span className={`inline-block w-1.5 h-1.5 mr-2 -translate-y-0.5 rounded ${activeSeries.query ? 'bg-accent' : 'bg-neutral'}`}></span>Query</td>
        <td>{query.p50}ms</td>
        <td>{query.p99}ms</td>
        <td>{query.stdDev}ms</td>
      </tr>
      <tr className={`transition-opacity ${!activeSeries.connect ? 'opacity-50' : ''}`}>
        <td><span className={`inline-block w-1.5 h-1.5 mr-2 -translate-y-0.5 rounded ${activeSeries.connect ? 'bg-primary' : 'bg-neutral'}`}></span>Connect</td>
        <td>{connect.p50}ms</td>
        <td>{connect.p99}ms</td>
        <td>{connect.stdDev}ms</td>
      </tr>
      <tr className={`transition-opacity ${!activeSeries.cold_start ? 'opacity-50' : ''}`}>
        <td><span className={`inline-block w-1.5 h-1.5 mr-2 -translate-y-0.5 rounded ${activeSeries.cold_start ? 'bg-secondary' : 'bg-neutral'}`}></span>Cold Start</td>
        <td>{cold_start.p50}ms</td>
        <td>{cold_start.p99}ms</td>
        <td>{cold_start.stdDev}ms</td>
      </tr>
      <tr>
        <th><span className="inline-block w-1.5 h-1.5 mr-2 rounded"></span>Total</th>
        <th>{(activeSeries.cold_start ? cold_start.p50 : 0) + (activeSeries.connect ? connect.p50 : 0) +  (activeSeries.query ? query.p50 : 0)}ms</th>
        <th>{(activeSeries.cold_start ? cold_start.p99 : 0) + (activeSeries.connect ? connect.p99 : 0) +  (activeSeries.query ? query.p99 : 0)}ms</th>
      </tr>
    </tbody>
  </table>
</div>
        </div>
    );
};

export default ChartStat;