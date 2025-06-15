import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ChatScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sohbetler</Text>
      <Text>Eşleştiğiniz kullanıcılarla olan mesajlaşmalarınız burada görünecek.</Text>
      {/* İleride buraya sohbet listesi veya aktif sohbet ekranı gelecek */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f4f7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#263238',
  },
});

export default ChatScreen; 