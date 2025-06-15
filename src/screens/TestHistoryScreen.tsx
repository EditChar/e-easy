import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getUserTestHistory, getTestResponseDetails } from '../api/apiClient';
import { UserTestHistory } from '../types/auth';

const TestHistoryScreen = () => {
  const navigation = useNavigation();
  const [testHistory, setTestHistory] = useState<UserTestHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadTestHistory = async (page: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const history = await getUserTestHistory(page, 20);
      
      if (page === 1 || refresh) {
        setTestHistory(history);
      } else {
        // Sayfalama - mevcut verilere ekleme
        setTestHistory(prev => prev ? {
          ...history,
          testResponses: [...prev.testResponses, ...history.testResponses]
        } : history);
      }
      
      setCurrentPage(page);
    } catch (error) {
      console.error('Test geçmişi yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadTestHistory();
  }, []);

  const onRefresh = () => {
    loadTestHistory(1, true);
  };

  const loadMore = () => {
    if (testHistory && currentPage < testHistory.pagination.totalPages && !isLoadingMore) {
      loadTestHistory(currentPage + 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTestItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.testItem}
      onPress={() => {
        // Test detaylarına gitmek için - opsiyonel
        // navigation.navigate('TestDetails', { testResponseId: item.id });
      }}
    >
      <View style={styles.testInfo}>
        <Text style={styles.testTitle}>{item.test_title}</Text>
        {item.test_description && (
          <Text style={styles.testDescription}>{item.test_description}</Text>
        )}
        <Text style={styles.testDate}>{formatDate(item.completed_at)}</Text>
      </View>
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreValue}>{item.test_score}</Text>
        <Text style={styles.scoreLabel}>puan</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#1e88e5" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Henüz hiç test tamamlamadınız.</Text>
      <Text style={styles.emptySubText}>İlk testinizi tamamlayın ve burada görün!</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e88e5" />
        <Text style={styles.loadingText}>Test geçmişi yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Test Geçmişim</Text>
        {testHistory && (
          <Text style={styles.headerSubtitle}>
            Toplam {testHistory.pagination.totalCount} test
          </Text>
        )}
      </View>
      
      <FlatList
        data={testHistory?.testResponses || []}
        renderItem={renderTestItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  testItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  testInfo: {
    flex: 1,
    marginRight: 16,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  testDate: {
    fontSize: 12,
    color: '#999',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e88e5',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default TestHistoryScreen; 