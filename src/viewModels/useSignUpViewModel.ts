import React, { useState, useMemo } from 'react';
import { Text } from 'react-native';
import { signupUser } from '../api/apiClient';
import { AuthResponse, SignUpData } from '../types/auth';
import { storeTokens } from '../utils/authStorage';
import countriesData from '../constants/countries.json';
// import { useNavigation } from '@react-navigation/native'; // Gerekirse navigasyon için

interface SignUpViewModelProps {
    setIsAuthenticated: (isAuthenticated: boolean) => void;
}

export const useSignUpViewModel = ({ setIsAuthenticated }: SignUpViewModelProps) => {
    const [formData, setFormData] = useState<SignUpData>({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        age: 0,
        country: '',
        gender: undefined,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [open, setOpen] = useState(false);
    const [countryValue, setCountryValue] = useState<string | null>(null);

    const countryItems = useMemo(() => countriesData.map(country => ({
        label: `${country.flag} ${country.name}`,
        value: country.isoCode,
        flag: country.flag,
        name: country.name,
    })), []);


    const handleInputChange = (name: keyof SignUpData, value: string | number | 'male' | 'female') => {
        setFormData(prevState => ({
            ...prevState,
            [name]: name === 'age' && typeof value === 'string' ? (value ? parseInt(value, 10) : 0) : value,
        }));
    };

    const handleSignUp = async (): Promise<boolean> => {
        if (!formData.username || !formData.email || !formData.password || !formData.firstName || !formData.lastName || !countryValue || !formData.gender) {
            setError('Lütfen tüm zorunlu alanları doldurun.');
            return false;
        }
        setLoading(true);
        setError(null);
        try {
            const finalFormData = { ...formData, country: countryValue };
            const response = await signupUser(finalFormData);
            
            await storeTokens(response.accessToken, response.refreshToken);
            console.log('Kayıt Başarılı ve Tokenlar Saklandı:', response.user.username);
            
            setLoading(false);
            setIsAuthenticated(true);
            return true;

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Bir hata oluştu.';
            setError(errorMessage);
            setLoading(false);
            console.error("Sign up error:", errorMessage);
            return false;
        }
    };

    return {
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
    };
}; 