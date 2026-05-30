import { describe, it, expect } from 'vitest';

describe('Listen Notes API key validation', () => {
  it('should authenticate and return search results for a true crime case', async () => {
    const apiKey = process.env.LISTEN_NOTES_API_KEY;
    expect(apiKey, 'LISTEN_NOTES_API_KEY must be set').toBeTruthy();

    const response = await fetch(
      'https://listen-api.listennotes.com/api/v2/search?q=Idaho+4+murders&type=podcast&page_size=3',
      {
        headers: {
          'X-ListenAPI-Key': apiKey!,
        },
      }
    );

    expect(response.status, `Expected 200 but got ${response.status} — check your API key`).toBe(200);

    const data = await response.json() as any;
    expect(data.results).toBeDefined();
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);

    console.log(`✅ Listen Notes API key valid. Found ${data.results.length} results for "Idaho 4 murders"`);
    console.log(`   First result: ${data.results[0]?.title_original ?? data.results[0]?.title}`);
  });
});
