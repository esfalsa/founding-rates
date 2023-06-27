import { cache } from "react";
import { JSDOM } from "jsdom";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const getTargetTime = () => {
  return Math.floor(Date.now() / 1000 - 7 * 24 * 60 * 60);
};

/**
 * Fetch the 200 most recent founding events
 * @param {number} beforeTime The UNIX time, in seconds, to find foundings before.
 */
export const getFoundings = cache(async (beforeTime: number) => {
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

export const getAllFoundings = cache(async (targetTime: number) => {
  let data: { nation: string; region: string; time: number }[] = [];
  let beforeTime: number = Math.floor(Date.now() / 1000);

  do {
    data = [...data, ...(await getFoundings(beforeTime))];
    beforeTime = data[data.length - 1].time;
  } while (beforeTime > targetTime);

  return data;
});
