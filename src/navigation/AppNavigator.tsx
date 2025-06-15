import React, { useState, useEffect, useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator, { MainTabParamList } from './MainTabNavigator';
import TestScreen from '../screens/TestScreen';
import AdditionalInfoModal from '../components/AdditionalInfoModal';
import { getMe } from '../api/apiClient';
import { User } from '../types/auth';
import SplashScreen from '../screens/SplashScreen';

// AppStackParamList artık MainTabNavigator'ı içerecek şekilde güncelleniyor
export type AppStackParamList = {
  MainTabs: { screen: keyof MainTabParamList, params?: any }; // MainTabNavigator'a yönlendirme için
  Test: { testId: string; testName?: string }; // TestScreen için parametreler tanımlandı
  // Eğer App seviyesinde başka stack ekranları olacaksa buraya eklenebilir (örn: Modal ekranlar)
};

const Stack = createNativeStackNavigator<AppStackParamList>();

interface AppNavigatorProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

const AppNavigator = ({ setIsAuthenticated }: AppNavigatorProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Kullanıcı verisini güncelleyen ve state'e kaydeden fonksiyon
  const updateUserState = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  // Bileşen yüklendiğinde kullanıcı verisini çek
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getMe();
        setUser(currentUser);
      } catch (error) {
        console.error("Kullanıcı verisi çekilemedi, çıkış yapılıyor.", error);
        // Hata durumunda kullanıcıyı sistemden atabiliriz
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [setIsAuthenticated]);

  // Modal'ın gösterilip gösterilmeyeceğini belirleyen koşul
  const isModalVisible = user ? (!user.residenceCountry || !user.residenceCity || !user.languages || user.languages.length === 0) : false;

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <>
      <Stack.Navigator>
        <Stack.Screen 
          name="MainTabs" 
          options={{ headerShown: false }}
        >
          {(props) => (
            <MainTabNavigator 
              {...props} 
              user={user} 
              updateUser={updateUserState} 
              setIsAuthenticated={setIsAuthenticated} 
            />
          )}
        </Stack.Screen>
        <Stack.Screen 
          name="Test" 
          component={TestScreen} 
          options={({ route }) => ({ 
            title: route.params?.testName || 'Test Çözülüyor',
            headerShown: true,
          })} 
        />
        {/* SettingsScreen kaldırıldı. Çıkış işlemi ProfileScreen içinde olacak. */}
        {/* İleride App seviyesinde (tabların dışında) gösterilecek ekranlar buraya eklenebilir */}
      </Stack.Navigator>
      <AdditionalInfoModal 
        visible={isModalVisible}
        onClose={updateUserState}
      />
    </>
  );
};

export default AppNavigator; 