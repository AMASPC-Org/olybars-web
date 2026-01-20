
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import cors from "cors";

const corsHandler = cors({ origin: [/olybars\.com$/, /firebaseapp\.com$/, /localhost/] });

export const logClientError = onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            const { message, stack, source, lineno, colno, context } = req.body;

            // Structure the log entry for Google Cloud Logging
            const logEntry = {
                severity: "ERROR",
                message: `[CLIENT_ERROR] ${message}`,
                jsonPayload: {
                    stack,
                    source,
                    lineno,
                    colno,
                    context, // e.g., URL, UserAgent
                    timestamp: new Date().toISOString(),
                },
            };

            logger.error(logEntry.message, logEntry.jsonPayload);
            res.status(200).send("Error logged");
        } catch (e) {
            console.error("Failed to log client error:", e);
            res.status(500).send("Logging failed");
        }
    });
});
