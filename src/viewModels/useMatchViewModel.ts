import { useState, useEffect, useCallback } from 'react';
import { getMatchedUsers, getMatchDetails, getAvailableTests } from '../api/apiClient';
import { MatchedUser, MatchingEligibility, MatchResponse, MatchDetails } from '../types/auth';

export const useMatchViewModel = () => {
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [hasActiveTests, setHasActiveTests] = useState(false);

  const checkActiveTests = useCallback(async () => {
    try {
      const tests = await getAvailableTests();
      const hasTests = tests && tests.length > 0;
      setHasActiveTests(hasTests);
      return hasTests;
    } catch (err: any) {
      console.log('Aktif testler kontrol edilirken hata:', err.message || err);
      // Test kontrolünde hata olursa, eşleşme isteği yapmayı deneyelim
      setHasActiveTests(false);
      return false;
    }
  }, []);

  const loadMatchedUsers = useCallback(async () => {
    setError(null);
    
    // Önce aktif test olup olmadığını kontrol et
    const hasTests = await checkActiveTests();
    if (hasTests) {
      // Aktif test varsa eşleşme isteği yapmaya gerek yok
      console.log('Kullanıcının aktif testleri var, test listesi gösterilecek');
      setIsLoading(false);
      setIsRefreshing(false);
      return {
        message: 'Aktif testler mevcut',
        user_info: { total_score: 0, completed_tests: 0, total_available_tests: 0 },
        matches: [],
        matches_count: 0
      };
    }

    try {
      const response = await getMatchedUsers();
      setMatchedUsers(response.matches);
      // Backend'den gelen user_info'yu da saklayabiliriz
      if (response.user_info) {
        setUserScore(response.user_info.total_score);
      }
      return response;
    } catch (err: any) {
      console.log('Eşleşen kullanıcılar yüklenirken hata:', err.message || err);
      setError('Eşleşmeler yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.');
      setMatchedUsers([]);
      throw err;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [checkActiveTests]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setIsLoading(true);
    await loadMatchedUsers();
  }, [loadMatchedUsers]);

  const refreshMatches = useCallback(() => {
    setIsLoading(true);
    loadMatchedUsers();
  }, [loadMatchedUsers]);

  useEffect(() => {
    refreshMatches();
  }, [refreshMatches]);

  return {
    // State
    matchedUsers,
    isLoading,
    error,
    isRefreshing,
    userScore,
    hasActiveTests,
    
    // Actions
    loadMatchedUsers,
    onRefresh,
    refreshMatches,
    checkActiveTests,
  };
};

// Match details için ayrı hook
export const useMatchDetailsViewModel = (matchUserId: number) => {
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMatchDetails = useCallback(async () => {
    if (!matchUserId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const details = await getMatchDetails(matchUserId);
      setMatchDetails(details);
      return details;
    } catch (err: any) {
      console.error('Eşleşme detayları yüklenirken hata:', err);
      setError('Eşleşme detayları yüklenirken bir sorun oluştu.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [matchUserId]);

  useEffect(() => {
    if (matchUserId) {
      loadMatchDetails();
    }
  }, [matchUserId, loadMatchDetails]);

  return {
    matchDetails,
    isLoading,
    error,
    loadMatchDetails,
    refreshMatchDetails: loadMatchDetails,
  };
}; 