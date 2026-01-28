import { CloudTasksClient } from "@google-cloud/tasks";
import { config } from "../appConfig/config.js";

const client = new CloudTasksClient();

const PROJECT_ID = config.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = "us-west1";
const QUEUE = "brew-house-worker";
const SERVICE_URL = process.env.SERVICE_URL || `https://olybars-backend-xy7654321.us-west1.run.app`; // Needs to be dynamic or env var

export async function enqueueScraperRun(runId: string, delaySeconds = 0) {
  if (!PROJECT_ID) throw new Error("Missing Project ID");

  const parent = client.queuePath(PROJECT_ID, LOCATION, QUEUE);

  // Construct the Clean URL
  // In Cloud Run, we can use the internal URL or public URL with OIDC
  // Let's assume we use the public URL with OIDC token for security
  // We need to know the Service URL. 
  // For now, I will use a placeholder from ENV or Config.
  const url = `${config.BACKEND_URL || "http://localhost:8080"}/internal/tasks/run`;

  const task = {
    httpRequest: {
      httpMethod: "POST" as const,
      url,
      oidcToken: {
        serviceAccountEmail: process.env.SERVICE_ACCOUNT_EMAIL, // The identity of the invoker (Invoker SA)
      },
      headers: {
        "Content-Type": "application/json",
      },
      body: Buffer.from(JSON.stringify({ runId })).toString("base64"),
    },
    scheduleTime: delaySeconds > 0
      ? { seconds: Math.floor(Date.now() / 1000) + delaySeconds }
      : undefined
  };

  try {
    const [response] = await client.createTask({ parent, task });
    console.log(`Created task ${response.name}`);
    return response.name;
  } catch (error) {
    console.error("Failed to enqueue task", error);
    throw error;
  }
}
