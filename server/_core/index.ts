import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { discoverAll } from "../podcast-ingestion";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);

// ============================================================
// Podcast Discovery Cron Scheduler
// Runs every 24 hours — only processes cases not synced in 23h
// ============================================================

const PODCAST_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

function schedulePodcastDiscovery() {
  // Initial run: delay 5 minutes after server start to avoid startup load
  const INITIAL_DELAY_MS = 5 * 60 * 1000;

  setTimeout(async () => {
    console.log("[cron] Starting initial podcast discovery run...");
    try {
      const result = await discoverAll();
      console.log(`[cron] Discovery complete: ${result.processed} cases processed, ${result.errors} errors`);
    } catch (err) {
      console.error("[cron] Discovery failed:", err);
    }

    // Schedule recurring runs every 24 hours
    setInterval(async () => {
      console.log("[cron] Running scheduled podcast discovery...");
      try {
        const result = await discoverAll();
        console.log(`[cron] Discovery complete: ${result.processed} cases processed, ${result.errors} errors`);
      } catch (err) {
        console.error("[cron] Discovery failed:", err);
      }
    }, PODCAST_SYNC_INTERVAL_MS);
  }, INITIAL_DELAY_MS);

  console.log(`[cron] Podcast discovery scheduler registered (first run in 5 min, then every 24h)`);
}

// Only run the scheduler in production or when explicitly enabled
if (process.env.NODE_ENV === "production" || process.env.ENABLE_PODCAST_CRON === "true") {
  schedulePodcastDiscovery();
} else {
  console.log("[cron] Podcast discovery scheduler disabled in development (set ENABLE_PODCAST_CRON=true to enable)");
}
