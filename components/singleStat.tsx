"use client";

import useBenchmarks, { BranchBenchmark } from "@/hooks";

interface Props {
  stat: "p50" | "p99";
}

const ConnectionsTable = (props: Props) => {
  const { loading, error, data: benchmark } = useBenchmarks();

  return <code>{!loading && !error && benchmark?.summary?.cold_start[props.stat]}ms</code>;
};

export default ConnectionsTable;
