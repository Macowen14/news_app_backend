import dns from "dns";
import { promisify } from "util";
import axios from "axios";

const dnsLookup = promisify(dns.lookup);

export async function runNetworkDiagnostics() {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🔍 NETWORK DIAGNOSTICS - ${new Date().toISOString()}`);
  console.log(`${"=".repeat(50)}`);

  const results = {
    timestamp: new Date().toISOString(),
    dns: {},
    connectivity: {},
    apis: {},
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cwd: process.cwd(),
      environment: process.env.NODE_ENV || "development",
    },
  };

  // 1. DNS Tests
  const domains = ["gnews.io", "google.com", "github.com", "httpbin.org"];
  console.log(`\n🌐 DNS Resolution Tests:`);
  for (const domain of domains) {
    try {
      const result = await dnsLookup(domain);
      console.log(`✅ ${domain}: ${result.address} (${result.family})`);
      results.dns[domain] = { success: true, ip: result.address, family: result.family };
    } catch (error) {
      console.log(`❌ ${domain}: ${error.message}`);
      results.dns[domain] = { success: false, error: error.message };
    }
  }

  // 2. Connectivity Tests
  const testUrls = [
    "https://httpbin.org/ip",
    "https://api.github.com",
    "https://www.google.com",
    "https://gnews.io",
  ];
  console.log(`\n🔗 Connectivity Tests:`);
  for (const url of testUrls) {
    try {
      const startTime = Date.now();
      const response = await axios.get(url, { timeout: 10000, validateStatus: () => true });
      const duration = Date.now() - startTime;
      console.log(`✅ ${url}: ${response.status} (${duration}ms)`);
      results.connectivity[url] = { success: true, status: response.status, duration: `${duration}ms` };
    } catch (error) {
      console.log(`❌ ${url}: ${error.message}`);
      results.connectivity[url] = { success: false, error: error.message };
    }
  }

  // 3. API Checks
  console.log(`\n🔌 API Tests:`);
  if (process.env.GNEWS_API_KEY) {
    try {
      const gnewsResponse = await axios.get("https://gnews.io/api/v4/top-headlines", {
        params: { token: process.env.GNEWS_API_KEY, topic: "technology", lang: "en", max: 1 },
        timeout: 15000,
      });
      console.log(`✅ GNews API: ${gnewsResponse.status} - ${gnewsResponse.data?.articles?.length || 0} articles`);
      results.apis.gnews = {
        success: true,
        status: gnewsResponse.status,
        articlesCount: gnewsResponse.data?.articles?.length || 0,
      };
    } catch (error) {
      console.log(`❌ GNews API: ${error.message}`);
      results.apis.gnews = { success: false, error: error.message };
    }
  } else {
    console.log(`⚠️ GNews API: No API key configured`);
    results.apis.gnews = { success: false, error: "No API key" };
  }

  if (process.env.CRYPTOPANIC_TOKEN) {
    try {
      const cryptoResponse = await axios.get("https://cryptopanic.com/api/v1/posts/", {
        params: { auth_token: process.env.CRYPTOPANIC_TOKEN, kind: "news", public: true },
        timeout: 15000,
      });
      console.log(`✅ CryptoPanic API: ${cryptoResponse.status} - ${cryptoResponse.data?.results?.length || 0} articles`);
      results.apis.cryptopanic = {
        success: true,
        status: cryptoResponse.status,
        articlesCount: cryptoResponse.data?.results?.length || 0,
      };
    } catch (error) {
      console.log(`❌ CryptoPanic API: ${error.message}`);
      results.apis.cryptopanic = { success: false, error: error.message };
    }
  } else {
    console.log(`⚠️ CryptoPanic API: No token configured`);
    results.apis.cryptopanic = { success: false, error: "No token" };
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`🏁 DIAGNOSTICS COMPLETE`);
  console.log(`${"=".repeat(50)}\n`);

  return results;
}

export async function quickNetworkTest() {
  try {
    const response = await axios.get("https://httpbin.org/ip", { timeout: 5000 });
    console.log(`🌐 Quick test: ✅ Connected (IP: ${response.data?.origin})`);
    return { success: true, ip: response.data?.origin };
  } catch (error) {
    console.log(`🌐 Quick test: ❌ Failed (${error.message})`);
    return { success: false, error: error.message };
  }
}
