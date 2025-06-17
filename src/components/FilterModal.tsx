import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput,
  Dimensions,
  Alert
} from 'react-native';

const { width } = Dimensions.get('window');

interface FilterOptions {
  minAge?: number;
  maxAge?: number;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  currentFilters
}) => {
  const [minAge, setMinAge] = useState<string>(currentFilters.minAge?.toString() || '');
  const [maxAge, setMaxAge] = useState<string>(currentFilters.maxAge?.toString() || '');

  const handleApplyFilters = () => {
    const minAgeNum = minAge ? parseInt(minAge) : undefined;
    const maxAgeNum = maxAge ? parseInt(maxAge) : undefined;

    // Validasyon
    if (minAgeNum && maxAgeNum && minAgeNum > maxAgeNum) {
      Alert.alert('Hata', 'Minimum yaş maksimum yaştan büyük olamaz!');
      return;
    }

    if (minAgeNum && (minAgeNum < 18 || minAgeNum > 100)) {
      Alert.alert('Hata', 'Minimum yaş 18-100 arasında olmalıdır!');
      return;
    }

    if (maxAgeNum && (maxAgeNum < 18 || maxAgeNum > 100)) {
      Alert.alert('Hata', 'Maksimum yaş 18-100 arasında olmalıdır!');
      return;
    }

    const filters: FilterOptions = {
      minAge: minAgeNum,
      maxAge: maxAgeNum,
    };

    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    setMinAge('');
    setMaxAge('');
    onApplyFilters({});
    onClose();
  };

  const handleClose = () => {
    // Modal kapanırken mevcut filtreleri geri yükle
    setMinAge(currentFilters.minAge?.toString() || '');
    setMaxAge(currentFilters.maxAge?.toString() || '');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtreleme Seçenekleri</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>🎂 Yaş Aralığı</Text>
              <View style={styles.ageInputContainer}>
                <View style={styles.ageInputWrapper}>
                  <Text style={styles.ageInputLabel}>Minimum Yaş</Text>
                  <TextInput
                    style={styles.ageInput}
                    value={minAge}
                    onChangeText={setMinAge}
                    placeholder="18"
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
                <Text style={styles.ageSeparator}>-</Text>
                <View style={styles.ageInputWrapper}>
                  <Text style={styles.ageInputLabel}>Maksimum Yaş</Text>
                  <TextInput
                    style={styles.ageInput}
                    value={maxAge}
                    onChangeText={setMaxAge}
                    placeholder="100"
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
              </View>
            </View>

            {/* Gelecekte eklenebilecek diğer filtreler için yer */}
            <View style={styles.comingSoonSection}>
              <Text style={styles.comingSoonText}>
                📍 Konum, 📊 Puan Aralığı, 🎯 Uyumluluk gibi filtreler yakında...
              </Text>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.footerButton, styles.clearButton]} 
              onPress={handleClearFilters}
            >
              <Text style={styles.clearButtonText}>Filtreleri Temizle</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.footerButton, styles.applyButton]} 
              onPress={handleApplyFilters}
            >
              <Text style={styles.applyButtonText}>Filtreleri Uygula</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  ageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ageInputWrapper: {
    flex: 1,
  },
  ageInputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  ageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  ageSeparator: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginHorizontal: 15,
    marginTop: 20,
  },
  comingSoonSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f4f7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  comingSoonText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#f0f0f0',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#1e88e5',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FilterModal; 