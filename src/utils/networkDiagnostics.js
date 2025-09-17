// utils/networkDiagnostics.ts
import dns from 'dns';
import { promisify } from 'util';
import axios from 'axios';

const dnsLookup = promisify(dns.lookup);
const dnsResolve = promisify(dns.resolve);


export async function runNetworkDiagnostics() {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🔍 NETWORK DIAGNOSTICS`);
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log(`${'='.repeat(50)}`);

  const results = {
    timestamp: new Date().toISOString(),
    dns: {},
    connectivity: {},
    apis: {}
  };

  // 1. DNS Tests
  console.log(`\n🌐 DNS Resolution Tests:`);
  const domains = ['gnews.io', 'google.com', 'github.com', 'httpbin.org'];
  
  for (const domain of domains) {
    try {
      const result = await dnsLookup(domain);
      console.log(`✅ ${domain}: ${result.address} (${result.family})`);
      results.dns[domain] = { success: true, ip: result.address, family: result.family };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ ${domain}: ${errorMessage}`);
      results.dns[domain] = { success: false, error: errorMessage };
    }
  }

  // 2. Basic Connectivity Tests
  console.log(`\n🔗 Connectivity Tests:`);
  const testUrls = [
    'https://httpbin.org/ip',
    'https://api.github.com',
    'https://www.google.com',
    'https://gnews.io'
  ];

  for (const url of testUrls) {
    try {
      const startTime = Date.now();
      const response = await axios.get(url, { 
        timeout: 10000,
        validateStatus: () => true
      });
      const duration = Date.now() - startTime;
      
      console.log(`✅ ${url}: ${response.status} (${duration}ms)`);
      results.connectivity[url] = { 
        success: true, 
        status: response.status, 
        duration: `${duration}ms` 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ ${url}: ${errorMessage}`);
      results.connectivity[url] = { success: false, error: errorMessage };
    }
  }

  // 3. API-Specific Tests
  console.log(`\n🔌 API Tests:`);
  
  // Test GNews API
  if (process.env.GNEWS_API_KEY) {
    try {
      const gnewsResponse = await axios.get('https://gnews.io/api/v4/top-headlines', {
        params: {
          token: process.env.GNEWS_API_KEY,
          topic: 'technology',
          lang: 'en',
          max: 1
        },
        timeout: 15000
      });
      
      console.log(`✅ GNews API: ${gnewsResponse.status} - ${gnewsResponse.data?.articles?.length || 0} articles`);
      results.apis.gnews = { 
        success: true, 
        status: gnewsResponse.status,
        articlesCount: gnewsResponse.data?.articles?.length || 0
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ GNews API: ${errorMessage}`);
      results.apis.gnews = { success: false, error: errorMessage };
    }
  } else {
    console.log(`⚠️ GNews API: No API key configured`);
    results.apis.gnews = { success: false, error: 'No API key' };
  }

  // Test CryptoPanic API
  if (process.env.CRYPTOPANIC_TOKEN) {
    try {
      const cryptoResponse= await axios.get('https://cryptopanic.com/api/v1/posts/', {
        params: {
          auth_token: process.env.CRYPTOPANIC_TOKEN,
          kind: 'news',
          public: true
        },
        timeout: 15000
      });
      
      console.log(`✅ CryptoPanic API: ${cryptoResponse.status} - ${cryptoResponse.data?.results?.length || 0} articles`);
      results.apis.cryptopanic = { 
        success: true, 
        status: cryptoResponse.status,
        articlesCount: cryptoResponse.data?.results?.length || 0
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ CryptoPanic API: ${errorMessage}`);
      results.apis.cryptopanic = { success: false, error: errorMessage };
    }
  } else {
    console.log(`⚠️ CryptoPanic API: No token configured`);
    results.apis.cryptopanic = { success: false, error: 'No token' };
  }

  // 4. System Information
  console.log(`\n💻 System Information:`);
  console.log(`🖥️ Platform: ${process.platform} ${process.arch}`);
  console.log(`🔢 Node.js: ${process.version}`);
  console.log(`📁 Working Directory: ${process.cwd()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Check environment variables
  const envVars = [
    'HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY',
    'NODE_TLS_REJECT_UNAUTHORIZED'
  ];
  
  console.log(`\n🔧 Environment Variables:`);
  for (const envVar of envVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`✅ ${envVar}: ${value}`);
    } else {
      console.log(`⭕ ${envVar}: not set`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`🏁 DIAGNOSTICS COMPLETE`);
  console.log(`${'='.repeat(50)}\n`);

  return results;
}

// Quick network test function
export async function quickNetworkTest() {
  try {
    const response = await axios.get('https://httpbin.org/ip', { timeout: 5000 });
    console.log(`🌐 Quick network test: ✅ Connected (IP: ${response.data?.origin})`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`🌐 Quick network test: ❌ Failed (${errorMessage})`);
    return false;
  }
}

// Add this to your main server file to run diagnostics on startup
export function runStartupDiagnostics() {
  // Run quick test immediately
  quickNetworkTest();
  
  // Run full diagnostics after a short delay
  setTimeout(() => {
    runNetworkDiagnostics().catch(console.error);
  }, 2000);
}