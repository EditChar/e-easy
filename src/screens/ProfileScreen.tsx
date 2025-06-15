import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  PermissionsAndroid,
  Platform,
  Modal,
  SafeAreaView,
  TextInput,
  RefreshControl
} from 'react-native';
import { clearTokens } from '../utils/authStorage';
import { User } from '../types/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import ImageViewing from 'react-native-image-viewing';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadAvatar, updateUserProfile } from '../api/apiClient';
import DropDownPicker from 'react-native-dropdown-picker';
import countriesData from '../constants/countries.json';
import languagesData from '../constants/languages.json';
import { useProfileViewModel } from '../viewModels/useProfileViewModel';

const MALE_DEFAULT_AVATAR = require('../assets/images/male.jpg');
const FEMALE_DEFAULT_AVATAR = require('../assets/images/female.jpg');

interface ProfileScreenProps {
  user: User | null;
  updateUser: (user: User) => void;
  setIsAuthenticated?: (isAuthenticated: boolean) => void;
}

// Örnekten alınan yardımcı bileşen
const ProfileInfoRow = ({ label, value, onEdit }: { label: string, value: string | null | undefined, onEdit?: () => void }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}:</Text>
        <View style={styles.valueContainer}>
            <Text style={styles.value}>{value || 'Belirtilmemiş'}</Text>
            {onEdit && (
                <TouchableOpacity onPress={onEdit} style={styles.editIcon}>
                    <Text style={{marginLeft: 10}}>✏️</Text>
                </TouchableOpacity>
            )}
        </View>
    </View>
);

