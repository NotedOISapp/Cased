import { ENV } from "./_core/env";

export async function checkTaddyCredentials() {
  if (!ENV.taddyUserId || !ENV.taddyApiKey) {
    throw new Error(
      "Missing Taddy credentials. TADDY_USER_ID and TADDY_API_KEY environment variables are required."
    );
  }
}

export async function searchTaddyEpisodes(query: string) {
  checkTaddyCredentials();

  const graphqlQuery = `
    query SearchEpisodes($query: String!) {
      searchForTerm(term: $query, filterForTypes: [PODCASTEPISODE]) {
        searchId
        podcastEpisodes {
          uuid
          name
          description
          datePublished
          duration
          audioUrl
          podcastSeries {
            uuid
            name
            imageUrl
            itunesId
            websiteUrl
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.taddy.org", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-USER-ID": ENV.taddyUserId,
      "X-API-KEY": ENV.taddyApiKey,
    },
    body: JSON.stringify({
      query: graphqlQuery,
      variables: { query },
    }),
  });

  if (!response.ok) {
    throw new Error(`Taddy API error: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(`Taddy GraphQL error: ${JSON.stringify(data.errors)}`);
  }

  return data.data.searchForTerm.podcastEpisodes || [];
}
