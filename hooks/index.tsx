import { Point } from "chart.js";
import { useState, useEffect } from "react";

interface Response<T> {
  data: T;
}

interface BenchmarkData {
  p50: number;
  p99: number;
  stdDev: number;
  points: Array<Point>;
}

export interface BranchBenchmark {
  id: string;
  name: string;
  description: string;
  driver: "neon" | "pg";
  cold_start: BenchmarkData;
  connect: BenchmarkData;
  query: BenchmarkData;
}

export interface Benchmark {
  summary: BranchBenchmark;
  branches: Array<BranchBenchmark>;
}

export interface State<T> {
  loading: boolean;
  error?: string;
  data?: T;
}

// Define the custom hook
const useBenchmarks = () => {
  // Define state management inside the hook
  const [state, setState] = useState<State<Benchmark>>({
    loading: true,
    error: undefined,
    data: undefined,
  });

  useEffect(() => {
    const asyncOp = async () => {
      try {
        const res = await fetch(`/api`, {
          next: {
            revalidate: 900,
          },
        });
        const { data }: Response<Array<BranchBenchmark>> = await res.json();

        setState({
          loading: false,
          error: undefined,
          data: {
            summary: data.filter(
              (d) => d.name === "Select from 100MB Database"
            )[0],
            branches: data,
          },
        });
      } catch (err) {
        console.error(err);
        // Handle error
        setState({
          loading: false,
          error: typeof err === "string" ? err : JSON.stringify(err),
          data: undefined,
        });
      }
    };

    asyncOp();
  }, []);

  return state;
};

export default useBenchmarks;
