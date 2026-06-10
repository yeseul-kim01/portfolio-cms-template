// 역량 목록을 DB(content "resume".competencies)에서 가져오고, 없으면 정적 COMPETENCIES fallback.
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { isApiEnabled } from "@/lib/config";
import { COMPETENCIES, type Competency } from "@/data/competencies";

let cache: Competency[] | null = null;
let inflight: Promise<Competency[]> | null = null;

function fetchComps(): Promise<Competency[]> {
  if (cache) return Promise.resolve(cache);
  if (!isApiEnabled) return Promise.resolve(COMPETENCIES);
  if (!inflight) {
    inflight = api
      .getContent("resume")
      .then((d) => {
        const c = (d as { competencies?: Competency[] })?.competencies;
        return Array.isArray(c) && c.length ? c : COMPETENCIES;
      })
      .catch(() => COMPETENCIES)
      .then((c) => (cache = c));
  }
  return inflight;
}

export function useCompetencies(): Competency[] {
  const [comps, setComps] = useState<Competency[]>(cache ?? COMPETENCIES);
  useEffect(() => {
    let alive = true;
    fetchComps().then((c) => alive && setComps(c));
    return () => {
      alive = false;
    };
  }, []);
  return comps;
}
