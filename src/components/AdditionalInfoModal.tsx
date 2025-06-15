import React from 'react';
import { View, Text, StyleSheet, Modal, Button, SafeAreaView, TextInput } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useAdditionalInfoViewModel } from '../viewModels/useAdditionalInfoViewModel';
import { User } from '../types/auth';

interface AdditionalInfoModalProps {
    visible: boolean;
    onClose: (updatedUser: User) => void;
}

const AdditionalInfoModal = ({ visible, onClose }: AdditionalInfoModalProps) => {
    const {
        loading,
        error,
        handleSave,
        residenceCountry,
        setResidenceCountry,
        residenceCity,
        setResidenceCity,
        selectedLanguages,
        setSelectedLanguages,
        height,
        setHeight,
        weight,
        setWeight,
        countryOpen,
        setCountryOpen,
        cityOpen,
        setCityOpen,
        languageOpen,
        setLanguageOpen,
        countries,
        cities,
        languages,
    } = useAdditionalInfoViewModel({ onClose });

    // Dropdown'ların aynı anda sadece birinin açık olmasını sağlayan fonksiyonlar
    const onCountryOpen = () => {
        setCityOpen(false);
        setLanguageOpen(false);
    };

    const onCityOpen = () => {
        setCountryOpen(false);
        setLanguageOpen(false);
    };

    const onLanguageOpen = () => {
        setCountryOpen(false);
        setCityOpen(false);
    };


    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={visible}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Ek Bilgiler</Text>
                    <Text style={styles.subtitle}>Lütfen devam etmek için bu bilgileri doldurun.</Text>

                    {/* Ülke Dropdown */}
                    <DropDownPicker
                        open={countryOpen}
                        value={residenceCountry}
                        items={countries}
                        setOpen={setCountryOpen}
                        setValue={setResidenceCountry}
                        onOpen={onCountryOpen}
                        searchable={true}
                        placeholder="Yaşadığınız Ülkeyi Seçin"
                        listMode="MODAL"
                        zIndex={3000}
                        zIndexInverse={1000}
                        style={styles.dropdown}
                    />

                    {/* Şehir Dropdown */}
                    <DropDownPicker
                        open={cityOpen}
                        value={residenceCity}
                        items={cities}
                        setOpen={setCityOpen}
                        setValue={setResidenceCity}
                        onOpen={onCityOpen}
                        disabled={!residenceCountry}
                        searchable={true}
                        placeholder="Yaşadığınız Şehri Seçin"
                        listMode="MODAL"
                        zIndex={2000}
                        zIndexInverse={2000}
                        style={styles.dropdown}
                        disabledStyle={styles.disabledDropdown}
                    />

                    {/* Dil Dropdown */}
                    <DropDownPicker
                        open={languageOpen}
                        value={selectedLanguages}
                        items={languages}
                        setOpen={setLanguageOpen}
                        setValue={setSelectedLanguages}
                        onOpen={onLanguageOpen}
                        multiple={true}
                        mode="BADGE"
                        searchable={true}
                        placeholder="Konuştuğunuz Dilleri Seçin"
                        listMode="MODAL"
                        zIndex={1000}
                        zIndexInverse={3000}
                        style={styles.dropdown}
                    />

                    {/* Boy Input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Boyunuz (cm)"
                        value={height}
                        onChangeText={setHeight}
                        keyboardType="numeric"
                        maxLength={3}
                    />

                    {/* Kilo Input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Kilonuz (kg)"
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="numeric"
                        maxLength={3}
                    />
                    
                    {error && <Text style={styles.errorText}>{error}</Text>}

                    <View style={styles.buttonContainer}>
                        <Button title={loading ? "Kaydediliyor..." : "Kaydet"} onPress={handleSave} disabled={loading} />
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: 'gray',
        marginBottom: 30,
    },
    dropdown: {
        marginBottom: 20,
    },
    disabledDropdown: {
        backgroundColor: '#f2f2f2',
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
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 10,
    },
    buttonContainer: {
        marginTop: 20,
    }
});

export default AdditionalInfoModal; 