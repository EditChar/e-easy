import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { updateUserProfile } from '../api/apiClient';
import { UserProfileUpdateData, User } from '../types/auth';
import countriesData from '../constants/countries.json';
import languagesData from '../constants/languages.json';

interface AdditionalInfoViewModelProps {
    onClose: (updatedUser: User) => void;
}

export const useAdditionalInfoViewModel = ({ onClose }: AdditionalInfoViewModelProps) => {
    const [residenceCountry, setResidenceCountryState] = useState<string | null>(null);
    const [residenceCity, setResidenceCity] = useState<string | null>(null);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [height, setHeight] = useState<string>('');
    const [weight, setWeight] = useState<string>('');
    const [countryOpen, setCountryOpen] = useState(false);
    const [cityOpen, setCityOpen] = useState(false);
    const [languageOpen, setLanguageOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const setResidenceCountry = (value: any) => {
        const newCountry = typeof value === 'function' ? value(residenceCountry) : value;
        if (residenceCountry !== newCountry) {
            setResidenceCity(null);
        }
        setResidenceCountryState(newCountry);
    };

    const countries = useMemo(() => countriesData.map(c => ({
        label: `${c.flag} ${c.name}`,
        value: c.isoCode,
    })), []);

    const cities = useMemo(() => {
        if (!residenceCountry) return [];
        const selectedCountryData = countriesData.find(c => c.isoCode === residenceCountry);
        if (!selectedCountryData || !selectedCountryData.cities) return [];
        return selectedCountryData.cities.map(cityName => ({
            label: cityName,
            value: cityName,
        }));
    }, [residenceCountry]);

    const languages = useMemo(() => languagesData.map(lang => ({
        label: lang.name,
        value: lang.code,
    })), []);

    const handleSave = async () => {
        if (!residenceCountry || !residenceCity || selectedLanguages.length === 0 || !height || !weight) {
            setError("Lütfen tüm alanları doldurun.");
            return;
        }

        const heightNum = parseFloat(height);
        const weightNum = parseFloat(weight);

        if (isNaN(heightNum) || heightNum <= 0 || heightNum > 300) {
            setError("Lütfen geçerli bir boy giriniz (0-300 cm).");
            return;
        }

        if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
            setError("Lütfen geçerli bir kilo giriniz (0-500 kg).");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const profileData: UserProfileUpdateData = {
                residenceCountry: residenceCountry,
                residenceCity: residenceCity,
                languages: selectedLanguages,
                height: heightNum,
                weight: weightNum,
            };
            
            if (Object.values(profileData).every(v => v === undefined)) {
                 setError("Güncellemek için lütfen en az bir alanı doldurun.");
                 setLoading(false);
                 return;
            }

            const updatedUser = await updateUserProfile(profileData);
            Alert.alert("Başarılı", "Profil bilgileriniz güncellendi.");
            onClose(updatedUser);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Bir hata oluştu.";
            setError(errorMessage);
            console.error("Profil Güncelleme Hatası:", err);
        } finally {
            setLoading(false);
        }
    };

    return {
        loading, error, handleSave,
        residenceCountry, setResidenceCountry,
        residenceCity, setResidenceCity,
        selectedLanguages, setSelectedLanguages,
        height, setHeight,
        weight, setWeight,
        countryOpen, setCountryOpen,
        cityOpen, setCityOpen,
        languageOpen, setLanguageOpen,
        countries, cities, languages
    };
}; 