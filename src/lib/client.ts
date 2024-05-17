import {
  endOfDay,
  getUnixTime,
  isAfter,
  isSameDay,
  startOfDay,
  subDays,
} from "date-fns";
import { FoundingsCache as Cache } from "@/lib/cache";
import { parseFoundings } from "@/lib/parsers";
import type { Founding } from "@/lib/types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const cache = new Cache(".cache");

/**
 * Retrieve the up to 200 most recent foundings between two given times
 *
 * @param sinceTime the UNIX time, in seconds, to find foundings since
 * @param beforeTime the UNIX time, in seconds, to find foundings before
 * @returns the 200 most recent foundings in the given time interval
 */
async function getFoundingsBetween(sinceTime: number, beforeTime: number) {
  const res = await fetch(
    `https://www.nationstates.net/cgi-bin/api.cgi?q=happenings;filter=founding;limit=200;beforetime=${beforeTime};sincetime=${sinceTime}`,
    {
      headers: {
        "User-Agent": "NationStates Founding Rates (by: Esfalsa)",
      },
    },
  );

  const ratelimitRemaining = Number(res.headers.get("RateLimit-Remaining"));
  const ratelimitReset = Number(res.headers.get("RateLimit-Reset"));

  const foundings = parseFoundings(await res.text());

  await sleep((ratelimitReset / ratelimitRemaining) * 1000);

  return foundings;
}

/**
 * Retrieve the foundings that occurred on a given day
 *
 * @param date the day to retrieve foundings from
 * @returns the foundings on the given day
 */
async function getFoundingsOnDay(date: Date) {
  const key = startOfDay(date);
  const value = await cache.get(key);

  if (value !== null) {
    return value;
  }

  let beforeTime = getUnixTime(endOfDay(date));
  const sinceTime = getUnixTime(startOfDay(date));

  let foundings: Founding[] = [];

  let remaining = true;

  do {
    const newFoundings = await getFoundingsBetween(sinceTime, beforeTime);

    if (newFoundings.length > 0) {
      beforeTime = getUnixTime(newFoundings.at(-1)!.time);
      foundings = foundings.concat(newFoundings);
      remaining = newFoundings.length === 200;
    } else {
      remaining = false;
    }
  } while (remaining);

  await cache.set(key, foundings);

  return foundings;
}

/**
 * Retrieve foundings from the last seven days
 */
export async function getFoundings() {
  const sevenDaysAgo = startOfDay(subDays(new Date(), 7));
  let day = new Date();

  let foundings: Founding[] = [];

  while (isAfter(day, sevenDaysAgo) || isSameDay(day, sevenDaysAgo)) {
    foundings = foundings.concat(await getFoundingsOnDay(day));
    day = subDays(day, 1);
  }

  await cache.prune(sevenDaysAgo);

  return foundings;
}
