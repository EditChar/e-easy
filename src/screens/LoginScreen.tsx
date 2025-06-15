// Örnek LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text } from 'react-native';
import { loginUser } from '../api/apiClient';
import { storeTokens } from '../utils/authStorage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'> & {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
};

const LoginScreen = ({ navigation, setIsAuthenticated }: LoginScreenProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    console.log('[LoginScreen] handleLogin fonksiyonu çağrıldı.');
    if (!username || !password) {
      Alert.alert('Hata', 'Kullanıcı adı ve şifre boş bırakılamaz.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await loginUser({ username, password });

      if (response && response.accessToken && response.refreshToken) {
        await storeTokens(response.accessToken, response.refreshToken);
        console.log('Login Başarılı ve Tokenlar Kaydedildi', response.user);
        setIsAuthenticated(true);
      } else {
        Alert.alert(
          'Login Başarısız',
          (response as any)?.message || 'Kullanıcı adı veya şifre hatalı.'
        );
      }
    } catch (error: any) {
      console.error('[LoginScreen] Login Hatası Detayı:', error);
      Alert.alert('Giriş Başarısız', 'Kullanıcı adı veya şifre hatalı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EasyTo'ya Giriş Yap</Text>
      <TextInput
        style={styles.input}
        placeholder="Kullanıcı Adı"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        editable={!isLoading}
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />
      <Button 
        title={isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"} 
        onPress={handleLogin} 
        disabled={isLoading} 
        color="#1e88e5"
      />
      <View style={styles.signupButtonContainer}>
        <Button 
          title="Hesabın yok mu? Kayıt Ol"
          onPress={() => navigation.navigate('Signup')}
          disabled={isLoading}
          color="#43a047"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f0f4f7',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    color: '#263238',
  },
  input: {
    height: 50,
    borderColor: '#cfd8dc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#37474f',
  },
  signupButtonContainer: {
    marginTop: 16,
  }
});

export default LoginScreen;