import { useAuthRequest, makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { auth0Config } from '../config/auth0';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: `https://${auth0Config.domain}/authorize`,
  tokenEndpoint: `https://${auth0Config.domain}/oauth/token`,
  revocationEndpoint: `https://${auth0Config.domain}/oauth/revoke`,
};

export const useAuth0 = () => {
  const redirectUri = makeRedirectUri({
    scheme: 'spent',
    path: 'auth',
  });

  // Debug: Log the redirect URI being used
  console.log('🔗 Auth0 Redirect URI:', redirectUri);
  console.log('⚠️  Make sure this is in Auth0 Allowed Callback URLs!');

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: auth0Config.clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      extraParams: {
        audience: auth0Config.audience,
      },
      usePKCE: true, // Explicitly enable PKCE
    },
    discovery
  );

  // Return the request object which contains the codeVerifier
  return { request, response, promptAsync, redirectUri };
};

export const exchangeCodeForToken = async (
  code: string,
  redirectUri: string,
  codeVerifier: string
) => {
  const body = {
    grant_type: 'authorization_code',
    client_id: auth0Config.clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier, // PKCE code verifier - REQUIRED!
    audience: auth0Config.audience,
  };

  console.log('🔄 Exchanging code for token...');
  console.log('📦 Request body:', JSON.stringify({ ...body, code_verifier: '[REDACTED]' }, null, 2));

  const response = await fetch(`https://${auth0Config.domain}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ Token exchange failed:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
    });
    throw new Error(`Failed to exchange code for token: ${JSON.stringify(errorData)}`);
  }

  const tokenData = await response.json();
  console.log('✅ Token exchange successful!');
  return tokenData;
};

export const getUserInfo = async (accessToken: string) => {
  const response = await fetch(`https://${auth0Config.domain}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return await response.json();
};
