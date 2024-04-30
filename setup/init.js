const { Pool } = require("pg");
const { createApiClient } = require("@neondatabase/api-client");
const { parse } = require("pg-connection-string");
const { readFileSync } = require("fs");
require('dotenv').config();

/**
 * Benchmark database
 */
const API_KEY = process.env["API_KEY"];
const PROJECT_REGION = process.env["PROJECT_REGION"] || "aws-us-east-2";
const PROJECT_NAME = process.env["PROJECT_NAME"] || "LatencyBenchmarks";
const DATABASE_NAME = process.env["DATABASE_NAME"] || "neondb";
const ROLE_NAME = process.env["ROLE_NAME"] || "BenchmarkRole";

/**
 * Waits until the latest project operation is finish.
 * @param {*} apiClient 
 * @param {*} projectId 
 */
const waitProjectOpFinished = async (apiClient, projectId) => {
    let finished = false;

    while (!finished) {
        const projectOpsStatus = (await apiClient.listProjectOperations({ projectId })).data.operations[0].status;
        finished = projectOpsStatus === "finished";

        // Sleep.
        await new Promise((res) => { setTimeout(res, 500) });
    }
}

/**
 * Initializes the project and its branches required for benchmarking. This function is responsible
 * for setting up any necessary infrastructure, configurations, or data needed to benchmark the project.
 * 
 * IMPORTANT: This function will fail if you already have a project in a free account.
 * Ensure you have no projects set up before initializing a new one.
 * Otherwise, upgrading to a paid account will resolve the issue. 
 * 
 * @param {Object} apiClient The API client used to interact with Neon.
 * @param {Object} branches Branches configuration to setup in Neon.
 * @returns {Promise<void>} A promise that resolves once the project and its branches are ready.
 */
const initProject = async (apiClient, branches) => {
    if (!API_KEY) {
        throw new Error("The API Key is missing. Make sure to declare it in your environment variables.");
    }
    console.log("Initializing a new benchmark project on: ", PROJECT_REGION);

    // Create the project
    const { data: createProjectData } = await apiClient.createProject({
        project: {
            name: PROJECT_NAME,
            region_id: PROJECT_REGION,
            branch: {
                role_name: ROLE_NAME,
                database_name: DATABASE_NAME
            },
            default_endpoint_settings: {
                autoscaling_limit_min_cu: 0.25,
                autoscaling_limit_max_cu: 0.25
            }
        }
    });
    const {
        connection_uris: mainConnectionUris,
        project
    } = createProjectData;
    const { id: projectId } = project;
    const { connection_uri: mainConnectionUri } = mainConnectionUris.pop();

    // Create the table to store the benchmarks.
    // Using the connect uri in the Pool fails, but using the parse fixes the issue.
    const config = parse(mainConnectionUri);
    const mainPool = new Pool(config);
    await mainPool.query("CREATE TABLE IF NOT EXISTS branches (id TEXT, name TEXT, description TEXT, setupQueries TEXT, benchmarkQuery TEXT, driver TEXT, pooled_connection BOOLEAN, minCU FLOAT);");
    await mainPool.query(`CREATE TABLE IF NOT EXISTS benchmark_runs (
        id CHAR(36) PRIMARY KEY,
        ts TIMESTAMP
      );
    `);
    await mainPool.query(`CREATE TABLE IF NOT EXISTS benchmarks (
        id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        branch_id TEXT,
        cold_start_connect_ms INT,
        hot_connect_ms INT[],
        hot_query_ms INT[],
        ts TIMESTAMP,
        driver TEXT,
        pooled_connection BOOLEAN,
        benchmark_run_id CHAR(36),
        CONSTRAINT fk_benchmark_runs FOREIGN KEY (benchmark_run_id)
            REFERENCES benchmark_runs (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
    );`
    );

    for (const branch of branches) {
        await waitProjectOpFinished(apiClient, projectId);

        const {
            name,
            description,
            setupQueries,
            benchmarkQuery,
            driver,
            pooled_connection,
            minCU
        } = branch;
        console.log("Creating branch: ", name, minCU);

        if (!name || !description || !setupQueries || !benchmarkQuery) {
            throw new Error("Configuration file has missing fields.");
        }

        // Create the project branch
        const { data: benchmarkBranchData } = await apiClient.createProjectBranch(projectId, {
            branch: {
                name: name.replace(/\s+/g, '_').toLowerCase(),
                role_name: ROLE_NAME,
                database_name: DATABASE_NAME,
            },
            endpoints: [{
                type: "read_write",
                autoscaling_limit_min_cu: minCU,
                autoscaling_limit_max_cu: minCU,
            }]
        });
        const {
            branch: benchmarkBranch,
            connection_uris: benchmarkConnectionUris
        } = benchmarkBranchData;
        const { connection_uri: benchmarkConnectionUri } = benchmarkConnectionUris.pop();

        const benchmarkConfig = parse(benchmarkConnectionUri);

        // Create the table storing a series of numbers.
        // 
        // The benchmark will measure how much does it take to query this table.
        const branchPool = new Pool(benchmarkConfig);
        const branchClient = await branchPool.connect()
        for (setupQuery of setupQueries) {
            try {
                await branchClient.query(setupQuery);
            } catch (err) {
                console.error(err);
            }
        }
        branchClient.end();
        branchPool.end();

        // Store the configuration in the main branch.
        const { id } = benchmarkBranch;
        await mainPool.query("INSERT INTO branches VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [id, name, description, setupQueries, benchmarkQuery, driver, pooled_connection, minCU]);
    }

    console.log("\n**IMPORTANT**");
    console.log("Add the following variable to your `.env` file:");
    console.log(`CONNECTION_STRING=${mainConnectionUri.trim()}`);

    mainPool.end();

    return project;
}


// Configuration
if (!API_KEY) {
    throw new Error("API key is missing.")
}
const apiClient = createApiClient({
    apiKey: API_KEY,
});

const config = readFileSync(__dirname + "/config.json", "utf-8");
const { branches } = JSON.parse(config);
if (!branches) {
    throw new Error("Configuration is missing.")
}

initProject(apiClient, branches);
