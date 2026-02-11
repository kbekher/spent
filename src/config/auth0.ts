// Auth0 Configuration
// Replace these with your Auth0 credentials

export const auth0Config = {
  domain: 'dev-rls1v1n003twbofq.us.auth0.com',
  clientId: 't97SMg2eW4srJO94rxJ6JekyAvRziRgt',
  audience: 'https://spent-api',
};

// API Configuration
// Choose the right baseURL for your setup:
export const apiConfig = {
  baseURL: __DEV__ 
    // Physical device (use your computer's IP)
    ? 'http://192.168.2.198:3001/api'
    
    // iOS Simulator (uncomment if using iOS simulator)
    // ? 'http://localhost:3001/api'
    
    // Android Emulator (uncomment if using Android emulator)
    // ? 'http://10.0.2.2:3001/api'
    
    : 'https://your-production-api.com/api',
};
