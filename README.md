[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjoacoc%2Fneon-latency-benchmarks&env=CONNECTION_STRING&envDescription=Connection%20string%20returned%20by%20the%20setup%20step)

This is a [Neon](http://neon.tech) tool to benchmark Neon latencies.

## Getting Started

1. Install the dependencies:
    ```bash
    npm install
    ```
2. Create an `.env` file using `.env.example` as template.
3. Setup the Neon project:
    ```bash
    npm run setup
    ```
4. Run a single benchmark:
    ```bash
    npm run benchmark
    ```
5. Run the app:
    ```bash
    npm run serve
    ```
6. Open [http://localhost:3000](http://localhost:3000) with your browser to view the results. 

## Setup

The setup command (`npm run setup`) will create a new Neon project with multiple branches configured in the `/setup/config.json` file. The project's _main_ branch will store the benchmark results, while the other branches will be used just for benchmarking.

## Benchmark

The benchmark is a Lambda function that suspends the compute resources of a branch and runs a benchmark query using `pg`, a [Node.JS Postgres client](https://github.com/brianc/node-postgres). The benchmark takes between two and three minutes. An example of a branch using the TimescaleDB extension would be as follows:

```json
{
    "name": "Timescale",
    "description": "Contains the TimescaleDB extension installed.",
    "setupQueries": [
        "CREATE EXTENSION \"timescaledb\";",
        "CREATE TABLE IF NOT EXISTS series (serie_num INT);",
        "INSERT INTO series VALUES (generate_series(0, 1000));",
        "CREATE INDEX IF NOT EXISTS series_idx ON series (serie_num);"
    ],
    "benchmarkQuery": "SELECT * FROM series WHERE serie_num = 10;"
}
```

After the benchmark, the results are stored in the _main_ branch in the following table:

```sql
CREATE TABLE IF NOT EXISTS benchmarks (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_id TEXT, -- Benchmark branch ID.
    cold_start_connect_ms INT, -- Timing for cold start + connection
    hot_connect_ms INT[],  -- Array of the timing of repeated hot connections
    hot_query_ms INT[],  -- Array of the timing of repeated hot query/responses
    ts TIMESTAMP,  -- when the benchmark started running
    driver TEXT, -- which driver was used, 'node-postgres (Client)' or '@neondatabase/serverless (Client)'
    pooled_connection BOOLEAN, -- whether or not the connection was via the pooled host or standard
    benchmark_run_id CHAR(36),
    CONSTRAINT fk_benchmark_runs FOREIGN KEY (benchmark_run_id)
        REFERENCES benchmark_runs (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
```

## Application

The web app will query the benchmarks stored in the _main_ branch, calculate basic metrics (p50, p99, stddev), and display them on a chart to give an overview of the query durations.

## Deployment

The following command will configure AWS to schedule a benchmark using ECS Fargate every 30 minutes:

```bash
# Make sure to have installed and configured the latest AWS CLI (https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
npm run deploy
```

This will generate enough datapoints throughout the day to calculate the average time for your own queries.

If would like to customize and deploy a different image follow these instructions:

<details>
<summary>Instructions</summary>

1. Fork the project.
2. Create a new branch.
3. Customize the benchmarks.
4. Replace the repository and branch name in the Dockerfile.
5. Build the Docker image:
    ```bash
    docker build --platform=linux/amd64 -t [your_username]/neon-latency-benchmarks:latest .
    ```
6. Push the Docker image:
    ```bash
    docker push [your_username]/neon-latency-benchmarks:latest
    ```
7. Run `npm run deploy`.

<br>
</details>

## Learn More

- [Neon Documentation](https://neon.tech/docs/introduction).
- [Cold starts](https://neon.tech/blog/cold-starts-just-got-hot).

Your feedback and contributions are welcome!