// src/hooks/useLanguage.ts
// 사이트 텍스트를 DB(content 문서)에서 가져오되, 비활성/실패/미등록이면 정적 데이터로 fallback.
import { useEffect, useState } from "react";
import { contentKo } from "@/data/content.ko";
import { contentEn } from "@/data/content.en";
import { api } from "@/lib/api";
import { isApiEnabled } from "@/lib/config";

type Lang = "ko" | "en";
type Content = typeof contentKo;

const STATIC: Record<Lang, Content> = {
  ko: contentKo,
  en: contentEn as Content,
};

export const useLanguage = () => {
  const [lang, setLang] = useState<Lang>("ko");
  // DB 에서 받아온 콘텐츠 캐시 (언어별). 없으면 정적 데이터 사용.
  const [overrides, setOverrides] = useState<Partial<Record<Lang, Content>>>({});

  useEffect(() => {
    if (!isApiEnabled || overrides[lang]) return;
    let alive = true;
    api
      .getContent(lang)
      .then((data) => {
        if (alive && data) setOverrides((prev) => ({ ...prev, [lang]: data as Content }));
      })
      .catch(() => {
        /* 404/실패 → 정적 데이터 유지 */
      });
    return () => {
      alive = false;
    };
  }, [lang, overrides]);

  const content: Content = overrides[lang] ?? STATIC[lang];

  return { lang, setLang, content };
};
