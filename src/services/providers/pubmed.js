import axios from "axios";
export async function fetchPubMed(query) {
  try {
    const { data } = await axios.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", {
      params: { db: "pubmed", term: query, retmode: "json", retmax: 10 }
    });
    const ids = data?.esearchresult?.idlist ?? [];
    if (ids.length === 0) return [];
    const summary = await axios.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi", {
      params: { db: "pubmed", id: ids.join(","), retmode: "json" }
    });
    const result = summary.data?.result ?? {};
    const items = Object.values(result).filter((v) => v?.uid);
    return (items).map((i) => ({
      id: `pm-${i.uid}`,
      title: i.title,
      description: i.source,
      url: `https://pubmed.ncbi.nlm.nih.gov/${i.uid}/`,
      imageUrl: undefined,
      source: "PubMed",
      publishedAt: i.pubdate
    }));
  } catch {
    return [];
  }
}


