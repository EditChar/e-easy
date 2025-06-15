        // src/config/apiConfig.ts

        // Geliştirme sırasında bilgisayarınızın yerel IP adresini kullanın
        // Bilgisayarınızda 'ipconfig' (Windows) veya 'ifconfig' (macOS/Linux) komutuyla öğrenebilirsiniz.
        // Örneğin: const API_BASE_URL = 'http://192.168.1.10:3000/api'; // Kendi IP adresiniz ve portunuz
        // Android Emülatörü için genellikle:
        // const API_BASE_URL = 'http://10.0.2.2:3000/api';
        // iOS Simülatörü için (API aynı makinede çalışıyorsa):
        // const API_BASE_URL = 'http://localhost:3000/api';

        // Şimdilik en yaygın emulator/localhost senaryosunu ele alalım:
        // const API_BASE_URL = 'http://localhost:3001/api'; // iOS Sim & API aynı makinede ise
        const API_BASE_URL = 'http://10.0.2.2:3001/api'; // Android Emulator için bunu kullanın

        export default API_BASE_URL;