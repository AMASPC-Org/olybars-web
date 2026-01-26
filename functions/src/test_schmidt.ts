import { schmidtChatLogic } from "./flows/schmidtChat";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from functions/.env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function runTest() {
  console.log("🚀 Starting Artie Brain Test...");
  console.log(
    "Checking API Key:",
    process.env.GOOGLE_GENAI_API_KEY ? "FOUND" : "MISSING",
  );

  const testCases = [
    { name: "Simple Chat", question: "Hi there!" },
    { name: "Tool Use (Venue Search)", question: "Tell me about Well 80." },
  ];

  for (const test of testCases) {
    console.log(`\n--- Test Case: ${test.name} ---`);
    console.log(`Input: "${test.question}"`);

    const start = Date.now();
    try {
      console.log("📡 Sending query to Schmidt...");
      // Mock history as empty for independent tests
      const output = await schmidtChatLogic({
        question: test.question,
        history: [],
      });
      const duration = Date.now() - start;

      console.log("\n🤖 Schmidt says:");
      console.log(output);
      console.log(`\n⏱️ Duration: ${duration}ms`);
    } catch (error: any) {
      console.error("❌ Schmidt Brain Failure:", error.message);
    }
  }
}

runTest();