const ProfileScreen = ({ user, updateUser, setIsAuthenticated }: ProfileScreenProps) => {
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Test puanlama sistemi ViewModel'i
  const {
    stats,
    recentTests,
    isLoading: isScoreLoading,
    isRefreshing,
    onRefresh,
    formatDate,
  } = useProfileViewModel();
  
  // Edit modals state
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [languagesModalVisible, setLanguagesModalVisible] = useState(false);
  const [heightModalVisible, setHeightModalVisible] = useState(false);
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  
  // Edit form states
  const [editResidenceCountry, setEditResidenceCountry] = useState<string | null>(null);
  const [editResidenceCity, setEditResidenceCity] = useState<string | null>(null);
  const [editLanguages, setEditLanguages] = useState<string[]>([]);
  const [editHeight, setEditHeight] = useState<string>('');
  const [editWeight, setEditWeight] = useState<string>('');
  
  // Dropdown states
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  
  const [editLoading, setEditLoading] = useState(false);

  const handleLogout = async () => {
    if (!setIsAuthenticated) return;
    Alert.alert(
      "Çıkış Yap", "Çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Evet",
          onPress: async () => {
            await clearTokens();
            setIsAuthenticated(false);
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleChoosePhoto = async () => {
    
    // Android için izin isteme
    if (Platform.OS === 'android') {
      try {
        
        // Android 13 (API 33) ve sonrası için farklı izin gerekiyor
        const permission = Platform.Version >= 33 
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const granted = await PermissionsAndroid.request(
          permission,
          {
            title: "Galeri Erişimi",
            message: "Profil fotoğrafı seçmek için galerinize erişmemiz gerekiyor.",
            buttonPositive: "İzin Ver",
            buttonNegative: "İptal"
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("Galeri izni alındı.");
        } else {
          Alert.alert("İzin Reddedildi", "Fotoğraf seçmek için galeri erişim izni vermeniz gerekmektedir.");
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, async (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert("Hata", "Fotoğraf seçilirken bir hata oluştu: " + response.errorMessage);
        return;
      }
      if (response.assets && response.assets[0]) {
        setIsUploading(true);
        try {
          const updatedUser = await uploadAvatar(response.assets[0]);
          updateUser(updatedUser);
          Alert.alert("Başarılı", "Profil fotoğrafınız güncellendi.");
        } catch (error) {
          Alert.alert("Yükleme Hatası", "Fotoğraf yüklenirken bir sorun oluştu.");
          console.error(error);
        } finally {
          setIsUploading(false);
        }
      }
    });
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Profil Yükleniyor...</Text>
      </View>
    );
  }

  const defaultAvatar = user.gender === 'male' ? MALE_DEFAULT_AVATAR : FEMALE_DEFAULT_AVATAR;
  const avatarSource = user.avatarUrl ? { uri: user.avatarUrl } : defaultAvatar;
  
  // ImageViewer'a gönderilecek URI'nin her zaman bir string olmasını sağla
  const imagesForViewer = [{ uri: user.avatarUrl || '' }];

  const getGenderText = (gender: 'male' | 'female' | undefined) => {
    if (gender === 'male') return '♂️ Erkek';
    if (gender === 'female') return '♀️ Kadın';
    return 'Belirtilmemiş';
  };

  // Prepare dropdown data
  const countries = React.useMemo(() => countriesData.map(c => ({
    label: `${c.flag} ${c.name}`,
    value: c.isoCode,
  })), []);

  const cities = React.useMemo(() => {
    if (!editResidenceCountry) return [];
    const selectedCountryData = countriesData.find(c => c.isoCode === editResidenceCountry);
    if (!selectedCountryData || !selectedCountryData.cities) return [];
    return selectedCountryData.cities.map(cityName => ({
      label: cityName,
      value: cityName,
    }));
  }, [editResidenceCountry]);

  const languages = React.useMemo(() => languagesData.map(lang => ({
    label: lang.name,
    value: lang.code,
  })), []);

  // Edit handlers
  const handleEditCountry = () => {
    setEditResidenceCountry(user?.residenceCountry || null);
    setEditResidenceCity(user?.residenceCity || null);
    setCountryModalVisible(true);
  };

  const handleEditCity = () => {
    setEditResidenceCountry(user?.residenceCountry || null);
    setEditResidenceCity(user?.residenceCity || null);
    setCityModalVisible(true);
  };

  const handleEditLanguages = () => {
    setEditLanguages(user?.languages || []);
    setLanguagesModalVisible(true);
  };

  const handleEditHeight = () => {
    setEditHeight(user?.height ? user.height.toString() : '');
    setHeightModalVisible(true);
  };

  const handleEditWeight = () => {
    setEditWeight(user?.weight ? user.weight.toString() : '');
    setWeightModalVisible(true);
  };

  const handleSaveCountry = async () => {
    if (!editResidenceCountry) {
      Alert.alert('Hata', 'Lütfen bir ülke seçin.');
      return;
    }
    
    if (!editResidenceCity) {
      Alert.alert('Hata', 'Lütfen bir şehir seçin.');
      return;
    }
    
    setEditLoading(true);
    try {
      const updatedUser = await updateUserProfile({
        residenceCountry: editResidenceCountry,
        residenceCity: editResidenceCity
      });
      updateUser(updatedUser);
      Alert.alert('Başarılı', 'Yaşadığınız ülke ve şehir güncellendi.');
      setCountryModalVisible(false);
    } catch (error) {
      console.error('Country update error:', error);
      Alert.alert('Hata', 'Güncelleme sırasında bir hata oluştu.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveCity = async () => {
    if (!editResidenceCity) {
      Alert.alert('Hata', 'Lütfen bir şehir seçin.');
      return;
    }
    
    setEditLoading(true);
    try {
      const updatedUser = await updateUserProfile({
        residenceCity: editResidenceCity
      });
      updateUser(updatedUser);
      Alert.alert('Başarılı', 'Yaşadığınız şehir güncellendi.');
      setCityModalVisible(false);
    } catch (error) {
      console.error('City update error:', error);
      Alert.alert('Hata', 'Güncelleme sırasında bir hata oluştu.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveLanguages = async () => {
    if (editLanguages.length === 0) {
      Alert.alert('Hata', 'Lütfen en az bir dil seçin.');
      return;
    }
    
    setEditLoading(true);
    try {
      const updatedUser = await updateUserProfile({
        languages: editLanguages
      });
      updateUser(updatedUser);
      Alert.alert('Başarılı', 'Bildiğiniz diller güncellendi.');
      setLanguagesModalVisible(false);
    } catch (error) {
      console.error('Languages update error:', error);
      Alert.alert('Hata', 'Güncelleme sırasında bir hata oluştu.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveHeight = async () => {
    if (!editHeight.trim()) {
      Alert.alert('Hata', 'Lütfen boyunuzu giriniz.');
      return;
    }

    const heightNum = parseFloat(editHeight);
    if (isNaN(heightNum) || heightNum <= 0 || heightNum > 300) {
      Alert.alert('Hata', 'Lütfen geçerli bir boy giriniz (0-300 cm).');
      return;
    }
    
    setEditLoading(true);
    try {
      const updatedUser = await updateUserProfile({
        height: heightNum
      });
      updateUser(updatedUser);
      Alert.alert('Başarılı', 'Boyunuz güncellendi.');
      setHeightModalVisible(false);
    } catch (error) {
      console.error('Height update error:', error);
      Alert.alert('Hata', 'Güncelleme sırasında bir hata oluştu.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveWeight = async () => {
    if (!editWeight.trim()) {
      Alert.alert('Hata', 'Lütfen kilonuzu giriniz.');
      return;
    }

    const weightNum = parseFloat(editWeight);
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
      Alert.alert('Hata', 'Lütfen geçerli bir kilo giriniz (0-500 kg).');
      return;
    }
    
    setEditLoading(true);
    try {
      const updatedUser = await updateUserProfile({
        weight: weightNum
      });
      updateUser(updatedUser);
      Alert.alert('Başarılı', 'Kilonuz güncellendi.');
      setWeightModalVisible(false);
    } catch (error) {
      console.error('Weight update error:', error);
      Alert.alert('Hata', 'Güncelleme sırasında bir hata oluştu.');
    } finally {
      setEditLoading(false);
    }
  };

  const setEditResidenceCountryWithReset = (value: any) => {
    const newCountry = typeof value === 'function' ? value(editResidenceCountry) : value;
    if (editResidenceCountry !== newCountry) {
      setEditResidenceCity(null);
    }
    setEditResidenceCountry(newCountry);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
        />
      }
    >
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={user.avatarUrl ? () => setIsViewerVisible(true) : handleChoosePhoto} style={styles.avatarContainer}>
            <Image source={avatarSource} style={styles.avatarImage} />
            {isUploading && <View style={styles.uploadingOverlay}><ActivityIndicator color="#fff" /></View>}
            <TouchableOpacity style={styles.editIconContainer} onPress={handleChoosePhoto}>
                <Text>✏️</Text>
            </TouchableOpacity>
          </TouchableOpacity>
          <Text style={styles.name}>{`${user.firstName} ${user.lastName}`}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
        <Text style={styles.header}>Profilim</Text>
        <View style={styles.card}>
            <ProfileInfoRow label="Kullanıcı Adı" value={user.username} />
            <ProfileInfoRow label="E-posta" value={user.email} />
            <ProfileInfoRow label="İsim" value={`${user.firstName} ${user.lastName}`} />
            <ProfileInfoRow label="Yaş" value={user.age.toString()} />
            <ProfileInfoRow 
                label="Cinsiyet" 
                value={getGenderText(user.gender)} 
            />
            <ProfileInfoRow label="Kayıtlı Ülke" value={user.country} />
        </View>
        <View style={styles.card}>
            <ProfileInfoRow label="Yaşadığı Ülke" value={user.residenceCountry} onEdit={handleEditCountry} />
            <ProfileInfoRow label="Yaşadığı Şehir" value={user.residenceCity} onEdit={handleEditCity} />
            <ProfileInfoRow label="Bildiği Diller" value={user.languages?.join(', ')} onEdit={handleEditLanguages} />
            <ProfileInfoRow label="Boy" value={user.height ? `${user.height} cm` : null} onEdit={handleEditHeight} />
            <ProfileInfoRow label="Kilo" value={user.weight ? `${user.weight} kg` : null} onEdit={handleEditWeight} />
        </View>

        {/* Test İstatistikleri Kartı */}
        <Text style={styles.header}>Test İstatistiklerim</Text>
        <View style={styles.scoreCard}>
            {isScoreLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.loadingText}>Yükleniyor...</Text>
                </View>
            ) : (
                <>
                    <View style={styles.scoreHeader}>
                        <Text style={styles.totalScore}>{stats.totalScore}</Text>
                        <Text style={styles.scoreLabel}>Toplam Puan</Text>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.completedTests}</Text>
                            <Text style={styles.statLabel}>Tamamlanan Test</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.rank || '-'}</Text>
                            <Text style={styles.statLabel}>Sıralama</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.averageScore}</Text>
                            <Text style={styles.statLabel}>Ortalama Puan</Text>
                        </View>
                    </View>
                </>
            )}
        </View>

        {/* Son Testler */}
        {recentTests.length > 0 && (
            <>
                <Text style={styles.header}>Son Testlerim</Text>
                <View style={styles.card}>
                    {recentTests.map((test, index) => (
                        <View key={index} style={styles.testItem}>
                            <View style={styles.testInfo}>
                                <Text style={styles.testTitle}>{test.test_title}</Text>
                                <Text style={styles.testDate}>{formatDate(test.completed_at)}</Text>
                            </View>
                            <View style={styles.testScoreContainer}>
                                <Text style={styles.testScoreValue}>{test.test_score}</Text>
                                <Text style={styles.testScoreLabel}>puan</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </>
        )}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>
        <ImageViewing
          images={imagesForViewer}
          imageIndex={0}
          visible={isViewerVisible && user.avatarUrl != null}
          onRequestClose={() => setIsViewerVisible(false)}
        />

        {/* Country Edit Modal */}
        <Modal
            animationType="slide"
            transparent={false}
            visible={countryModalVisible}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Yaşadığınız Ülke ve Şehri Düzenleyin</Text>
                    
                    <DropDownPicker
                        open={countryOpen}
                        value={editResidenceCountry}
                        items={countries}
                        setOpen={(open) => {
                            const isOpen = typeof open === 'function' ? open(countryOpen) : open;
                            setCountryOpen(isOpen);
                            if (isOpen) {
                                setCityOpen(false);
                                setLanguageOpen(false);
                            }
                        }}
                        setValue={setEditResidenceCountryWithReset}
                        searchable={true}
                        placeholder="Yaşadığınız Ülkeyi Seçin"
                        listMode="MODAL"
                        style={styles.dropdown}
                        zIndex={3000}
                        zIndexInverse={1000}
                    />
                    
                    <DropDownPicker
                        open={cityOpen}
                        value={editResidenceCity}
                        items={cities}
                        setOpen={(open) => {
                            const isOpen = typeof open === 'function' ? open(cityOpen) : open;
                            setCityOpen(isOpen);
                            if (isOpen) {
                                setCountryOpen(false);
                                setLanguageOpen(false);
                            }
                        }}
                        setValue={setEditResidenceCity}
                        disabled={!editResidenceCountry}
                        searchable={true}
                        placeholder="Yaşadığınız Şehri Seçin"
                        listMode="MODAL"
                        style={styles.dropdown}
                        disabledStyle={styles.disabledDropdown}
                        zIndex={2000}
                        zIndexInverse={2000}
                    />
                    
                    <View style={styles.modalButtonContainer}>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.cancelButton]} 
                            onPress={() => setCountryModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>İptal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.saveButton]} 
                            onPress={handleSaveCountry}
                            disabled={editLoading}
                        >
                            <Text style={styles.saveButtonText}>
                                {editLoading ? 'Kaydediliyor...' : 'Kaydet'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
                </Modal>

        {/* City Edit Modal */}
        <Modal
            animationType="slide"
            transparent={false}
            visible={cityModalVisible}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Yaşadığınız Şehri Düzenleyin</Text>
                    
                    <DropDownPicker
                        open={cityOpen}
                        value={editResidenceCity}
                        items={cities}
                        setOpen={(open) => {
                            const isOpen = typeof open === 'function' ? open(cityOpen) : open;
                            setCityOpen(isOpen);
                        }}
                        setValue={setEditResidenceCity}
                        disabled={!editResidenceCountry}
                        searchable={true}
                        placeholder="Yaşadığınız Şehri Seçin"
                        listMode="MODAL"
                        style={styles.dropdown}
                        disabledStyle={styles.disabledDropdown}
                    />
                    
                    <View style={styles.modalButtonContainer}>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.cancelButton]} 
                            onPress={() => setCityModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>İptal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.saveButton]} 
                            onPress={handleSaveCity}
                            disabled={editLoading}
                        >
                            <Text style={styles.saveButtonText}>
                                {editLoading ? 'Kaydediliyor...' : 'Kaydet'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>

        {/* Languages Edit Modal */}
        <Modal
            animationType="slide"
            transparent={false}
            visible={languagesModalVisible}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Bildiğiniz Dilleri Düzenleyin</Text>
                    
                    <DropDownPicker
                        open={languageOpen}
                        value={editLanguages}
                        items={languages}
                        setOpen={(open) => {
                            const isOpen = typeof open === 'function' ? open(languageOpen) : open;
                            setLanguageOpen(isOpen);
                        }}
                        setValue={setEditLanguages}
                        multiple={true}
                        mode="BADGE"
                        searchable={true}
                        placeholder="Konuştuğunuz Dilleri Seçin"
                        listMode="MODAL"
                        style={styles.dropdown}
                    />
                    
                    <View style={styles.modalButtonContainer}>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.cancelButton]} 
                            onPress={() => setLanguagesModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>İptal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.saveButton]} 
                            onPress={handleSaveLanguages}
                            disabled={editLoading}
                        >
                            <Text style={styles.saveButtonText}>
                                {editLoading ? 'Kaydediliyor...' : 'Kaydet'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>

        {/* Height Edit Modal */}
        <Modal
            animationType="slide"
            transparent={false}
            visible={heightModalVisible}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Boyunuzu Düzenleyin</Text>
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Boyunuz (cm)"
                        value={editHeight}
                        onChangeText={setEditHeight}
                        keyboardType="numeric"
                        maxLength={3}
                    />
                    
                    <View style={styles.modalButtonContainer}>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.cancelButton]} 
                            onPress={() => setHeightModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>İptal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.saveButton]} 
                            onPress={handleSaveHeight}
                            disabled={editLoading}
                        >
                            <Text style={styles.saveButtonText}>
                                {editLoading ? 'Kaydediliyor...' : 'Kaydet'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>

        {/* Weight Edit Modal */}
        <Modal
            animationType="slide"
            transparent={false}
            visible={weightModalVisible}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Kilonuzu Düzenleyin</Text>
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Kilonuz (kg)"
                        value={editWeight}
                        onChangeText={setEditWeight}
                        keyboardType="numeric"
                        maxLength={3}
                    />
                    
                    <View style={styles.modalButtonContainer}>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.cancelButton]} 
                            onPress={() => setWeightModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>İptal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.saveButton]} 
                            onPress={handleSaveWeight}
                            disabled={editLoading}
                        >
                            <Text style={styles.saveButtonText}>
                                {editLoading ? 'Kaydediliyor...' : 'Kaydet'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
    },
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        padding: 24,
        paddingBottom: 16,
        color: '#1c1e21',
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ebee',
    },
    label: {
        fontSize: 16,
        color: '#606770',
        fontWeight: '500',
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    value: {
        fontSize: 16,
        color: '#1c1e21',
        flexShrink: 1,
        textAlign: 'right',
        marginLeft: 8,
    },
    editIcon: {
        padding: 5,
    },
    logoutButton: {
        marginHorizontal: 16,
        marginTop: 24,
        marginBottom: 40,
        backgroundColor: '#fa3e3e',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerContainer: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#1e88e5',
        paddingBottom: 20,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 3,
        borderColor: '#fff',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 5,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    name: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 5,
    },
    email: {
        fontSize: 16,
        color: '#e0e0e0',
    },
    uploadingOverlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 60,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f0f2f5',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#1c1e21',
    },
    dropdown: {
        marginBottom: 20,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#fa3e3e',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledDropdown: {
        backgroundColor: '#f0f0f0',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    // Test puanlama sistemi stilleri
    scoreCard: {
        backgroundColor: '#1e88e5',
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 16,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#fff',
    },
    scoreHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    totalScore: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
    },
    scoreLabel: {
        fontSize: 14,
        color: '#b3d9ff',
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 12,
        color: '#b3d9ff',
        marginTop: 4,
        textAlign: 'center',
    },
    testItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ebee',
    },
    testInfo: {
        flex: 1,
    },
    testTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1c1e21',
    },
    testDate: {
        fontSize: 14,
        color: '#606770',
        marginTop: 2,
    },
    testScoreContainer: {
        alignItems: 'center',
    },
    testScoreValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e88e5',
    },
    testScoreLabel: {
        fontSize: 12,
        color: '#606770',
    },
});

export default ProfileScreen; 