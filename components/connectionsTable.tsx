"use client";

import useBenchmarks, { BranchBenchmark } from "@/hooks";

interface Props {
  version: "IDE" | "COST";
}

const ConnectionsTable = (props: Props) => {
  const { loading, error, data: benchmark } = useBenchmarks();

  const serverless = benchmark?.branches.find((b) => b.driver === "neon");
  const standard = benchmark?.summary;

  return loading ? (
    <table className="h-36"></table>
  ) : (
    <>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Connect P50</th>
            <th>Connect P99</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Standard (<code>pg</code>)
            </td>
            <td className="text-center">{standard?.connect.p50}</td>
            <td className="text-center">{standard?.connect.p99}</td>
          </tr>
          <tr>
            <td>
              Serverless (<code>neon</code>)
            </td>
            <td className="text-center">{serverless?.connect.p50}</td>
            <td className="text-center">{serverless?.connect.p99}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>
              Difference (<code>pg</code>-<code>neon</code>)
            </td>
            <td className="text-center">
              {standard &&
                serverless &&
                standard?.connect.p50 - serverless?.connect.p50}
            </td>
            <td className="text-center">
              {standard &&
                serverless &&
                standard?.connect.p99 - serverless?.connect.p99}
            </td>
          </tr>
        </tfoot>
      </table>
      {standard &&
        serverless &&
        standard?.connect.p50 - serverless?.connect.p50 > 0 && (
          <p>
            In this benchmark, the serverless driver is{" "}
            <code>{standard?.connect.p50 - serverless?.connect.p50}ms</code>{" "}
            faster to establish a connection.
          </p>
        )}
    </>
  );
};

export default ConnectionsTable;
