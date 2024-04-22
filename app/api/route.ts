import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { quantile, standardDeviation } from "simple-statistics";
import { Point } from 'chart.js';

const CONNECTION_STRING = process.env["CONNECTION_STRING"];

/**
 * The timeseries is binned to organize the data.
 * @param minDate
 * @param stride
 * @returns
 */
function branchRowsSql(minDate: Date, stride: string) {
  return `
        SELECT
            b.branch_id,
            date_bin('${stride}'::interval, br.ts, '2024-03-01'::timestamp) as ts,
            -- Cold start measurements include the connect time, subtract it to get pure cold start time
            (AVG(cold_start_connect_ms) - AVG(unnest_hot_connect_ms))::int AS cold_start,
            AVG(unnest_hot_connect_ms)::int AS connect,
            AVG(unnest_hot_query_ms)::int AS query
        FROM
            benchmark_runs br
        JOIN
            benchmarks b ON br.id = b.benchmark_run_id,
            unnest(b.hot_connect_ms) AS unnest_hot_connect_ms,
            unnest(b.hot_query_ms) AS unnest_hot_query_ms
        WHERE
            br.ts > '${minDate.toISOString()}'::timestamp
        GROUP BY
            1, 2
        ORDER BY
            1, 2;
    `;
}

/**
 * Return all the projects, their operations, and the related endpoint (using the connection string in the env var.)
 * @returns
 */
export async function GET() {
  if (!CONNECTION_STRING) {
    return NextResponse.json(
      { error: "Database url is missing." },
      { status: 500 }
    );
  }

  const sql = neon(CONNECTION_STRING);

  const minDate = new Date();
  let stride = "30 minutes";
  minDate.setDate(minDate.getDate() - 7);

  const branches = await sql(`SELECT * FROM branches;`);
  const rows = await sql(branchRowsSql(minDate, stride));
  const timings = ["cold_start", "connect", "query"];
  
  //Initiailize DataSets
  const dataSets = Object.fromEntries(
    branches.map((b) => [
      b.id,
      {...b, ...Object.fromEntries(
        timings.map((t) => [t, { points: [], p50: 0, p99: 0, stdDev: 0 }])
      )},
    ])
  );

  //Populate DataSets
  rows.forEach((row) => {
    dataSets[row.branch_id].cold_start.points.push({x: row.ts, y: row.cold_start});
    dataSets[row.branch_id].connect.points.push({x: row.ts, y: row.connect});
    dataSets[row.branch_id].query.points.push({x: row.ts, y: row.query});
  });

  //Calculate Stats
  Object.keys(dataSets).forEach((key) => {
    timings.forEach((t) => {
      const dataSet = dataSets[key][t];
      const values = dataSet.points.map((p: Point) => p.y);
      if(values.length > 1) {
        dataSet.p50 = Math.round(quantile(values, 0.5));
        dataSet.p99 = Math.round(quantile(values, 0.99));
        dataSet.stdDev = Math.round(standardDeviation(values));
      }
    });
  });

  return NextResponse.json(
    {
      data: Object.values(dataSets),
    }
  );
}
