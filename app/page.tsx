import { cache } from "react";
import { JSDOM } from "jsdom";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch the 200 most recent founding events
 * @param {number} beforeTime The UNIX time, in seconds, to find foundings before.
 */
const getFoundings = cache(async (beforeTime: number) => {
  const res = await fetch(
    `https://www.nationstates.net/cgi-bin/api.cgi?q=happenings;filter=founding;limit=200;beforetime=${beforeTime}`,
    {
      headers: {
        "User-Agent": "NationStates Founding Rates (by: Esfalsa)",
      },
    }
  );

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

const getAllFoundings = cache(async (targetTime: number) => {
  let data: { nation: string; region: string; time: number }[] = [];
  let beforeTime: number = Math.floor(Date.now() / 1000);

  do {
    data = [...data, ...(await getFoundings(beforeTime))];
    beforeTime = data[data.length - 1].time;
  } while (beforeTime > targetTime);

  return data;
});

export default async function Home() {
  const targetTime = Math.floor(Date.now() / 1000 - 7 * 24 * 60 * 60);

  const data = await getAllFoundings(targetTime);

  const dataByRegion: { name: string; value: number }[] = [];

  for (const founding of data) {
    const regionIndex = dataByRegion.findIndex(
      (item) => item.name === founding.region
    );

    if (regionIndex === -1) {
      dataByRegion.push({
        name: founding.region,
        value: 1,
      });
    } else {
      dataByRegion[regionIndex].value++;
    }
  }

  dataByRegion.sort((a, b) => (a.value < b.value ? 1 : -1));

  const maxFoundings = Math.max(...dataByRegion.map(({ value }) => value));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12">
      <p>
        Showing data from {data.length} foundings between{" "}
        {new Date(data[data.length - 1].time * 1000).toLocaleString()} and{" "}
        {new Date(data[0].time * 1000).toLocaleString()}.
      </p>
      <p>Generated at {new Date().toString()}</p>
      <table>
        <thead>
          <tr>
            <th>Region</th>
            <th>Foundings</th>
            <th className="w-32">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {dataByRegion.map((region) => (
            <tr key={region.name}>
              <td>
                <a
                  href={`https://www.nationstates.net/region=${encodeURIComponent(
                    region.name
                  )}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-blue-600"
                >
                  {region.name}
                </a>
              </td>
              <td>{region.value}</td>
              <td className="flex flex-row items-center space-x-4">
                <div className="h-1.5 w-full bg-gray-200">
                  <div
                    className="h-1.5 bg-blue-600"
                    style={{
                      width: `${Math.round(
                        (region.value / maxFoundings) * 100
                      )}%`,
                    }}
                  />
                </div>
                <span>{`${((region.value / data.length) * 100).toFixed(
                  2
                )}%`}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
