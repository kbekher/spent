import Constants from 'expo-constants';

// Auth0 Configuration
// Replace these with your Auth0 credentials

export const auth0Config = {
  domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? '',
  clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? '',
  audience: 'https://spent-api',
};

function getDevBaseURL(): string {
  const hostUri = Constants.expoConfig?.hostUri ?? 'localhost:8081';
  const host = hostUri.split(':')[0];
  return `http://${host}:3000/api`;
}

// API Configuration
export const apiConfig = {
  baseURL: __DEV__
    ? getDevBaseURL()
    : process.env.EXPO_PUBLIC_API_URL ?? '',
};
