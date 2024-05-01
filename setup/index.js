const { Client: PgClient } = require("pg");
const { Client: NeonClient, neonConfig } = require("@neondatabase/serverless");
const ws = require("ws");
const { createApiClient } = require("@neondatabase/api-client");
const { readFileSync } = require("fs");
const { randomUUID } = require("crypto");
const { default: PQueue } = require("p-queue");

const DRIVERS = {
  pg: PgClient,
  neon: NeonClient,
};

neonConfig.webSocketConstructor = ws;

require("dotenv").config();
const configFile = JSON.parse(
  readFileSync(__dirname + "/config.json", "utf-8")
);

/**
 * Benchmark database
 */
const API_KEY = process.env["API_KEY"];
const PROJECT_NAME = process.env["PROJECT_NAME"] || "LatencyBenchmarks";
const DATABASE_NAME = process.env["DATABASE_NAME"] || "neondb";
const ROLE_NAME = process.env["ROLE_NAME"] || "BenchmarkRole";
const MAIN_BRANCH_NAME = process.env["BENCHMARK_BRANCH_NAME"] || "main";

/**
 * Fetches all items from a paginated request from Neon.
 * @param {Function} apiFunction - The API client function to call. It should accept an object as its only argument.
 * @param {Object} initialParams - Initial parameters to pass to the API function.
 * @param {Function} itemKey - Key for items from the API response.
 * @returns {Promise<void>}
 */
const fetchAllItems = async (apiFunction, baseParams, itemKey) => {
  const baseItems = [];
  let params = { ...baseParams };
  let continueFetching = true;

  while (continueFetching) {
    try {
      const response = await apiFunction(params);
      const items = response.data[itemKey];
      const cursor =
        (response.pagination && response.pagination.cursor) ||
        (response.data.pagination && response.data.pagination.cursor);

      if (items.length > 0) {
        baseItems.push(...items);
      } else {
        continueFetching = false;
      }

      if (cursor && Array.isArray(items) && items.length > 0) {
        params = { ...params, cursor };
      } else {
        continueFetching = false;
      }
    } catch (err) {
      log(err);
    }
  }

  return baseItems;
};

/**
 * Returns all available projects in the account.
 */
const fetchProjects = async (apiClient) => {
  return await fetchAllItems(apiClient.listProjects, {}, "projects");
};

/**
 * Returns shared projects in the account.
 */
