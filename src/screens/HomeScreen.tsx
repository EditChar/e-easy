import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Button, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { getAvailableTests } from '../api/apiClient';
import { User, MatchedUser } from '../types/auth';
import { useMatchViewModel } from '../viewModels/useMatchViewModel';
import FilterModal from '../components/FilterModal';

// Test verisi için tip tanımı (API yanıtına göre güncellenebilir)
interface Test {
  id: string;
  title: string; // API'den gelen test adı
  // description?: string;
  // questionCount?: number;
  // Diğer olası alanlar
}

// Filter options interface
interface FilterOptions {
  minAge?: number;
  maxAge?: number;
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

  // Filter modal için state
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Eşleşme sistemi için ViewModel
  const {
    matchedUsers,
    allMatches,
    activeFilters,
    isLoading: isMatchLoading,
    error: matchError,
    isRefreshing: isMatchRefreshing,
    onRefresh: onMatchRefresh,
    userScore,
    hasActiveTests,
    applyFilters,
  } = useMatchViewModel({ user });

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
      // Match sistemi de yenilensin
      onMatchRefresh();
    }, [onMatchRefresh])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTests();
    // Match sistemi de yenilensin
    onMatchRefresh();
  }, [onMatchRefresh]);

  const handleStartTest = (testId: string, testName: string) => {
    navigation.navigate('Test', { testId, testName });
  };

  // Filter modal fonksiyonları
  const handleOpenFilterModal = () => {
    setFilterModalVisible(true);
  };

  const handleCloseFilterModal = () => {
    setFilterModalVisible(false);
  };

  const handleApplyFilters = (filters: FilterOptions) => {
    applyFilters(filters);
  };

  // Aktif filtre sayısını hesapla
  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.minAge !== undefined || activeFilters.maxAge !== undefined) {
      count++;
    }
    return count;
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
    headerContainer: {
      alignItems: 'center',
      marginBottom: 10,
    },
    subHeader: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      marginTop: 5,
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
      flex: 1,
      marginRight: 10,
    },
    emptyListContent: {
      flexGrow: 1,
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
    userScoreText: {
      fontSize: 14,
      color: '#1e88e5',
      textAlign: 'center',
      marginTop: 5,
      fontWeight: '500',
    },
    matchesContainer: {
      flex: 1,
      padding: 20,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#263238',
      marginBottom: 10,
    },
    sectionSubtitle: {
      fontSize: 16,
      color: '#666',
      marginBottom: 20,
    },
    listContainer: {
      padding: 10,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 18,
      color: '#555',
      marginBottom: 10,
    },
    emptySubText: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
    },
    testsContainer: {
      flex: 1,
      padding: 20,
    },
    testItem: {
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
    testTitle: {
      fontSize: 18,
      fontWeight: '500',
      color: '#333',
      flex: 1,
    },
    startTestText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#1e88e5',
    },
    userScoreInfo: {
      fontSize: 14,
      color: '#1e88e5',
      textAlign: 'center',
      marginTop: 5,
      fontWeight: '500',
    },
    matchLocation: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
    },
    emptyHint: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
      marginTop: 5,
    },
    locationInfo: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
      marginBottom: 20,
    },
    // Filter button stilleri
    headerWithFilter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 10,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1e88e5',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    filterButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 5,
    },
    filterBadge: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: '#f44336',
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
    },
    titleContainer: {
      flex: 1,
    },
  });

  if (isLoading && !refreshing) { // İlk yükleme ve refresh değilse
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#1e88e5" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
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

  // Karar verme mantığı: Önce match sisteminden gelen hasActiveTests'i kontrol et
  // Eğer ViewModel'dan aktif test bilgisi geliyorsa ona göre karar ver
  // Fallback olarak da local tests state'ini kullan
  const shouldShowTests = hasActiveTests || (tests.length > 0);
  const showMatchedUsers = !shouldShowTests;

  const renderMatchedUser = ({ item }: { item: MatchedUser }) => {
    const navigateToMatchDetails = () => {
      navigation.navigate('MatchDetails', { 
        matchUserId: item.id,
        matchUser: item 
      });
    };
    // Avatar seçimi - önce kendi avatar'ı, yoksa cinsiyete göre varsayılan
    const getGenderBasedAvatar = () => {
      if (item.avatarUrl) {
        return { uri: item.avatarUrl };
      }
      // Backend'den gelen cinsiyet bilgisine göre avatar seçimi
      return item.gender === 'female' 
        ? require('../assets/images/female.jpg')
        : require('../assets/images/male.jpg');
    };

    // Cinsiyet emoji'si
    const getGenderEmoji = () => {
      return item.gender === 'female' ? '♀️' : '♂️';
    };

    // Puan farkına göre renk belirleme
    const getScoreDiffColor = () => {
      const scoreDiff = item.score_difference || item.scoreDifference;
      if (scoreDiff <= 50) return '#4caf50'; // Yeşil - Çok yakın
      if (scoreDiff <= 100) return '#ff9800'; // Turuncu - Orta
      return '#f44336'; // Kırmızı - Uzak
    };

    return (
      <TouchableOpacity style={styles.matchItemContainer} onPress={navigateToMatchDetails}>
        <Image
          source={getGenderBasedAvatar()}
          style={styles.matchAvatar}
        />
        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>
            {getGenderEmoji()} {item.first_name || item.username} {item.last_name ? item.last_name.charAt(0) + '.' : ''}
          </Text>
          <Text style={styles.matchDetails}>
            {item.age ? `${item.age} yaşında` : ''}{item.age && item.completed_tests_count ? ' • ' : ''}{item.completed_tests_count ? `${item.completed_tests_count} test tamamlandı` : ''}
          </Text>
          {(item.residence_country || item.residence_city) && (
            <Text style={styles.matchLocation}>
              📍 {item.residence_city ? `${item.residence_city}, ` : ''}{item.residence_country || ''}
            </Text>
          )}
          <Text style={styles.matchScore}>Toplam Puan: {item.total_score}</Text>
        </View>
        <View style={styles.scoreDiffContainer}>
          <Text style={styles.scoreDiffLabel}>Puan Farkı</Text>
          <Text style={[
            styles.scoreDiffValue,
            { color: getScoreDiffColor() }
          ]}>
            {item.score_difference || item.scoreDifference} puan
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {showMatchedUsers ? (
        // Eşleşme listesi göster
        isMatchLoading ? (
          <View style={styles.centeredContainer}>
            <ActivityIndicator size="large" color="#1e88e5" />
            <Text style={styles.loadingText}>Eşleşmeler yükleniyor...</Text>
          </View>
        ) : matchError ? (
          <View style={styles.centeredContainer}>
            <Text style={styles.errorText}>{matchError}</Text>
            <Button title="Yeniden Dene" onPress={onMatchRefresh} />
          </View>
        ) : (
          // Direkt eşleşme listesini göster - uygunluk kontrolü kaldırıldı
          <View style={styles.matchesContainer}>
            <View style={styles.headerWithFilter}>
              <View style={styles.titleContainer}>
                <Text style={styles.sectionTitle}>💝 Senin için bulunan eşleşmeler</Text>
              </View>
              <TouchableOpacity style={styles.filterButton} onPress={handleOpenFilterModal}>
                <Text>🔍</Text>
                <Text style={styles.filterButtonText}>Filtrele</Text>
                {getActiveFilterCount() > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            
            <Text style={styles.sectionSubtitle}>
              {user?.residence_country && user?.residence_city 
                ? `${user.residence_city}, ${user.residence_country} konumuna göre eşleşmeler`
                : user?.residence_country 
                  ? `${user.residence_country} konumuna göre eşleşmeler`
                  : 'Eşleşmeler'
              }
            </Text>
            
            <Text style={styles.userScoreInfo}>
              Toplam puanın: {userScore} • {matchedUsers.length} eşleşme bulundu
              {getActiveFilterCount() > 0 ? ` (${allMatches.length} toplam)` : ''}
            </Text>
            <FlatList
              data={matchedUsers}
              renderItem={renderMatchedUser}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isMatchRefreshing}
                  onRefresh={onMatchRefresh}
                  colors={['#1e88e5']}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>🔍 Henüz eşleşme bulunamadı</Text>
                  <Text style={styles.emptySubText}>
                    {user?.residence_country && user?.residence_city
                      ? `${user.residence_city}, ${user.residence_country} konumunda henüz eşleşme bulunamadı.`
                      : user?.residence_country 
                        ? `${user.residence_country} konumunda henüz eşleşme bulunamadı.`
                        : 'Henüz eşleşme bulunamadı.'
                    }
                  </Text>
                  <Text style={styles.emptySubText}>
                    Farklı bir konuma taşınırsa eşleşmeleriniz otomatik güncellenecektir.
                  </Text>
                  <Text style={styles.emptyHint}>
                    💡 Profil sayfasından konum bilgilerinizi kontrol edebilirsiniz.
                  </Text>
                </View>
              }
            />
          </View>
        )
      ) : (
        // Test listesi göster
        <View style={styles.testsContainer}>
          <Text style={styles.sectionTitle}>📋 Tamamlamanız Gereken Testler</Text>
          <Text style={styles.sectionSubtitle}>
            Eşleşme için aşağıdaki testleri tamamlamanız gerekmektedir.
          </Text>
          {(user?.residence_country || user?.residence_city) && (
            <Text style={styles.locationInfo}>
              📍 Testler tamamlandığında {user?.residence_city && user?.residence_country 
                ? `${user.residence_city}, ${user.residence_country}`
                : user?.residence_country || user?.residence_city
              } konumundaki eşleşmelerinizi görebileceksiniz.
            </Text>
          )}
          <FlatList
            data={tests}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.testItem}
                onPress={() => handleStartTest(item.id, item.title)}
              >
                <Text style={styles.testTitle}>{item.title}</Text>
                <Text style={styles.startTestText}>Teste Başla →</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#1e88e5']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>🎉 Tüm testler tamamlandı!</Text>
                <Text style={styles.emptySubText}>
                  Eşleşmeler için ana ekrana dönebilirsiniz.
                </Text>
              </View>
            }
          />
        </View>
      )}
      
      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={handleCloseFilterModal}
        onApplyFilters={handleApplyFilters}
        currentFilters={activeFilters}
      />
    </View>
  );
};

export default HomeScreen; 