export async function aiSearch(query: string) {
  // Placeholder for Gemini integration. Returns a deterministic mock structure.
  const trimmed = query.trim();
  if (!trimmed) {
    return { summary: "Enter a query to search.", links: [], videos: [] };
  }
  return {
    summary: `Summary for: ${trimmed}`,
    links: [
      { title: "Example Link 1", url: "https://example.com/1" },
      { title: "Example Link 2", url: "https://example.com/2" }
    ],
    videos: [
      { title: "Example Video A", url: "https://youtube.com/watch?v=dQw4w9WgXcQ" }
    ]
  };
}


