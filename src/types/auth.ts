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
  username: string;
  first_name?: string;
  last_name?: string;
  age?: number;
  residence_country?: string;
  residence_city?: string;
  gender?: 'male' | 'female';
  avatarUrl?: string | null;
  avatar_url?: string; // Backend compatibility
  languages?: string[];
  height?: number;
  weight?: number;
  total_score: number;
  completed_tests_count: number;
  score_difference: number; // Backend'den gelen puan farkı
  compatibility_percentage: number; // Uyumluluk yüzdesi
  scoreDifference: number; // Backward compatibility
}

// Eşleşme uygunluğu için type
export interface MatchingEligibility {
  is_eligible: boolean;
  completed_tests: number;
  total_tests: number;
  remaining_tests: number;
  total_score: number;
  message: string;
}

// Eşleşme response'u için type
export interface MatchResponse {
  message: string;
  user_info: {
    total_score: number;
    completed_tests: number;
    total_available_tests: number;
  };
  matches: MatchedUser[];
  matches_count: number;
}

// Eşleşme detayları için type
export interface MatchDetails {
  match_user: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    age?: number;
    residence_country?: string;
    residence_city?: string;
    gender?: string;
    avatarUrl?: string;
    languages?: string[];
    height?: number;
    weight?: number;
    total_score: number;
    completed_tests_count: number;
  };
  compatibility: {
    score_difference: number;
    compatibility_percentage: number;
    your_score: number;
  };
} 