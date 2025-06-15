import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { useTestViewModel } from '../viewModels/useTestViewModel';

// Navigation tipleri
type TestScreenRouteProp = RouteProp<AppStackParamList, 'Test'>;
type TestScreenNavigationProp = NativeStackNavigationProp<AppStackParamList, 'Test'>;

const TestScreen = () => {
  const route = useRoute<TestScreenRouteProp>();
  const navigation = useNavigation<TestScreenNavigationProp>();
  const { testId, testName } = route.params;

  // ViewModel kullanımı - MVVM mimarisi
  const {
    currentQuestion,
    selectedAnswers,
    isLoading,
    isSubmitting,
    error,
    isLastQuestion,
    isFirstQuestion,
    progress,
    handleSelectAnswer,
    handleNextQuestion,
    handlePreviousQuestion,
    handleSubmitTest,
    fetchTestDetails,
  } = useTestViewModel({ testId });

  const onSubmitSuccess = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e88e5" />
        <Text style={styles.loadingText}>Test Yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Yeniden Dene" onPress={fetchTestDetails} />
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.centered}>
        <Text>Bu test için soru bulunamadı veya soru yüklenirken bir sorun oluştu.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.testTitle}>{testName}</Text>
      <Text style={styles.progressText}>Soru {progress.current} / {progress.total}</Text>
      
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion?.question_text}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {(currentQuestion?.answers || []).map((answer) => (
          <TouchableOpacity
            key={answer.id.toString()}
            style={[
              styles.optionButton,
              selectedAnswers[currentQuestion.id] === answer.id.toString() && styles.selectedOption
            ]}
            onPress={() => handleSelectAnswer(currentQuestion.id, answer.id)}
            disabled={isSubmitting}
          >
            <Text 
              style={[
                styles.optionText,
                selectedAnswers[currentQuestion.id] === answer.id.toString() && styles.selectedOptionText
              ]}
            >
              {answer.answer_text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.navigationButtons}>
        <Button 
          title="Geri"
          onPress={handlePreviousQuestion} 
          disabled={isFirstQuestion || isSubmitting}
        />
        {isLastQuestion ? (
          <Button 
            title={isSubmitting ? "Gönderiliyor..." : "Bitir"} 
            onPress={async () => {
              const result = await handleSubmitTest();
              if (result) {
                onSubmitSuccess();
              }
            }} 
            disabled={isSubmitting || !selectedAnswers[currentQuestion.id]}
            color="#28a745"
          />
        ) : (
          <Button 
            title="İlerle" 
            onPress={handleNextQuestion} 
            disabled={isSubmitting || !selectedAnswers[currentQuestion.id]}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  testTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#263238',
  },
  progressText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    color: '#546e7a',
  },
  questionContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#333',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedOption: {
    backgroundColor: '#1e88e5',
    borderColor: '#1e88e5',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
});

export default TestScreen; 