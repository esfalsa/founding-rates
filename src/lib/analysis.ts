import type { Founding, RegionData } from "@/lib/types";

export function getFoundingsByRegion(foundings: Founding[]) {
  const foundingsByRegion: RegionData[] = [];

  for (const founding of foundings) {
    const region = foundingsByRegion.find((r) => r.name === founding.region);
    if (region) {
      region.foundings++;
    } else {
      foundingsByRegion.push({ name: founding.region, foundings: 1 });
    }
  }

  foundingsByRegion.sort((a, b) => b.foundings - a.foundings);

  return foundingsByRegion;
}
