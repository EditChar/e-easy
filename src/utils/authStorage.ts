// src/services/authService.ts
import * as Keychain from 'react-native-keychain';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const storeTokens = async (accessToken: string, refreshToken: string) => {
  try {
    // react-native-keychain username ve password bekler, token'ları burada saklayabiliriz.
    // Servis adı olarak uygulamanızın adını kullanabilirsiniz.
    await Keychain.setGenericPassword(ACCESS_TOKEN_KEY, accessToken, { service: ACCESS_TOKEN_KEY });
    await Keychain.setGenericPassword(REFRESH_TOKEN_KEY, refreshToken, { service: REFRESH_TOKEN_KEY });
    console.log('Tokens stored successfully.');
  } catch (error) {
    console.error('Error storing tokens:', error);
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: ACCESS_TOKEN_KEY });
    if (credentials) {
      return credentials.password;
    }
    return null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: REFRESH_TOKEN_KEY });
    if (credentials) {
      return credentials.password;
    }
    return null;
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

export const clearTokens = async () => {
  try {
    await Keychain.resetGenericPassword({ service: ACCESS_TOKEN_KEY });
    await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_KEY });
    console.log('Tokens cleared successfully.');
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};