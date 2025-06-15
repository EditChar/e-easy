// Örnek SettingsScreen.tsx
import React from 'react';
import { View, Button, Alert, StyleSheet, Text } from 'react-native';
import apiClient from '../api/apiClient';
import { clearTokens } from '../utils/authStorage';
// import { useNavigation } from '@react-navigation/native'; // Artık kullanılmıyor olabilir

interface SettingsScreenProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

const SettingsScreen = ({ setIsAuthenticated }: SettingsScreenProps) => {
  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
      console.log('Successfully logged out from server.');
    } catch (error: any) {
      console.error('Error logging out from server:', error.response?.data || error.message);
    } finally {
      await clearTokens();
      setIsAuthenticated(false);
      // Alert.alert('Çıkış Yapıldı', 'Başarıyla çıkış yaptınız.');
      // Yönlendirme sonrası Alert göstermek genellikle daha iyi bir UX sağlar,
      // ancak App.tsx zaten Login ekranına yönlendireceği için bu Alert çok kısa görünebilir.
      // İsteğe bağlı olarak Login ekranında "Başarıyla çıkış yapıldı" gibi bir mesaj gösterilebilir.
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ayarlar</Text>
      <View style={styles.buttonContainer}>
        <Button title="Çıkış Yap" onPress={handleLogout} color="#d32f2f" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f4f7',
  },
  title: {
    fontSize: 28, // Başlık boyutu
    fontWeight: 'bold',
    marginBottom: 40, // Başlık ve buton arası boşluk
    color: '#263238',
  },
  buttonContainer: {
    width: '80%', // Buton genişliği
  }
});

export default SettingsScreen;