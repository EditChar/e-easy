// src/api/apiClient.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { getAccessToken, getRefreshToken, storeTokens, clearTokens } from '../utils/authStorage';
import API_BASE_URL from '../config/apiConfig'; // API_BASE_URL'i apiConfig.ts'den import et
import { AuthResponse, SignUpData, User, UserProfileUpdateData } from '../types/auth'; // AuthResponse ve SignUpData'yı import et
import { Asset } from 'react-native-image-picker'; // Asset tipini import et
import { TestResponse, TestResult, UserScore, UserRank, UserTestHistory, LeaderboardEntry } from '../types/auth'; // Test puanlama type'larını import et

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// İstek Interceptor'ı: Her isteğe accessToken ekler
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Yanıt Interceptor'ı: 401 hatası alındığında token yenileme
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Eğer zaten bir refresh işlemi devam ediyorsa, bu isteği kuyruğa al
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(token => {
          if (originalRequest.headers) originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return apiClient(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true; // Tekrar denemeyi işaretle
      isRefreshing = true;

      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        console.log('No refresh token available, logging out.');
        // Kullanıcıyı logout yap ve login ekranına yönlendir
        await clearTokens();
        // RootNavigation.navigate('Login'); // Veya context'e göre navigasyon
        processQueue(error, null);
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        console.log('Attempting to refresh token...');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        if (!newAccessToken) {
            throw new Error("New access token not received");
        }

        await storeTokens(newAccessToken, newRefreshToken || refreshToken); // Eğer yeni refresh token gelmezse eskisini kullan
        console.log('Token refreshed successfully.');

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }
        processQueue(null, newAccessToken);
        isRefreshing = false;
        return apiClient(originalRequest); // Orijinal isteği yeni token ile tekrarla
      } catch (refreshError: any) {
        console.error('Error refreshing token:', refreshError.response?.data || refreshError.message);
        await clearTokens(); // Refresh token da geçersizse, token'ları temizle
        // Kullanıcıyı login ekranına yönlendir
        // RootNavigation.navigate('Login'); // Veya context'e göre navigasyon
        processQueue(refreshError as AxiosError, null);
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// API Çağrıları

export const loginUser = async (credentials: { username: string; password: any; }): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
};

export const signupUser = async (userData: SignUpData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/signup', userData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
};

export const getTests = async () => {
  try {
    const response = await apiClient.get('/tests');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
};

export const getQuestionsForTest = async (testId: string) => {
  try {
    // API yanıtındaki options içindeki text -> answer_text olarak güncellendi
    const response = await apiClient.get<{ id: string, question_text: string, options: { id: string, answer_text: string }[] }[]>(
      `/tests/${testId}/questions`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
};

// Test puanlama sistemi API çağrıları
export const submitTestResponse = async (testId: number, responses: TestResponse[]): Promise<TestResult> => {
  try {
    const response = await apiClient.post<TestResult>(`/test-responses/${testId}/submit`, { responses });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return Promise.reject(error.response.data);
    }
    console.error("[API] Test cevapları gönderilirken hata:", error);
    return Promise.reject(error);
  }
};

export const getUserScore = async (): Promise<UserScore> => {
  try {
    const response = await apiClient.get<UserScore>('/test-responses/score');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return Promise.reject(error.response.data);
    }
    console.error("[API] Kullanıcı puanı alınırken hata:", error);
    return Promise.reject(error);
  }
};

export const getUserRank = async (): Promise<UserRank> => {
  try {
    const response = await apiClient.get<UserRank>('/test-responses/rank');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return Promise.reject(error.response.data);
    }
    console.error("[API] Kullanıcı sıralaması alınırken hata:", error);
    return Promise.reject(error);
  }
};

export const getUserTestHistory = async (page: number = 1, limit: number = 10): Promise<UserTestHistory> => {
  try {
    const response = await apiClient.get<UserTestHistory>(`/test-responses?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return Promise.reject(error.response.data);
    }
    console.error("[API] Test geçmişi alınırken hata:", error);
    return Promise.reject(error);
  }
};

export const getLeaderboard = async (limit: number = 10): Promise<LeaderboardEntry[]> => {
  try {
    const response = await apiClient.get<LeaderboardEntry[]>(`/test-responses/leaderboard?limit=${limit}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return Promise.reject(error.response.data);
    }
    console.error("[API] Liderlik tablosu alınırken hata:", error);
    return Promise.reject(error);
  }
};

export const getTestResponseDetails = async (testResponseId: number): Promise<{
  testResponse: any;
  questionResponses: any[];
}> => {
  try {
    const response = await apiClient.get(`/test-responses/${testResponseId}/details`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return Promise.reject(error.response.data);
    }
    console.error("[API] Test detayları alınırken hata:", error);
    return Promise.reject(error);
  }
};

// Eski test tamamlama fonksiyonu (eski uyumluluk için bırakıldı)
export const submitTestResults = async (testId: string | number, answers: any) => {
  try {
    console.log(`[API] Test ID ${testId} için sonuçlar gönderiliyor:`, answers);
    // submitTestResponse kullanımına yönlendirme
    const responses: TestResponse[] = answers.map((answer: any) => ({
      question_id: parseInt(answer.questionId),
      answer_id: parseInt(answer.answerId),
    }));
    
    const result = await submitTestResponse(Number(testId), responses);
    return { success: true, message: 'Test başarıyla tamamlandı.', result };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return Promise.reject(error.response.data);
    }
    console.error("[API] Test sonuçları gönderilirken hata:", error);
    return Promise.reject(error);
  }
};

