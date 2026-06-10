// 프로젝트를 API(DB)에서 가져오되, 비활성/실패/빈 경우 정적 데이터로 fallback.
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { isApiEnabled } from "@/lib/config";
import type { Project } from "@/types/project";

export function useProjects(fallback: Project[]) {
  const [items, setItems] = useState<Project[]>(fallback);

  useEffect(() => {
    if (!isApiEnabled) return;
    let alive = true;
    api
      .listProjects()
      .then((data) => {
        // DB 에 프로젝트가 있을 때만 교체 (시드 전이면 정적 데이터 유지)
        if (alive && data.length > 0) setItems(data);
      })
      .catch(() => {
        /* 실패 시 정적 데이터 유지 */
      });
    return () => {
      alive = false;
    };
  }, [fallback]);

  return items;
}
