import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth0, exchangeCodeForToken, getUserInfo } from '../utils/auth0Helper';
import { useAppDispatch } from '../store/hooks';
import { loginUser } from '../store/slices/authSlice';

export default function LoginScreen() {
  const { request, response, promptAsync, redirectUri } = useAuth0();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    // Debug logging
    console.log('Auth0 Response:', response);
    
    if (response?.type === 'success') {
      console.log('✅ Auth successful, code:', response.params.code);
      const { code } = response.params;
      handleAuthentication(code);
    } else if (response?.type === 'error') {
      console.error('❌ Auth error:', response.error);
      alert(`Authentication error: ${response.error?.message || 'Unknown error'}`);
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      console.log('❌ Auth dismissed/cancelled');
    }
  }, [response]);

  const handleAuthentication = async (code: string) => {
    try {
      setLoading(true);
      
      console.log('🔑 Using redirect URI:', redirectUri);
      
      // Get the code verifier from the request (PKCE)
      const codeVerifier = request?.codeVerifier;
      
      if (!codeVerifier) {
        console.error('❌ No code verifier found! PKCE is required.');
        throw new Error('Missing PKCE code verifier');
      }
      
      console.log('✅ Code verifier present');

      // Exchange code for token with PKCE verifier
      const tokenResponse = await exchangeCodeForToken(code, redirectUri, codeVerifier);
      const { access_token } = tokenResponse;

      // Get user info
      const userInfo = await getUserInfo(access_token);

      // Login with Redux
      await dispatch(
        loginUser({
          accessToken: access_token,
          email: userInfo.email,
          username: userInfo.name || userInfo.email.split('@')[0],
        })
      ).unwrap();
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      console.log('🚀 Starting login with redirect URI:', redirectUri);
      await promptAsync();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Authenticating...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>💰 Spent</Text>
        <Text style={styles.subtitle}>Track your expenses with ease</Text>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={!request}
        >
          <Text style={styles.loginButtonText}>Login with Auth0</Text>
        </TouchableOpacity>

        <Text style={styles.description}>
          Secure authentication powered by Auth0
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 48,
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    marginTop: 24,
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
});
