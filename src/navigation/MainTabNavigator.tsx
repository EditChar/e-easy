import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { User } from '../types/auth'; // User tipini import et
// import Ionicons from 'react-native-vector-icons/Ionicons'; // İkonlar için örnek, kurulum gerektirir

export type MainTabParamList = {
  HomeTab: undefined; // Tabların içindeki stack'ler için veya doğrudan ekranlar için
  ChatTab: undefined;
  ProfileTab: { setIsAuthenticated: (isAuthenticated: boolean) => void };
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// MainTabNavigator'ın setIsAuthenticated prop'unu alması için interface
interface MainTabNavigatorProps {
  user: User | null;
  updateUser: (user: User) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

const MainTabNavigator = ({ user, updateUser, setIsAuthenticated }: MainTabNavigatorProps) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          // Metin bazlı ikonlar
          if (route.name === 'HomeTab') return <Text style={{color: color, fontSize: size * 0.7, fontWeight: focused ? 'bold' : 'normal'}}>🏠</Text>;
          if (route.name === 'ChatTab') return <Text style={{color: color, fontSize: size * 0.7, fontWeight: focused ? 'bold' : 'normal'}}>💬</Text>;
          if (route.name === 'ProfileTab') return <Text style={{color: color, fontSize: size * 0.7, fontWeight: focused ? 'bold' : 'normal'}}>👤</Text>;
          return null;
        },
        tabBarActiveTintColor: '#1e88e5', // Aktif tab rengi
        tabBarInactiveTintColor: 'gray',    // Pasif tab rengi
        headerShown: true, // Tab başlıklarını göstermek için true yapıldı
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        children={(props) => <HomeScreen {...props} user={user} />}
        options={{ title: 'Ana Sayfa' }} 
      />
      <Tab.Screen 
        name="ChatTab" 
        component={ChatScreen} 
        options={{ title: 'Sohbet' }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        options={{ title: 'Profil' }}
      >
        {(props) => (
          <ProfileScreen 
            {...props} 
            user={user} 
            updateUser={updateUser}
            setIsAuthenticated={setIsAuthenticated} 
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default MainTabNavigator; 