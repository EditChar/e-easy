import { useState, useEffect, useCallback } from 'react';
import { getMatchedUsers } from '../api/apiClient';
import { MatchedUser } from '../types/auth';

export const useMatchViewModel = () => {
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMatchedUsers = useCallback(async () => {
    setError(null);
    try {
      const users = await getMatchedUsers();
      setMatchedUsers(users);
    } catch (err: any) {
      console.error('Eşleşen kullanıcılar yüklenirken hata:', err);
      setError('Eşleşen kullanıcılar yüklenirken bir sorun oluştu.');
      setMatchedUsers([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
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
    
    // Actions
    loadMatchedUsers,
    onRefresh,
    refreshMatches,
  };
}; 