const fetchSharedProjects = async () => {
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${API_KEY}`);
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");

  const response = await fetch(
    "https://console.neon.tech/api/v2/projects/shared",
    {
      headers,
    }
  );
  const { projects } = await response.json();

  return projects;
};

/**
 * Searches the configured project.
 * @param {*} apiClient
 * @returns project.
 */
const getProject = async (apiClient) => {
  const projects = await fetchProjects(apiClient);
  let project = projects.find((x) => x.name === PROJECT_NAME);

  if (!project) {
    let projects = await fetchSharedProjects();
    project = projects.find((x) => x.name === PROJECT_NAME);

    if (!project) {
      throw new Error("Benchmark project not found.");
    }
  }

  return project;
};

/**
 * Retrieves the configuration necessary to run benchmarks, including endpoints and role passwords for both the main and benchmark branches.
 *
 * @param {Object} apiClient The API client used to communicate with the backend.
 * @param {string} projectId The unique identifier for the project.
 * @returns {Promise<Object>} A promise that resolves to an object containing each branch configuration.
 */
const getConfig = async (apiClient, projectId) => {
  log("Reading benchmark config.");
  const configMap = {};
  configFile.branches.forEach((branch) => {
    configMap[branch.name.replace(/\s+/g, "_").toLowerCase()] = branch;
  });

  // Get branches IDs.
  log("Retrieving branches data.");
  const { data: listBranchesData } = await apiClient.listProjectBranches(
    projectId
  );
  const { branches } = listBranchesData;
  // console.log("Branches: ", branches);
  const branchesConfig = {};

  for ({ id: branchId, name: branchName } of branches) {
    const { data: rolePasswordData } =
      await apiClient.getProjectBranchRolePassword(
        projectId,
        branchId,
        ROLE_NAME
      );
    const { password } = rolePasswordData;

    const { data: endpointData } = await apiClient.listProjectBranchEndpoints(
      projectId,
      branchId
    );
    const { endpoints: branchEndpoints } = endpointData;
    const endpoint = branchEndpoints[0];

    if (branchName !== MAIN_BRANCH_NAME) {
      branchesConfig[branchName] = {
        password,
        endpoint,
        id: branchId,
        ...configMap[branchName],
      };
    } else {
      branchesConfig[branchName] = {
        password,
        endpoint,
        benchmarkQuery: "",
        id: branchId,
      };
    }
  }

  return branchesConfig;
};

/**
 * Waits until an endpoint is idle.
 */
const waitEndpointIdle = async (apiClient, projectId, endpointId) => {
  let idle = false;
  while (!idle) {
    const endpoint = await apiClient.getProjectEndpoint(projectId, endpointId);
    idle = endpoint.data.endpoint.current_state === "idle";

    await sleep(500);
  }
};

/**
 * Waits until the latest project operation is finish.
 * @param {*} apiClient
 * @param {*} projectId
 */
const waitProjectOpFinished = async (apiClient, projectId) => {
  let finished = false;

  while (!finished) {
    const projectOpsStatus = (
      await apiClient.listProjectOperations({ projectId })
    ).data.operations[0].status;
    finished = projectOpsStatus === "finished";

    // Sleep.
    await new Promise((res) => {
      setTimeout(res, 500);
    });
  }
};

/**
 * Suspends a specific project endpoint. This function is used to temporarily deactivate
 * the benchmark endpoint. Suspending an endpoint can raise errors if other operations are happening
 * at the same time. To ensure the endpoint is idle, the function will retry until successful.
 *
 * @param {Object} apiClient The API client used to interact with Neon.
 * @param {string} projectId The ID of the project for which the endpoint will be suspended.
 * @param {string} endpointId The ID of the endpoint to be suspended within the specified project.
 * @param {number} sleepTimeMs The time to sleep after suspending the endpoint (default: 60000ms).
 * @returns {Promise<void>} A promise that resolves once the endpoint has been successfully suspended.
 */
const suspendProjectEndpoint = async (
  apiClient,
  projectId,
  endpointId,
  sleepTimeMs = 60000
) => {
  log(`Suspend endpoint with ID ${endpointId}`);
  let suspended = false;
  while (!suspended) {
    try {
      await apiClient.suspendProjectEndpoint(projectId, endpointId);
      suspended = true;
      log(`Endpoint suspended: ${endpointId}`);
    } catch (err) {
      log(`Error suspending endpoint ${endpointId}. Trying again in 10000ms.`);
      log(`Error: ${err}`);
      await sleep(10000);
    }
  }

  // Sleep for the given time to ensure the endpoint is idle and avoid a
  // prolonged cold start when the endpoint is queried again
  log(
    `Sleeping for ${
      sleepTimeMs / 1000
    } seconds to give the endpoint ${endpointId} time to idle.`
  );
  await sleep(sleepTimeMs);
};

/**
 * Creates a unique benchmark run record in the database to identify the current benchmark run.
 * @param {Object} apiClient The API client used to interact with Neon.
 * @param {string} projectId The ID of the project for which the endpoint will be suspended.
 * @param {String} runId An identifier for the current benchmark run.
 */
async function createBenchmarkRun(apiClient, projectId, runId) {
  const config = await getConfig(apiClient, projectId);

  const mainConfig = config[MAIN_BRANCH_NAME];

  const client = new PgClient({
    host: mainConfig.endpoint.host,
    password: mainConfig.password,
    user: ROLE_NAME,
    database: DATABASE_NAME,
    ssl: true,
  });

  await client.connect();

  log(`Creating benchmark run record in the database with ID ${runId}.`);

  await client.query(`INSERT INTO benchmark_runs (id, ts) VALUES ($1, $2);`, [
    runId,
    new Date(),
  ]);
  await client.end();
}

/**
 * Benchmarks the project. This process involves temporarily suspending
 * the project's endpoint and then running a benchmark query to assess performance.
 * The project's endpoint is suspended again after the benchmarking is completed.
 *
 * @param {Object} project An object containing the project's details.
 * @param {Object} apiClient The API client used to communicate with the backend services.
 * @param {String} runId An identifier for the current benchmark run.
 * @returns {Promise<void>} A promise that resolves when the benchmarking process is complete,
 * indicating that no value is returned but the side effects (benchmarking the project) have been completed.
 */
const benchmarkProject = async ({ id: projectId }, apiClient, runId) => {
  const benchQueue = new PQueue({ concurrency: 1 });
  log(`Starting benchmark for project ${projectId}`);

  // Get the project/branch configuration and details
  const config = await getConfig(apiClient, projectId);

  await waitProjectOpFinished(apiClient, projectId);
  const mainConfig = config[MAIN_BRANCH_NAME];
  const mainClient = new PgClient({
    host: mainConfig.endpoint.host,
    password: mainConfig.password,
    user: ROLE_NAME,
    database: DATABASE_NAME,
    ssl: true,
  });

  mainClient.on("error", (err) => {
    log("Main client error:");
    log(err);
  });

  await mainClient.connect();

  Object.keys(config).forEach(async (branchName) => {
    benchQueue.add(async () => {
      if (branchName === "main") {
        // Skip the main branch.
        return;
      }

      const {
        id: branchId,
        endpoint: benchmarkEndpoint,
        password: benchmarkRolePassword,
        benchmarkQuery,
        driver,
        pooled_connection,
      } = config[branchName];

      // Ensure the endpoint is idle (suspended.)
      if (benchmarkEndpoint.current_state !== "idle") {
        await suspendProjectEndpoint(
          apiClient,
          projectId,
          benchmarkEndpoint.id
        );
        await waitEndpointIdle(apiClient, projectId, benchmarkEndpoint.id);
      }

      log(
        `Benchmarking branch ${branchName} with endpoint ${benchmarkEndpoint.host}, driver ${driver}, pooled=${pooled_connection}.`
      );

      const connection_details = {
        host: pooled_connection
          ? benchmarkEndpoint.host.replace(".", "-pooler.")
          : benchmarkEndpoint.host,
        password: benchmarkRolePassword,
        user: ROLE_NAME,
        database: DATABASE_NAME,
        ssl: true,
      };

      //Instantiate the client driver (either pg or neon)
      const benchClient = new DRIVERS[driver](connection_details);

      // Cold Start + Connect (where the database starts out suspended)
      const coldTimeStart = Date.now(); // <-- Start timer
      await benchClient.connect(); // <-- Connect
      let coldConnectMs = Date.now() - coldTimeStart; // <-- Stop timer
      await benchClient.query(benchmarkQuery);
      // Need to connect and query to get an accurate reading from the Neon driver
      if(driver === 'neon') coldConnectMs = Date.now() - coldTimeStart;
      await sleep(500);

      // Hot Queries (where the connection is already active)
      const hotQueryTimes = [];
      for (let i = 0; i < 10; i++) {
        const start = Date.now(); // <-- Start timer
        await benchClient.query(benchmarkQuery); // <-- Query
        hotQueryTimes.push(Date.now() - start); // <-- Stop timer
        await sleep(500);
      }
      await benchClient.end();

      //Subtract the average query time from the Neon driver since we had to include the query
      if(driver === 'neon') coldConnectMs -= hotQueryTimes.reduce((a, b) => a + b, 0) / hotQueryTimes.length;

      // Hot Connects (where the database is active, but a connection must first be established)
      // There are better ways, not yet tested, to measure these values as for example 
      const hotConnectTimes = [];
      for (let i = 0; i < 10; i++) {
        const benchClient = new DRIVERS[driver](connection_details);
        const start = Date.now(); // <-- Start timer
        await benchClient.connect(); // <-- Connect
        hotConnectTimes.push(Date.now() - start); // <-- Stop timer
        await benchClient.query(benchmarkQuery); // <-- Query
        await benchClient.end();
        await sleep(500);
      }

      console.log(
        `Benchmark complete. Details ${branchName} / ${
          benchmarkEndpoint.id
        }. Cold Connect: ${coldConnectMs} / Hot Connect ${hotConnectTimes.join(
          ","
        )} / Hot Queries ${hotQueryTimes.join(",")}`
      );

      await mainClient.query(
        "INSERT INTO benchmarks (branch_id, cold_start_connect_ms, hot_connect_ms, hot_query_ms, ts, driver, pooled_connection, benchmark_run_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [
          branchId,
          parseInt(coldConnectMs, 10),
          hotConnectTimes,
          hotQueryTimes,
          new Date(),
          driver,
          pooled_connection,
          runId,
        ]
      );

      await suspendProjectEndpoint(
        apiClient,
        projectId,
        benchmarkEndpoint.id,
        10000
      );
    });
  });

  await benchQueue.onIdle();

  await mainClient.end();
};

function log(str) {
  console.log(`${new Date().toJSON()}: ${str}`);
}

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

exports.handler = async () => {
  if (!API_KEY) {
    throw new Error("API KEY is missing.");
  }

  const apiClient = createApiClient({
    apiKey: API_KEY,
  });

  const project = await getProject(apiClient);
  const runId = randomUUID();

  await createBenchmarkRun(apiClient, project.id, runId);

  log(`Starting benchmarking (ID: ${runId})`);
  await benchmarkProject(project, apiClient, runId);
};
