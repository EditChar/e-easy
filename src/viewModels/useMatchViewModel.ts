import { useState, useEffect, useCallback } from 'react';
import { getMatchedUsers, getMatchDetails } from '../api/apiClient';
import { MatchedUser, MatchingEligibility, MatchResponse, MatchDetails } from '../types/auth';

export const useMatchViewModel = () => {
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userScore, setUserScore] = useState(0);

  const loadMatchedUsers = useCallback(async () => {
    setError(null);
    try {
      const response = await getMatchedUsers();
      setMatchedUsers(response.matches);
      // Backend'den gelen user_info'yu da saklayabiliriz
      if (response.user_info) {
        setUserScore(response.user_info.total_score);
      }
      return response;
    } catch (err: any) {
      console.error('Eşleşen kullanıcılar yüklenirken hata:', err);
      setError('Eşleşmeler yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.');
      setMatchedUsers([]);
      throw err;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

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
    
    // Actions
    loadMatchedUsers,
    onRefresh,
    refreshMatches,
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