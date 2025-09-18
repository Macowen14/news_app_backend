export function checkEnvironmentSetup() {
  const config = {
    gnews: {
      available: !!process.env.GNEWS_API_KEY && process.env.GNEWS_API_KEY !== "your_gnews_api_key_here",
      key: process.env.GNEWS_API_KEY ? `${process.env.GNEWS_API_KEY.substring(0, 8)}...` : "Not set",
    },
    cryptopanic: {
      available: !!process.env.CRYPTOPANIC_TOKEN && process.env.CRYPTOPANIC_TOKEN !== "your_cryptopanic_token_here",
      key: process.env.CRYPTOPANIC_TOKEN ? `${process.env.CRYPTOPANIC_TOKEN.substring(0, 8)}...` : "Not set",
    },
    gemini: {
      available: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_ACTUAL_API_KEY_HERE",
      key: process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 8)}...` : "Not set",
    },
    firebase: {
      available: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      project: (() => {
        try {
          const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
          return sa.project_id || "Not set";
        } catch {
          return "Invalid JSON";
        }
      })(),
    },
  };

  console.log(`\n🔧 Environment Configuration Check:`);
  console.log(`📰 GNews API: ${config.gnews.available ? "✅" : "❌"} ${config.gnews.key}`);
  console.log(`💰 CryptoPanic: ${config.cryptopanic.available ? "✅" : "❌"} ${config.cryptopanic.key}`);
  console.log(`🤖 Gemini AI: ${config.gemini.available ? "✅" : "❌"} ${config.gemini.key}`);
  console.log(`🔥 Firebase: ${config.firebase.available ? "✅" : "❌"} Project: ${config.firebase.project}`);

  const availableProviders = Object.values(config).filter(c => c.available).length;
  console.log(`📊 Providers configured: ${availableProviders}/4`);

  return config;
}
