import { describe, it, expect } from "vitest";
import crypto from "crypto";

/**
 * Validates that PODCAST_INDEX_API_KEY and PODCAST_INDEX_API_SECRET
 * are set and can successfully authenticate against the Podcast Index API.
 *
 * Podcast Index auth: SHA-1 HMAC of (apiKey + apiSecret + unixTimestamp)
 */
describe("Podcast Index API credentials", () => {
  it("should have API key and secret set", () => {
    expect(process.env.PODCAST_INDEX_API_KEY).toBeTruthy();
    expect(process.env.PODCAST_INDEX_API_SECRET).toBeTruthy();
  });

  it("should authenticate successfully against Podcast Index API", async () => {
    const apiKey = process.env.PODCAST_INDEX_API_KEY!;
    const apiSecret = process.env.PODCAST_INDEX_API_SECRET!;
    const epoch = Math.floor(Date.now() / 1000);
    const hash = crypto
      .createHash("sha1")
      .update(apiKey + apiSecret + epoch)
      .digest("hex");

    const response = await fetch(
      "https://api.podcastindex.org/api/1.0/search/byterm?q=true+crime&max=1",
      {
        headers: {
          "X-Auth-Key": apiKey,
          "X-Auth-Date": String(epoch),
          Authorization: hash,
          "User-Agent": "Cased/1.0",
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("true");
    expect(Array.isArray(data.feeds)).toBe(true);
  });
});
