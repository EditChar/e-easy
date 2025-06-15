import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { getLeaderboard } from '../api/apiClient';
import { LeaderboardEntry } from '../types/auth';

const LeaderboardScreen = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLeaderboard = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const data = await getLeaderboard(50); // Top 50
      setLeaderboard(data);
    } catch (error) {
      console.error('Liderlik tablosu yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const onRefresh = () => {
    loadLeaderboard(true);
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const position = index + 1;
    const isTopThree = position <= 3;
    
    const getPositionEmoji = (pos: number) => {
      switch (pos) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return `${pos}.`;
      }
    };

    const getPositionColor = (pos: number) => {
      switch (pos) {
        case 1: return '#FFD700';
        case 2: return '#C0C0C0';
        case 3: return '#CD7F32';
        default: return '#666';
      }
    };

    return (
      <View style={[
        styles.leaderboardItem, 
        isTopThree && styles.topThreeItem
      ]}>
        <View style={styles.positionContainer}>
          <Text style={[
            styles.position,
            { color: getPositionColor(position) },
            isTopThree && styles.topThreePosition
          ]}>
            {getPositionEmoji(position)}
          </Text>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={[styles.userName, isTopThree && styles.topThreeUserName]}>
            {item.first_name} {item.last_name}
          </Text>
          <Text style={styles.userStats}>
            @{item.username} • {item.completed_tests_count} test
          </Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, isTopThree && styles.topThreeScore]}>
            {item.total_score}
          </Text>
          <Text style={styles.scoreLabel}>puan</Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Henüz liderlik tablosu verisi yok.</Text>
      <Text style={styles.emptySubText}>İlk testinizi tamamlayın ve sıralamaya girin!</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e88e5" />
        <Text style={styles.loadingText}>Liderlik tablosu yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Liderlik Tablosu</Text>
        <Text style={styles.headerSubtitle}>En yüksek puanlı kullanıcılar</Text>
      </View>
      
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.user_id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
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
    backgroundColor: '#1e88e5',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#b3d9ff',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  leaderboardItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  topThreeItem: {
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  positionContainer: {
    width: 50,
    alignItems: 'center',
  },
  position: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  topThreePosition: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  topThreeUserName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userStats: {
    fontSize: 14,
    color: '#666',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e88e5',
  },
  topThreeScore: {
    fontSize: 24,
    color: '#FFD700',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
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

export default LeaderboardScreen; 