import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { 
  fetchTestWithQuestionsAndAnswers, 
  submitTestResponseEnhanced,
  checkTestCompletion,
  TestDetails,
  Question,
  Answer
} from '../api/apiClient';
import { TestResponse, TestResult } from '../types/auth';

interface UseTestViewModelProps {
  testId: string | number;
}

interface SelectedAnswers {
  [questionId: string]: string | number;
}

export const useTestViewModel = ({ testId }: UseTestViewModelProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const fetchTestDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const testDetails: TestDetails = await fetchTestWithQuestionsAndAnswers(testId);
      setQuestions(testDetails.questions || []);
      setSelectedAnswers({});
      setCurrentQuestionIndex(0);
    } catch (err: any) {
      console.error("Test verileri çekilirken hata:", err);
      setError('Test verileri yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchTestDetails();
  }, [fetchTestDetails]);

  const handleSelectAnswer = useCallback((questionId: string | number, answerId: string | number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId.toString()]: answerId,
    }));
  }, []);

  const handleNextQuestion = useCallback(() => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!selectedAnswers[currentQuestion?.id]) {
      Alert.alert("Uyarı", "Lütfen devam etmeden önce bir cevap seçin.");
      return false;
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      return true;
    }
    return false;
  }, [currentQuestionIndex, questions, selectedAnswers]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      return true;
    }
    return false;
  }, [currentQuestionIndex]);

  const validateAllQuestionsAnswered = useCallback(() => {
    return questions.every(q => selectedAnswers[q.id.toString()]);
  }, [questions, selectedAnswers]);

  const handleSubmitTest = useCallback(async (): Promise<TestResult | null> => {
    if (!validateAllQuestionsAnswered()) {
      Alert.alert("Eksik Cevaplar", "Lütfen devam etmeden önce tüm soruları cevaplayın.");
      return null;
    }

    setIsSubmitting(true);
    try {
      const responses: TestResponse[] = Object.entries(selectedAnswers).map(([questionId, answerId]) => ({
        question_id: parseInt(questionId),
        answer_id: parseInt(answerId.toString()),
      }));
      
      const result = await submitTestResponseEnhanced(Number(testId), responses);
      setTestResult(result);
      
      Alert.alert(
        "Test Tamamlandı!",
        `Tebrikler!`,
        [{ text: "Tamam" }]
      );
      
      return result;
    } catch (err: any) {
      console.error("Testi gönderirken hata:", err);
      if (err.message === 'Bu test daha önce tamamlanmış.') {
        Alert.alert(
          "Test Zaten Tamamlanmış", 
          "Bu test daha önce tamamlanmış. Ana ekrana dönülüyor.",
          [{ text: "Tamam" }]
        );
      } else {
        Alert.alert("Hata", err.message || "Test sonuçları gönderilirken bir sorun oluştu.");
      }
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [testId, selectedAnswers, validateAllQuestionsAnswered]);

  const getCurrentQuestion = useCallback(() => {
    return questions[currentQuestionIndex];
  }, [questions, currentQuestionIndex]);

  const getProgress = useCallback(() => {
    return {
      current: currentQuestionIndex + 1,
      total: questions.length,
      percentage: questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0,
    };
  }, [currentQuestionIndex, questions.length]);

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();

  return {
    // State
    questions,
    currentQuestionIndex,
    selectedAnswers,
    isLoading,
    isSubmitting,
    error,
    testResult,
    
    // Computed values
    currentQuestion,
    isLastQuestion,
    isFirstQuestion,
    progress,
    
    // Actions
    handleSelectAnswer,
    handleNextQuestion,
    handlePreviousQuestion,
    handleSubmitTest,
    fetchTestDetails,
    validateAllQuestionsAnswered,
  };
}; 