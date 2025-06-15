import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { useSignUpViewModel } from '../viewModels/useSignUpViewModel';
import DropDownPicker, { ItemType } from 'react-native-dropdown-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';

interface CountryItemType extends ItemType<string> {
  flag: string;
  name: string;
}

// Screen'in alacağı propları tanımla (navigation + bizim eklediğimiz)
type SignUpScreenProps = NativeStackScreenProps<AuthStackParamList, 'Signup'> & {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
};

const SignUpScreen = ({ setIsAuthenticated }: SignUpScreenProps) => {
  const {
    formData,
    loading,
    error,
    handleInputChange,
    handleSignUp,
    open,
    setOpen,
    countryValue,
    setCountryValue,
    countryItems,
  } = useSignUpViewModel({ setIsAuthenticated });

  const onSignUpPress = async () => {
    const success = await handleSignUp();
    if (success) {
      Alert.alert('Başarılı', 'Kullanıcı kaydı başarıyla oluşturuldu!');
      // Navigasyon işlemi ViewModel içinde veya burada yapılabilir.
      // Örn: navigation.navigate('HomeScreen');
    } else {
      // Hata mesajı zaten ViewModel tarafından 'error' state'inde tutuluyor
      // ve UI'da gösteriliyor. İstenirse burada ek bir Alert gösterilebilir.
      // Alert.alert('Kayıt Hatası', error || 'Bir sorun oluştu.');
    }
  };

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const isValidPassword = (password: string) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
  };



  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Yeni Üyelik</Text>

      <TextInput
        style={styles.input}
        placeholder="Kullanıcı Adı"
        value={formData.username}
        onChangeText={(text) => handleInputChange('username', text)}
        autoCapitalize="none"
      />
      {emailError !== '' && <Text style={{ color: 'red' }}>{emailError}</Text>}
      <TextInput
        style={styles.input}
        placeholder="E-posta"
        value={formData.email}
        onChangeText={(text) => {
          handleInputChange('email', text);
          if (!isValidEmail(text)) {
            setEmailError('Geçerli bir e-posta adresi giriniz.');
          } else {
            setEmailError('');
          }
        }}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {passwordError !== '' && (
        <Text style={{ color: 'red' }}>{passwordError}</Text>
      )}
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        value={formData.password}
        onChangeText={(text) => {
          handleInputChange('password', text);
          if (!isValidPassword(text)) {
            setPasswordError('Şifre en az 8 karakter olmalı harf ve rakam içermeli.');
          } else {
            setPasswordError('');
          }
        }}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="İsim"
        value={formData.firstName}
        onChangeText={(text) => handleInputChange('firstName', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Soyisim"
        value={formData.lastName}
        onChangeText={(text) => handleInputChange('lastName', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Yaş"
        value={formData.age > 0 ? String(formData.age) : ''}
        onChangeText={(text) => handleInputChange('age', text)}
        keyboardType="numeric"
      />

      {/* Cinsiyet Seçimi */}
      <Text style={styles.label}>Cinsiyet</Text>
      <View style={styles.genderContainer}>
        <TouchableOpacity
          style={[styles.genderOption, formData.gender === 'female' && styles.genderOptionSelected]}
          onPress={() => handleInputChange('gender', 'female')}
        >
          <Text style={[styles.genderIcon, formData.gender === 'female' && styles.genderTextSelected]}>♀️</Text>
          <Text style={[styles.genderText, formData.gender === 'female' && styles.genderTextSelected]}>Kadın</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderOption, formData.gender === 'male' && styles.genderOptionSelected]}
          onPress={() => handleInputChange('gender', 'male')}
        >
          <Text style={[styles.genderIcon, formData.gender === 'male' && styles.genderTextSelected]}>♂️</Text>
          <Text style={[styles.genderText, formData.gender === 'male' && styles.genderTextSelected]}>Erkek</Text>
        </TouchableOpacity>
      </View>

      {/* Ülke Dropdown */}
      <DropDownPicker
        open={open}
        value={countryValue}
        items={countryItems}
        setOpen={setOpen}
        setValue={setCountryValue}
        style={styles.input}
        placeholder="Ülke Seçiniz"
        searchable={true}
        searchPlaceholder="Ülke ara..."
        listMode="MODAL"
        renderListItem={(props) => {
          const item = props.item as CountryItemType;
          return (
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                if (item.value) {
                  setCountryValue(item.value);
                }
                setOpen(false);
              }}
            >
              <Text style={styles.dropdownItemFlag}>{item.flag}</Text>
              <Text style={styles.dropdownItemLabel}>{item.name}</Text>
            </TouchableOpacity>
          );
        }}
        containerStyle={styles.dropdownContainer}
        zIndex={1000} // Diğer elemanların üzerinde görünmesi için
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.buttonContainer}>
        <Button title={loading ? "Kaydediliyor..." : "Kayıt Ol"} onPress={onSignUpPress} disabled={loading} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50, // Yüksekliği artırdık
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15, // Artırıldı
    paddingHorizontal: 10, // padding artırdık
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  label: { // Eklendi
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  genderContainer: { // Eklendi
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  genderOption: { // Eklendi
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  genderOptionSelected: { // Eklendi
    backgroundColor: '#1e88e5',
    borderColor: '#1e88e5',
  },
  genderIcon: { // Eklendi
    fontSize: 20,
    marginRight: 10,
  },
  genderText: { // Eklendi
    fontSize: 16,
    fontWeight: '500',
  },
  genderTextSelected: { // Eklendi
    color: '#fff',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  // Dropdown için ek stiller
  dropdownContainer: {
    marginBottom: 12,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  dropdownItemFlag: {
    marginRight: 10,
    fontSize: 18,
  },
  dropdownItemLabel: {
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 10,
    zIndex: -1, // Dropdown'un altında kalması için
  }
});

export default SignUpScreen; 