import axios from "axios";


export async function fetchCryptoPanic() {
  const token = process.env.CRYPTOPANIC_TOKEN;
  if (!token) return [];
  try {
    const { data } = await axios.get("https://cryptopanic.com/api/v1/posts/", {
      params: { auth_token: token, kind: "news", public: true }
    });
    const results = Array.isArray(data?.results) ? data.results : [];
    return results.map((r) => ({
      id: `cp-${r.id}`,
      title: r.title,
      description: r.domain,
      url: r.url,
      imageUrl: undefined,
      source: "CryptoPanic",
      publishedAt: r.published_at
    }));
  } catch {
    return [];
  }
}


