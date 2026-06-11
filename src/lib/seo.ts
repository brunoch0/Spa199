import { DUBAI_AREAS } from "./constants";

export function areaSlug(area: string) {
  return area.toLowerCase().replace(/\s+/g, "-");
}

export function areaFromSlug(slug: string): string | null {
  return DUBAI_AREAS.find((a) => areaSlug(a) === slug) ?? null;
}
