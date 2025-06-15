import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Button, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { getTests } from '../api/apiClient';
import { User } from '../types/auth';

// Test verisi için tip tanımı (API yanıtına göre güncellenebilir)
interface Test {
  id: string;
  title: string; // API'den gelen test adı
  // description?: string;
  // questionCount?: number;
  // Diğer olası alanlar
}

// Props arayüzü eklendi
interface HomeScreenProps {
  user: User | null;
}

// HomeScreen navigation prop tipi
type HomeScreenNavigationProp = NativeStackNavigationProp<AppStackParamList, 'MainTabs'>;

const HomeScreen = ({ user }: HomeScreenProps) => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false); // Pull-to-refresh için

  const fetchTests = async () => {
    try {
      setError(null);
      // setIsLoading(true); // setRefreshing zaten yükleme durumunu belirtiyor
      const fetchedTests = await getTests(); // API'den testleri çek
      setTests(fetchedTests || []); // API yanıtı undefined ise boş array ata
    } catch (err: any) {
      console.error("Testleri çekerken hata:", err);
      setError('Testler yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
      setTests([]); // Hata durumunda listeyi boşalt
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Ekran her focuslandığında testleri yeniden yükle (opsiyonel, ama test tamamlandıktan sonra listeyi güncellemek için iyi)
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true); // Her focuslandığında yükleme göstergesini başlat
      fetchTests();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTests();
  }, []);

  const handleStartTest = (testId: string, testName: string) => {
    navigation.navigate('Test', { testId, testName });
  };

  if (isLoading && !refreshing) { // İlk yükleme ve refresh değilse
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#1e88e5" />
        <Text style={styles.loadingText}>Testler Yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Yeniden Dene" onPress={fetchTests} />
      </View>
    );
  }

  // TODO: İleride, tüm testler tamamlanmışsa eşleşme listesini göster
  // const allTestsCompleted = false; // Bu durum API'den gelen veriye göre belirlenecek
  // const matchedUsers = [
  //   { id: 'user1', name: 'Ayşe K.', score: '850' },
  // ];

  return (
    <View style={styles.container}>
      {/* Örnek: Kullanıcı adını gösterme */}
      {/* <Text style={styles.welcomeText}>Hoş geldin, {user?.firstName || 'Kullanıcı'}!</Text> */}
      {tests.length === 0 && !isLoading ? (
        <View style={styles.centeredContainer}>
          <Text style={styles.noTestsText}>Aktif testiniz bulunmuyor.</Text>
          <Button title="Testleri Yenile" onPress={fetchTests} />
          {/* TODO: Yeni test oluşturma veya başka bir aksiyon butonu eklenebilir */}
        </View>
      ) : (
        <FlatList
          data={tests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.testItemContainer}>
              <Text style={styles.testName}>{item.title}</Text>
              {/* İlerleme yüzdesi kaldırıldı */}
              <Button title="Başla" onPress={() => handleStartTest(item.id, item.title)} color="#4caf50" />
            </View>
          )}
          ListHeaderComponent={<Text style={styles.header}>Aktif Testleriniz</Text>}
          refreshControl={ // Pull-to-refresh özelliği
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1e88e5"]}/>
          }
          contentContainerStyle={tests.length === 0 ? styles.emptyListContent : {}}
        />
      )}
      {/* Eşleşen kullanıcılar listesi (allTestsCompleted true ise) buraya eklenebilir */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  noTestsText: {
    fontSize: 18,
    color: '#555',
    marginBottom: 15,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#263238',
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  testItemContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    flex: 1, // Butonun yanında kalan alanı kaplaması için
    marginRight: 10, // Butonla arasında boşluk
  },
  emptyListContent: {
    flexGrow: 1, // Eğer liste boşsa ortalamak için
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen; 