// --- YENİ VERİ YAPILARI ---

export interface Answer {
  id: number | string;
  answer_text: string;
  score?: number; // Cevap puanı (backend'den gelecek)
  // Gelecekte eklenebilecek diğer alanlar, örn: is_correct
}

export interface Question {
  id: number | string;
  question_text: string;
  answers?: Answer[]; // API'den gelen cevaplar. `options` yerine `answers` kullanılıyor.
}

export interface Test {
    id: string;
    name: string;
    description?: string;
}

export interface TestDetails extends Test {
  questions?: Question[];
  creator?: { username: string; id: number | string } | null;
}

// --- API FONKSİYONLARI ---

// YENİ FONKSİYON: Bir testin tüm detaylarını (soru ve cevaplar dahil) çeker.
export const fetchTestWithQuestionsAndAnswers = async (testId: string | number): Promise<TestDetails> => {
  try {
    const response = await apiClient.get<TestDetails>(`/tests/${testId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching test ${testId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Kullanıcı profil bilgilerini günceller.
 * @param profileData Güncellenecek profil verileri.
 * @returns Güncellenmiş kullanıcı bilgisi.
 */
export const updateUserProfile = async (profileData: UserProfileUpdateData): Promise<User> => {
    try {
        // Sunucunun beklediği gibi /users/profile endpoint'ine PUT isteği gönderiyoruz.
        // Yanıtın { user: User } formatında geldiğini varsayarak güncelliyoruz.
        const response = await apiClient.put<{ user: User }>('/users/profile', profileData);
        return response.data.user; // Doğrudan kullanıcı nesnesini döndür
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            // Sunucudan gelen spesifik hata mesajını fırlat
            throw error.response.data;
        }
        // Diğer beklenmedik hataları fırlat
        throw error;
    }
};

/**
 * Kullanıcının avatar fotoğrafını sunucuya yükler.
 * @param photo Seçilen fotoğraf varlığı (react-native-image-picker'dan).
 * @returns Güncellenmiş kullanıcı bilgisi.
 */
export const uploadAvatar = async (photo: Asset): Promise<User> => {
  const formData = new FormData();

  formData.append('avatar', {
    uri: photo.uri,
    name: photo.fileName,
    type: photo.type,
  });

  try {
    const response = await apiClient.post<{ user: User }>('/users/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.user;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw error;
  }
};

/**
 * Mevcut giriş yapmış kullanıcının profil bilgilerini getirir.
 * @returns Kullanıcı bilgisi.
 */
export const getMe = async (): Promise<User> => {
    try {
        // Sunucunun /users/profile endpoint'ine GET isteği gönderiyoruz.
        // API'nin doğrudan kullanıcı nesnesini döndürdüğü varsayılıyor.
        const response = await apiClient.get<User>('/users/profile');
        return response.data; // response.data.user yerine doğrudan response.data döndürülür.
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            // Sunucudan gelen spesifik hata mesajını fırlat
            throw error.response.data;
        }
        // Diğer beklenmedik hataları fırlat
        throw error;
    }
};

export default apiClient;