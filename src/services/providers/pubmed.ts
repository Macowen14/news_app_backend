import axios from "axios";
import type { NormalizedArticle } from "../newsService.js";

export async function fetchPubMed(query: string): Promise<NormalizedArticle[]> {
  try {
    const { data } = await axios.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", {
      params: { db: "pubmed", term: query, retmode: "json", retmax: 10 }
    });
    const ids: string[] = data?.esearchresult?.idlist ?? [];
    if (ids.length === 0) return [];
    const summary = await axios.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi", {
      params: { db: "pubmed", id: ids.join(","), retmode: "json" }
    });
    const result = summary.data?.result ?? {};
    const items = Object.values(result).filter((v: any) => v?.uid);
    return (items as any[]).map((it: any) => ({
      id: `pm-${it.uid}`,
      title: it.title,
      description: it.source,
      url: `https://pubmed.ncbi.nlm.nih.gov/${it.uid}/`,
      imageUrl: undefined,
      source: "PubMed",
      publishedAt: it.pubdate
    }));
  } catch {
    return [];
  }
}


