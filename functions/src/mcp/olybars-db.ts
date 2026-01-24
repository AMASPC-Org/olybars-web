import { ai } from "../genkit";
import { z } from "zod";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import kb from "../knowledgeBase.json";

// Ensure Firebase is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

/**
 * LORE CONTEXT TOOL
 * Implementation of /getLoreContext
 * Searches docs/knowledge (via KnowledgeBase.json sync) and Firestore knowledge collection.
 */
export const getLoreContext = ai.defineTool(
  {
    name: "getLoreContext",
    description:
      "Retrieve technical and domain lore from the OlyBars Knowledge Base (The Holy Trinity).",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "The aspect of OlyBars lore to retrieve (e.g., 'points logic', 'WSLCB rules', 'Artie persona')",
        ),
    }),
  },
  async (input) => {
    const q = input.query.toLowerCase();
    const queryWords = q.split(/\s+/).filter((w) => w.length > 2);

    // 1. Static Knowledge Search (from KnowledgeBase.json)
    const timeline = Object.entries(kb.history_timeline).map(([k, v]) => ({
      section: "History",
      topic: k,
      content: v,
    }));
    const market = Object.entries(kb.market_context).map(([k, v]) => ({
      section: "Market Context",
      topic: k,
      content: v,
    }));
    const directiveList = (kb.directives || []).map((d: string, i: number) => ({
      section: "Directives",
      topic: `Directive ${i + 1}`,
      content: d,
    }));

    const allStatic = [
      ...kb.faq.map((f) => ({
        section: "FAQ",
        topic: f.question,
        content: f.answer,
      })),
      ...timeline,
      ...market,
      ...directiveList,
    ];

    const staticResults = allStatic.filter((item) => {
      const text =
        `${item.section} ${item.topic} ${item.content}`.toLowerCase();
      return text.includes(q) || queryWords.some((w) => text.includes(w));
    });

    // 2. Dynamic Knowledge Search (from Firestore)
    const snapshot = await db.collection("knowledge").get();
    const dynamicResults = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          section: "Dynamic Lore",
          topic: data.question || data.topic,
          content: data.answer || data.content,
        };
      })
      .filter((item) => {
        const text = `${item.topic} ${item.content}`.toLowerCase();
        return text.includes(q) || queryWords.some((w) => text.includes(w));
      });

    return [...staticResults, ...dynamicResults].slice(0, 8);
  },
);

/**
 * VENUE COMPLIANCE TOOL
 * Validates a venue against the "Artesian Schema" for production readiness.
 */
export const auditVenueCompliance = ai.defineTool(
  {
    name: "auditVenueCompliance",
    description:
      "Audits a specific venue for data integrity and platform compliance.",
    inputSchema: z.object({
      venueId: z
        .string()
        .describe("The Firestore document ID of the venue to audit."),
    }),
  },
  async (input) => {
    const doc = await db.collection("venues").doc(input.venueId).get();
    if (!doc.exists)
      return { status: "ERROR", message: `Venue ${input.venueId} not found.` };

    const data = doc.data() || {};
    const issues: string[] = [];

    // 1. Geometry check
    if (!data.coordinates || typeof data.coordinates.latitude !== "number") {
      issues.push("Missing or invalid Geopoint coordinates.");
    }

    // 2. Vibe check
    if (!Array.isArray(data.vibe) || data.vibe.length === 0) {
      issues.push("Venue has no Vibe tags or invalid vibe format.");
    }

    // 3. Operational check
    if (!data.hours || typeof data.hours !== "object") {
      issues.push("Missing or invalid hours of operation.");
    }

    // 4. Branding check
    if (!data.name || data.name.length < 3) {
      issues.push("Invalid or missing brand name.");
    }

    return {
      venueId: input.venueId,
      name: data.name || "Unknown",
      status: issues.length === 0 ? "COMPLIANT" : "NON-COMPLIANT",
      issues: issues,
    };
  },
);

export const searchBars = ai.defineTool(
  {
    name: "searchBars",
    description: "Finds bars based on criteria or vibe",
    inputSchema: z.object({
      query: z.string().describe("Search keywords for name"),
      vibe: z.string().optional().describe("Filter by specific vibe tag"),
    }),
  },
  async (input) => {
    const barsRef = db.collection("bars");
    let queryObj: admin.firestore.Query = barsRef;

    if (input.vibe) {
      queryObj = queryObj.where("vibe", "array-contains", input.vibe);
    }

    const snapshot = await queryObj.get();
    const results = snapshot.docs.map((doc) => doc.data());

    if (input.query) {
      const q = input.query.toLowerCase();
      return results.filter(
        (bar) => bar.name && bar.name.toLowerCase().includes(q),
      );
    }

    return results;
  },
);
