import { useState, useEffect, useCallback, useMemo } from 'react';
import { getMatchedUsers, getMatchDetails, getAvailableTests } from '../api/apiClient';
import { MatchedUser, MatchingEligibility, MatchResponse, MatchDetails, User } from '../types/auth';

interface FilterOptions {
  minAge?: number;
  maxAge?: number;
}

interface UseMatchViewModelProps {
  user: User | null;
}

export const useMatchViewModel = ({ user }: UseMatchViewModelProps = { user: null }) => {
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<MatchedUser[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [hasActiveTests, setHasActiveTests] = useState(false);

  // Kullanıcının ülke ve şehir bilgisini takip et
  const userCountry = useMemo(() => user?.residence_country, [user?.residence_country]);
  const userCity = useMemo(() => user?.residence_city, [user?.residence_city]);

  // Filtreleme fonksiyonu
  const applyFilters = useCallback((users: MatchedUser[], filters: FilterOptions): MatchedUser[] => {
    let filtered = users;

    // Yaş filtresi
    if (filters.minAge !== undefined || filters.maxAge !== undefined) {
      filtered = filtered.filter(user => {
        if (!user.age) return false; // Yaş bilgisi olmayan kullanıcıları filtrele
        
        const userAge = user.age;
        let passesAgeFilter = true;

        if (filters.minAge !== undefined && userAge < filters.minAge) {
          passesAgeFilter = false;
        }

        if (filters.maxAge !== undefined && userAge > filters.maxAge) {
          passesAgeFilter = false;
        }

        return passesAgeFilter;
      });
    }

    return filtered;
  }, []);

  // Filtreleri uygula ve sonuçları güncelle
  const updateFilteredUsers = useCallback((users: MatchedUser[], filters: FilterOptions) => {
    const filtered = applyFilters(users, filters);
    setFilteredUsers(filtered);
    console.log('🔍 Filtreler uygulandı:', {
      totalUsers: users.length,
      filteredUsers: filtered.length,
      filters
    });
  }, [applyFilters]);

  // Filter değişikliklerini handle et
  const handleFiltersChange = useCallback((filters: FilterOptions) => {
    setActiveFilters(filters);
    updateFilteredUsers(matchedUsers, filters);
  }, [matchedUsers, updateFilteredUsers]);

  const checkActiveTests = useCallback(async () => {
    try {
      const tests = await getAvailableTests();
      setHasActiveTests(tests && tests.length > 0);
    } catch (error) {
      console.error('Active tests kontrol hatası:', error);
      setHasActiveTests(false);
    }
  }, []);

  const refreshMatches = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await checkActiveTests();

      const response = await getMatchedUsers();
      
      if (response?.matches) {
        // Kullanıcının ülke ve şehir bilgisini API'ye gönderelim
        console.log('🌍 Eşleşme filtrelemesi:', {
          userCountry: userCountry,
          userCity: userCity
        });
        
        // API'den gelen tüm sonuçları filtrele (ülke + şehir bazında)
        let filteredMatches = response.matches;
        
        if (userCountry) {
          // Önce ülkeye göre filtrele
          filteredMatches = response.matches.filter(match => 
            match.residence_country === userCountry
          );
          
          // Şehir bilgisi de varsa şehre göre de filtrele
          if (userCity) {
            filteredMatches = filteredMatches.filter(match => 
              match.residence_city === userCity
            );
            
            console.log('🏙️ Ülke + Şehir filtrelemesi tamamlandı:', {
              userLocation: `${userCity}, ${userCountry}`,
              totalMatches: response.matches.length,
              filteredMatches: filteredMatches.length
            });
          } else {
            console.log('🔍 Ülke filtrelemesi tamamlandı:', {
              userCountry: userCountry,
              totalMatches: response.matches.length,
              filteredMatches: filteredMatches.length
            });
          }
        }
        
        setMatchedUsers(filteredMatches);
        // Filtreleri de uygula
        updateFilteredUsers(filteredMatches, activeFilters);
        
        // Backend'den gelen user_info'yu da saklayabiliriz
        if (response.user_info) {
          setUserScore(response.user_info.total_score || 0);
        }
        
        // API response'u orijinal formatta return et
        return {
          ...response,
          matches: filteredMatches,
          matches_count: filteredMatches.length
        };
      } else {
        console.log('⚠️ API\'den boş yanıt geldi');
        setMatchedUsers([]);
        setFilteredUsers([]);
        return null;
      }
    } catch (err: any) {
      console.error('🔴 Eşleşme yükleme hatası:', err);
      const errorMessage = err?.message || 'Eşleşmeler yüklenirken bir hata oluştu';
      setError(errorMessage);
      
      // 400/404 hataları için özel işlem - bunlar debug warnings değil normal durum
      if (err?.response?.status === 400 || err?.response?.status === 404) {
        console.log('ℹ️ Henüz eşleşme bulunamadı (normal durum)');
        setMatchedUsers([]);
        setFilteredUsers([]);
        setError(null); // Bu durumda error gösterme
      }
      
      return null;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [checkActiveTests, userCountry, userCity]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setIsLoading(true);
    await refreshMatches();
  }, [refreshMatches]);

  // Kullanıcının ülkesi veya şehri değiştiğinde eşleşmeleri yenile
  useEffect(() => {
    if (userCountry) {
      console.log('Kullanıcının konumu değişti:', {
        country: userCountry,
        city: userCity
      }, 'Eşleşmeler yenileniyor...');
      refreshMatches();
    }
  }, [userCountry, userCity, refreshMatches]);

  useEffect(() => {
    refreshMatches();
  }, [refreshMatches]);

  return {
    // State
    matchedUsers: filteredUsers, // Filtrelenmiş kullanıcıları döndür
    allMatches: matchedUsers, // Filtrelenmemiş tüm eşleşmeler
    activeFilters,
    isLoading,
    error,
    isRefreshing,
    userScore,
    hasActiveTests,
    
    // Actions
    onRefresh,
    checkActiveTests,
    applyFilters: handleFiltersChange,
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