import { cache } from "react";
import { JSDOM } from "jsdom";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch the 200 most recent founding events
 * @param {number} beforeTime The UNIX time, in seconds, to find foundings before.
 */
const getFoundings = cache(async (beforeTime: number | null) => {
  const endpoint = beforeTime
    ? `https://www.nationstates.net/cgi-bin/api.cgi?q=happenings;filter=founding;limit=200;beforetime=${beforeTime}`
    : "https://www.nationstates.net/cgi-bin/api.cgi?q=happenings;filter=founding;limit=200";

  const res = await fetch(endpoint, {
    headers: {
      "User-Agent": "NationStates Founding Rates (by: Esfalsa)",
    },
  });

  let ratelimitRemaining = Number(res.headers.get("RateLimit-Remaining"));
  let ratelimitReset = Number(res.headers.get("RateLimit-Reset"));

  // sleep for average remaining time per request left in current bucket
  // delay will be uneven due to time waiting for response and parsing XML
  // but it seems to work well enough for now
  await sleep((ratelimitReset / ratelimitRemaining) * 1000);

  const doc = new JSDOM(await res.text(), {
    contentType: "application/xml",
  }).window.document;

  return [...doc.querySelectorAll("EVENT")].flatMap((event) => {
    const nation = event
      .querySelector("TEXT")
      ?.textContent?.match(/@@(.+)@@/)?.[1];
    const region = event
      .querySelector("TEXT")
      ?.textContent?.match(/%%(.+)%%/)?.[1];
    const time = Number(event.querySelector("TIMESTAMP")?.textContent);

    if (nation && region && time) {
      return { nation, region, time };
    } else {
      return [];
    }
  });
});

export default async function Home() {
  const targetTime = Date.now() / 1000 - 7 * 24 * 60 * 60;

  let data: { nation: string; region: string; time: number }[] = [];
  let beforeTime: number | null = null;

  do {
    data = [...data, ...(await getFoundings(beforeTime))];
    beforeTime = data[data.length - 1].time;
  } while (beforeTime > targetTime);

  const regionData: Record<string, number> = {};

  data.forEach(({ region }) => {
    if (region in regionData) {
      regionData[region]++;
    } else {
      regionData[region] = 1;
    }
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12">
      <p>Generated: {new Date().toString()}</p>
      <p>Sample size: {data.length}</p>
      <p>
        Data from:{" "}
        {new Date(data[data.length - 1].time * 1000).toLocaleString()}
      </p>
      <p>Data to: {new Date(data[0].time * 1000).toLocaleString()}</p>
      <pre>{JSON.stringify(regionData, null, 2)}</pre>
    </main>
  );
}
