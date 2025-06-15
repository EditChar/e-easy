import { useState, useEffect, useCallback } from 'react';
import { 
  getUserScore, 
  getUserRank, 
  getUserTestHistory, 
  getLeaderboard 
} from '../api/apiClient';
import { 
  UserScore, 
  UserRank, 
  UserTestHistory, 
  LeaderboardEntry 
} from '../types/auth';

export const useProfileViewModel = () => {
  const [userScore, setUserScore] = useState<UserScore | null>(null);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [testHistory, setTestHistory] = useState<UserTestHistory | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    setError(null);
    try {
      const [scoreData, rankData, historyData] = await Promise.all([
        getUserScore().catch(() => null), // Hata durumunda null döndür
        getUserRank().catch(() => null),
        getUserTestHistory(1, 5).catch(() => null), // Son 5 test
      ]);

      setUserScore(scoreData);
      setUserRank(rankData);
      setTestHistory(historyData);
    } catch (err: any) {
      console.error('Kullanıcı verileri yüklenirken hata:', err);
      setError('Veriler yüklenirken bir sorun oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadLeaderboard = useCallback(async (limit: number = 10) => {
    try {
      const leaderboardData = await getLeaderboard(limit);
      setLeaderboard(leaderboardData);
    } catch (err: any) {
      console.error('Liderlik tablosu yüklenirken hata:', err);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadUserData(),
      loadLeaderboard()
    ]);
    setIsRefreshing(false);
  }, [loadUserData, loadLeaderboard]);

  useEffect(() => {
    loadUserData();
    loadLeaderboard();
  }, [loadUserData, loadLeaderboard]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const getStats = useCallback(() => {
    return {
      totalScore: userScore?.total_score || 0,
      completedTests: userScore?.completed_tests_count || 0,
      rank: userRank?.rank || null,
      averageScore: userScore?.completed_tests_count 
        ? Math.round((userScore.total_score || 0) / userScore.completed_tests_count) 
        : 0,
    };
  }, [userScore, userRank]);

  const getRecentTests = useCallback(() => {
    return testHistory?.testResponses || [];
  }, [testHistory]);

  return {
    // State
    userScore,
    userRank,
    testHistory,
    leaderboard,
    isLoading,
    isRefreshing,
    error,
    
    // Computed values
    stats: getStats(),
    recentTests: getRecentTests(),
    
    // Actions
    loadUserData,
    loadLeaderboard,
    onRefresh,
    formatDate,
  };
}; 