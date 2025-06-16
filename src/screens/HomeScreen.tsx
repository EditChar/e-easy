import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Button, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { getAvailableTests } from '../api/apiClient';
import { User, MatchedUser } from '../types/auth';
import { useMatchViewModel } from '../viewModels/useMatchViewModel';

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

  // Eşleşme sistemi için ViewModel
  const {
    matchedUsers,
    isLoading: isMatchLoading,
    error: matchError,
    isRefreshing: isMatchRefreshing,
    onRefresh: onMatchRefresh,
  } = useMatchViewModel();

  const fetchTests = async () => {
    try {
      setError(null);
      // API'den sadece kullanıcının tamamlamadığı testleri çek
      const fetchedTests = await getAvailableTests();
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

  // Ekran her focuslandığında testleri yeniden yükle 
  // Test tamamlandıktan sonra geri dönüldüğünde testler otomatik refresh olacak
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

  // Aktif test varsa test listesi, yoksa eşleşme listesi göster
  const showMatchedUsers = tests.length === 0 && !isLoading && !error;

  const renderMatchedUser = ({ item }: { item: MatchedUser }) => (
    <View style={styles.matchItemContainer}>
      <Image
        source={
          item.avatarUrl
            ? { uri: item.avatarUrl }
            : item.id % 2 === 0
            ? require('../assets/images/female.jpg')
            : require('../assets/images/male.jpg')
        }
        style={styles.matchAvatar}
      />
      <View style={styles.matchInfo}>
        <Text style={styles.matchName}>{item.first_name} {item.last_name.charAt(0)}.</Text>
        <Text style={styles.matchDetails}>{item.age} yaşında • {item.completed_tests_count} test tamamlandı</Text>
        <Text style={styles.matchScore}>Toplam Puan: {item.total_score}</Text>
      </View>
      <View style={styles.scoreDiffContainer}>
        <Text style={styles.scoreDiffLabel}>Fark</Text>
        <Text style={styles.scoreDiffValue}>
          {item.scoreDifference > 0 ? '+' : ''}{item.scoreDifference}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {showMatchedUsers ? (
        // Eşleşme listesi göster
        isMatchLoading ? (
          <View style={styles.centeredContainer}>
            <ActivityIndicator size="large" color="#1e88e5" />
            <Text style={styles.loadingText}>Eşleşen kullanıcılar yükleniyor...</Text>
          </View>
        ) : matchError ? (
          <View style={styles.centeredContainer}>
            <Text style={styles.errorText}>{matchError}</Text>
            <Button title="Yeniden Dene" onPress={onMatchRefresh} />
          </View>
        ) : (
          <FlatList
            data={matchedUsers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMatchedUser}
            ListHeaderComponent={<Text style={styles.header}>Size Yakın Puanlı Kullanıcılar</Text>}
            refreshControl={
              <RefreshControl
                refreshing={isMatchRefreshing}
                onRefresh={onMatchRefresh}
                colors={["#1e88e5"]}
              />
            }
            contentContainerStyle={matchedUsers.length === 0 ? styles.emptyListContent : {}}
            ListEmptyComponent={
              <View style={styles.centeredContainer}>
                <Text style={styles.noTestsText}>Henüz eşleşen kullanıcı bulunamadı.</Text>
              </View>
            }
          />
        )
      ) : (
        // Test listesi göster
        <FlatList
          data={tests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.testItemContainer}>
              <Text style={styles.testName}>{item.title}</Text>
              <Button title="Başla" onPress={() => handleStartTest(item.id, item.title)} color="#4caf50" />
            </View>
          )}
          ListHeaderComponent={<Text style={styles.header}>Aktif Testleriniz</Text>}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1e88e5"]} />
          }
          contentContainerStyle={tests.length === 0 ? styles.emptyListContent : {}}
        />
      )}
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
  // Eşleşme sistemi stilleri
  matchItemContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  matchInfo: {
    flex: 1,
    marginRight: 12,
  },
  matchName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  matchDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  matchScore: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e88e5',
  },
  scoreDiffContainer: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  scoreDiffLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  scoreDiffValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default HomeScreen; 