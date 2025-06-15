/**
 * API'den dönen kullanıcı objesini temsil eder.
 * Örnek koddaki UserProfile ile senkronize edildi.
 */
export interface User {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    age: number;
    country: string;
    role: string;
    gender?: 'male' | 'female';
    residenceCountry?: string | null;
    residenceCity?: string | null;
    languages?: string[] | null;
    height?: number | null;
    weight?: number | null;
    isAdditionalInfoRequired?: boolean;
    created_at?: string;
    avatarUrl?: string | null;
}

/**
 * Başarılı bir kimlik doğrulama (login/signup) isteği sonrası API'den dönen yanıtı temsil eder.
 */
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

/**
 * Yeni kullanıcı kayıt formundan gelen verileri temsil eder.
 * API'nin beklediği `signup` payload'ı ile eşleşmelidir.
 */
export type SignUpData = Omit<User, 'id' | 'role'> & {
    password?: string;
    gender?: 'male' | 'female';
};

/**
 * Kullanıcının ek bilgilerini güncellemek için kullanılan veri tipi.
 */
export interface UserProfileUpdateData {
    residenceCountry?: string;
    residenceCity?: string;
    languages?: string[];
    height?: number;
    weight?: number;
}

/**
 * Test puanlama sistemi için type'lar
 */
export interface TestResponse {
  question_id: number;
  answer_id: number;
}

export interface TestResult {
  testResponse: {
    id: number;
    user_id: number;
    test_id: number;
    test_score: number;
    completed_at: string;
  };
  questionResponses: Array<{
    id: number;
    user_id: number;
    question_id: number;
    answer_id: number;
    response_score: number;
    created_at: string;
  }>;
  totalScore: number;
}

export interface UserScore {
  id: number;
  user_id: number;
  total_score: number;
  completed_tests_count: number;
  last_updated: string;
}

export interface UserTestHistory {
  testResponses: Array<{
    id: number;
    user_id: number;
    test_id: number;
    test_score: number;
    completed_at: string;
    test_title: string;
    test_description: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}

export interface LeaderboardEntry {
  user_id: number;
  total_score: number;
  completed_tests_count: number;
  username: string;
  first_name: string;
  last_name: string;
}

export interface UserRank {
  rank: number | null;
  total_score: number;
  completed_tests_count: number;
} 