/**
 * API'den dönen kullanıcı objesini temsil eder.
 * Örnek koddaki UserProfile ile senkronize edildi.
 */
export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    age: number;
    country: string;
    role: string;
    gender?: 'male' | 'female';
    residence_country?: string | null;
    residence_city?: string | null;
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
    residence_country?: string;
    residence_city?: string;
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

export interface UserRank {
  rank: number | null;
  total_score: number;
  completed_tests_count: number;
}

// Eşleşme sistemi için type
export interface MatchedUser {
  id: number;
  first_name: string;
  last_name: string;
  total_score: number;
  completed_tests_count: number;
  avatarUrl?: string | null;
  age: number;
  scoreDifference: number; // Kullanıcının kendi puanı ile arasındaki fark
} 