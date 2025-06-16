import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useMatchDetailsViewModel } from '../viewModels/useMatchViewModel';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');

// Default avatars
const MALE_DEFAULT_AVATAR = require('../assets/images/male.jpg');
const FEMALE_DEFAULT_AVATAR = require('../assets/images/female.jpg');

interface MatchDetailsScreenProps {
  route: RouteProp<any, any>;
  navigation: NativeStackNavigationProp<any>;
}

const MatchDetailsScreen: React.FC<MatchDetailsScreenProps> = ({ route, navigation }) => {
  const { matchUserId, matchUser } = route.params || {};
  const {
    matchDetails,
    isLoading,
    error,
    loadMatchDetails,
  } = useMatchDetailsViewModel(matchUserId);

  const getCompatibilityColor = (percentage: number): string => {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 60) return '#FF9800';
    if (percentage >= 40) return '#FFC107';
    return '#F44336';
  };

  const formatLanguages = (languages: string[] | null | undefined): string => {
    if (!languages || languages.length === 0) return 'Belirtilmemiş';
    return languages.join(', ');
  };

  const formatHeight = (height: number | null | undefined): string => {
    if (!height) return 'Belirtilmemiş';
    return `${height} cm`;
  };

  const formatWeight = (weight: number | null | undefined): string => {
    if (!weight) return 'Belirtilmemiş';
    return `${weight} kg`;
  };

  const getGenderText = (gender: string | undefined): string => {
    if (gender === 'male') return '♂️ Erkek';
    if (gender === 'female') return '♀️ Kadın';
    return 'Belirtilmemiş';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Detaylar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !matchDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || 'Eşleşme detayları yüklenemedi'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMatchDetails}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { match_user, compatibility } = matchDetails;

  const getUserName = () => {
    if (match_user.first_name && match_user.last_name) {
      return `${match_user.first_name} ${match_user.last_name}`;
    }
    return match_user.username;
  };

  const getAvatarSource = () => {
    if (match_user.avatarUrl) {
      return { uri: match_user.avatarUrl };
    }
    return match_user.gender === 'female' ? FEMALE_DEFAULT_AVATAR : MALE_DEFAULT_AVATAR;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Image 
            source={getAvatarSource()}
            style={styles.profileImage}
          />
          <Text style={styles.userName}>{getUserName()}</Text>
          {match_user.age && (
            <Text style={styles.userAge}>{match_user.age} yaşında</Text>
          )}
        </View>

        {/* Compatibility Section */}
        <View style={styles.compatibilitySection}>
          <Text style={styles.sectionTitle}>💕 Uyumluluk</Text>
          <View style={styles.compatibilityCard}>
            <View style={[
              styles.compatibilityBadge, 
              { backgroundColor: getCompatibilityColor(compatibility.compatibility_percentage) }
            ]}>
              <Text style={styles.compatibilityPercentage}>
                %{compatibility.compatibility_percentage}
              </Text>
              <Text style={styles.compatibilityLabel}>Uyumlu</Text>
            </View>
            <View style={styles.scoreComparison}>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Sizin Puanınız</Text>
                <Text style={styles.scoreValue}>{compatibility.your_score}</Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Eşleşmenizin Puanı</Text>
                <Text style={styles.scoreValue}>{match_user.total_score}</Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Puan Farkı</Text>
                <Text style={styles.scoreValue}>{compatibility.score_difference}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Personal Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>👤 Kişisel Bilgiler</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Yaşadığı Ülke" value={match_user.residence_country || 'Belirtilmemiş'} />
            <InfoRow label="Yaşadığı Şehir" value={match_user.residence_city || 'Belirtilmemiş'} />
            <InfoRow label="Cinsiyet" value={getGenderText(match_user.gender)} />
            <InfoRow label="Boy" value={formatHeight(match_user.height)} />
            <InfoRow label="Kilo" value={formatWeight(match_user.weight)} />
            <InfoRow label="Diller" value={formatLanguages(match_user.languages)} />
          </View>
        </View>

        {/* Test Results Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>📊 Test Sonuçları</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Toplam Puan" value={match_user.total_score.toString()} />
            <InfoRow label="Tamamlanan Test Sayısı" value={match_user.completed_tests_count.toString()} />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={() => Alert.alert('Yakında', 'Mesajlaşma özelliği yakında eklenecek!')}
          >
            <Text style={styles.messageButtonText}>💬 Mesaj Gönder</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => Alert.alert('Beğenildi!', 'Eşleşmenizi beğendiniz! 💕')}
          >
            <Text style={styles.likeButtonText}>❤️ Beğen</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper component for info rows
const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1e88e5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userAge: {
    fontSize: 16,
    color: '#666',
  },
  compatibilitySection: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  compatibilityCard: {
    alignItems: 'center',
  },
  compatibilityBadge: {
    padding: 20,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  compatibilityPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  compatibilityLabel: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
  scoreComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  messageButton: {
    backgroundColor: '#1e88e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  likeButton: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  likeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default MatchDetailsScreen; 