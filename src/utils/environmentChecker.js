// utils/environmentChecker.js
export function checkEnvironmentSetup() {
  const config = {
    gnews: {
      available: !!process.env.GNEWS_API_KEY && process.env.GNEWS_API_KEY !== 'your_gnews_api_key_here',
      key: process.env.GNEWS_API_KEY ? `${process.env.GNEWS_API_KEY.substring(0, 8)}...` : 'Not set'
    },
    cryptopanic: {
      available: !!process.env.CRYPTOPANIC_TOKEN && process.env.CRYPTOPANIC_TOKEN !== 'your_cryptopanic_token_here',
      key: process.env.CRYPTOPANIC_TOKEN ? `${process.env.CRYPTOPANIC_TOKEN.substring(0, 8)}...` : 'Not set'
    },
    gemini: {
      available: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_ACTUAL_API_KEY_HERE',
      key: process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 8)}...` : 'Not set'
    },
    firebase: {
      available: !!process.env.GOOGLE_APPLICATION_CREDENTIALS || (
        !!process.env.FIREBASE_PROJECT_ID &&
        !!process.env.FIREBASE_PRIVATE_KEY &&
        !!process.env.FIREBASE_CLIENT_EMAIL
      ),
      project: process.env.FIREBASE_PROJECT_ID || 'Not set'
    }
  };

  console.log(`🔧 Environment Configuration Check:`);
  console.log(`📰 GNews API: ${config.gnews.available ? '✅' : '❌'} ${config.gnews.key}`);
  console.log(`💰 CryptoPanic: ${config.cryptopanic.available ? '✅' : '❌'} ${config.cryptopanic.key}`);
  console.log(`🤖 Gemini AI: ${config.gemini.available ? '✅' : '❌'} ${config.gemini.key}`);
  console.log(`🔥 Firebase: ${config.firebase.available ? '✅' : '❌'} Project: ${config.firebase.project}`);

  const availableProviders = Object.values(config).filter(c => c.available).length;
  console.log(`📊 Total providers configured: ${availableProviders}/4`);

  if (availableProviders === 0) {
    console.warn(`⚠️ No API providers configured! The app will use mock data.`);
    console.warn(`⚠️ Please check your .env file and configure at least one news provider.`);
  }

  return config;
}

// Add this to your main server file to run on startup
export function logStartupInfo() {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 News API Server Starting`);
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Port: ${process.env.PORT || 4000}`);
  console.log(`${'='.repeat(50)}`);
  
  checkEnvironmentSetup();
  
  console.log(`${'='.repeat(50)}\n`);
}