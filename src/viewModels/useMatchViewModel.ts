import { useState, useEffect, useCallback, useMemo } from 'react';
import { getMatchedUsers, getMatchDetails, getAvailableTests } from '../api/apiClient';
import { MatchedUser, MatchingEligibility, MatchResponse, MatchDetails, User } from '../types/auth';

interface UseMatchViewModelProps {
  user: User | null;
}

export const useMatchViewModel = ({ user }: UseMatchViewModelProps = { user: null }) => {
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [hasActiveTests, setHasActiveTests] = useState(false);

  // Kullanıcının ülke bilgisini takip et
  const userCountry = useMemo(() => user?.residence_country, [user?.residence_country]);

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
      // Kullanıcının ülke bilgisini API'ye gönderelim
      console.log('🌍 Eşleşme isteği gönderiliyor:', {
        userCountry: userCountry,
        userResidenceCountry: user?.residence_country,
        userId: user?.id,
        userName: user?.username
      });
      
      // Backend ülke filtrelemesi yapmadığı için tüm eşleşmeleri al
      const response = await getMatchedUsers();
      
      console.log('📋 APİ\'den gelen tüm eşleşmeler:', {
        totalMatches: response.matches.length,
        allMatches: response.matches.map(m => ({
          id: m.id,
          name: m.first_name || m.username,
          country: m.residence_country,
          city: m.residence_city
        }))
      });
      
      // Frontend'de ülke filtrelemesi yap
      let filteredMatches = response.matches;
      
      if (userCountry) {
        filteredMatches = response.matches.filter(match => 
          match.residence_country === userCountry
        );
        
        console.log('🔍 Ülke filtrelemesi uygulandı:', {
          userCountry: userCountry,
          filteredMatches: filteredMatches.length,
          filteredUsers: filteredMatches.map(m => ({
            id: m.id,
            name: m.first_name || m.username,
            country: m.residence_country,
            city: m.residence_city
          }))
        });
      }
      
      setMatchedUsers(filteredMatches);
      // Backend'den gelen user_info'yu da saklayabiliriz
      if (response.user_info) {
        setUserScore(response.user_info.total_score);
      }
      
      // Response'u filtrelenmiş matches ile güncelleyerek döndür
      return {
        ...response,
        matches: filteredMatches,
        matches_count: filteredMatches.length
      };
    } catch (err: any) {
      console.log('Eşleşen kullanıcılar yüklenirken hata:', err.message || err);
      setError('Eşleşmeler yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.');
      setMatchedUsers([]);
      throw err;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [checkActiveTests, userCountry]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setIsLoading(true);
    await loadMatchedUsers();
  }, [loadMatchedUsers]);

  const refreshMatches = useCallback(() => {
    setIsLoading(true);
    loadMatchedUsers();
  }, [loadMatchedUsers]);

  // Kullanıcının ülkesi değiştiğinde eşleşmeleri yenile
  useEffect(() => {
    if (userCountry) {
      console.log('Kullanıcının ülkesi değişti:', userCountry, 'Eşleşmeler yenileniyor...');
      refreshMatches();
    }
  }, [userCountry, refreshMatches]);

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