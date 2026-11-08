import { getCollection, type CollectionEntry } from "astro:content";

export const SITE = {
  name: "오늘의돈",
  nameEn: "todaymoney",
  tagline: "숫자로 읽는 오늘의 경제",
  description: "증시·환율·코인 시황을 매일 데이터로 정리하는 경제 뉴스",
};

export const url = (path = "") => `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

export async function getArticles(): Promise<CollectionEntry<"articles">[]> {
  const all = await getCollection("articles");
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export const articleUrl = (a: CollectionEntry<"articles">) => url(`articles/${a.id}/`);

export function formatDate(d: Date, withTime = false) {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
  };
  return new Intl.DateTimeFormat("ko-KR", opts).format(d);
}
