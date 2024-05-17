import { getFoundingsByRegion } from "@/lib/analysis";
import { getFoundings } from "@/lib/client";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify(getFoundingsByRegion(await getFoundings())),
  );
};
