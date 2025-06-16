import { useState, useCallback } from 'react';

// Profil sayfası artık test istatistikleri göstermediği için basitleştirilmiş ViewModel
export const useProfileViewModel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Genel amaçlı yükleme durumu yönetimi
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Gelecekte profil ile ilgili başka veriler yüklenebilir
      await new Promise(resolve => setTimeout(resolve, 500)); // Placeholder
    } catch (err: any) {
      console.error('Profil verileri yüklenirken hata:', err);
      setError('Veriler yüklenirken bir sorun oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    isLoading,
    error,
    
    // Actions
    loadData,
  };
}; 