// Auth0 Configuration
// Replace these with your Auth0 credentials

export const auth0Config = {
  domain: 'dev-rls1v1n003twbofq.us.auth0.com',
  clientId: 't97SMg2eW4srJO94rxJ6JekyAvRziRgt',
  audience: 'https://spent-api',
};

// API Configuration
export const apiConfig = {
  baseURL: __DEV__ 
    ? 'http://localhost:3000/api' 
    : 'https://your-production-api.com/api',
};
