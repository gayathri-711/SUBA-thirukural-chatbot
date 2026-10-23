import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  BackHandler,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const STORAGE_KEY_URL = 'suba_mobile_web_url_v1';
const DEFAULT_URL = 'http://192.168.0.9:5173';

export default function App() {
  const [webUrl, setWebUrl] = useState(DEFAULT_URL);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [inputUrl, setInputUrl] = useState(DEFAULT_URL);
  const [canGoBack, setCanGoBack] = useState(false);

  const webViewRef = useRef<any>(null);

  // Load saved custom URL if available
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY_URL);
        if (saved && saved.trim()) {
          setWebUrl(saved.trim());
          setInputUrl(saved.trim());
        }
      } catch (e) {
        console.warn('Failed to load saved URL:', e);
      }
    })();
  }, []);

  // Handle hardware Android back button
  useEffect(() => {
    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [canGoBack]);

  const handleSaveUrl = async () => {
    const cleanUrl = inputUrl.trim().replace(/\/+$/, '');
    if (cleanUrl) {
      setWebUrl(cleanUrl);
      setHasError(false);
      setLoading(true);
      await AsyncStorage.setItem(STORAGE_KEY_URL, cleanUrl);
    }
    setConfigModalVisible(false);
  };

  const handleResetDefaultUrl = async () => {
    setInputUrl(DEFAULT_URL);
    setWebUrl(DEFAULT_URL);
    setHasError(false);
    setLoading(true);
    await AsyncStorage.removeItem(STORAGE_KEY_URL);
    setConfigModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Main WebView Container */}
      <View style={styles.webContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: webUrl }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="always"
          originWhitelist={['*']}
          cacheEnabled={true}
          pullToRefreshEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#E6B447" />
              <Text style={styles.loadingTitle}>SUBA • சுபா</Text>
              <Text style={styles.loadingSubtitle}>
                குறளறிந்து வாழ்வோம் • Thirukkural Wisdom
              </Text>
            </View>
          )}
          onLoadStart={() => {
            setLoading(true);
            setHasError(false);
          }}
          onLoadEnd={() => {
            setLoading(false);
          }}
          onError={(syntheticEvent: any) => {
            const { nativeEvent } = syntheticEvent;
            setLoading(false);
            setHasError(true);
            setErrorMessage(nativeEvent?.description || 'Connection failed');
          }}
          onNavigationStateChange={(navState: any) => {
            setCanGoBack(Boolean(navState?.canGoBack));
          }}
        />

        {/* Error Fallback Banner if PC/Wi-Fi is disconnected */}
        {hasError && (
          <View style={styles.errorContainer}>
            <Ionicons name="wifi-outline" size={48} color="#E6B447" />
            <Text style={styles.errorTitle}>இணைக்க முடியவில்லை</Text>
            <Text style={styles.errorSubtitle}>
              Unable to reach SUBA at:
            </Text>
            <Text style={styles.errorUrl}>{webUrl}</Text>
            <Text style={styles.errorInstructions}>
              1. Make sure your phone and laptop are on the same Wi-Fi.{"\n"}
              2. Make sure your laptop is running Vite on your local network.{"\n"}
              3. You can also change the URL to a tunnel or cloud link.
            </Text>

            <View style={styles.errorActions}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setHasError(false);
                  setLoading(true);
                  webViewRef.current?.reload();
                }}
              >
                <Ionicons name="refresh" size={18} color="#071F18" />
                <Text style={styles.retryButtonText}>Retry • மீண்டும் முயல்க</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setConfigModalVisible(true)}
              >
                <Ionicons name="settings-outline" size={18} color="#E6B447" />
                <Text style={styles.settingsButtonText}>Change URL</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Floating Settings Gear (top-right corner to allow switching network URL anytime) */}
      <TouchableOpacity
        style={styles.floatingSettings}
        onPress={() => setConfigModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="settings-sharp" size={16} color="#E6B447" />
      </TouchableOpacity>

      {/* Modal for setting custom backend / webpage URL */}
      <Modal
        visible={configModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfigModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configure SUBA Server</Text>
              <TouchableOpacity onPress={() => setConfigModalVisible(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Enter the URL of your SUBA server (Wi-Fi LAN IP or Cloud URL):
            </Text>

            <TextInput
              style={styles.modalInput}
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="http://192.168.0.9:5173"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalResetButton}
                onPress={handleResetDefaultUrl}
              >
                <Text style={styles.modalResetText}>Reset Default</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveUrl}
              >
                <Text style={styles.modalSaveText}>Save & Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071F18',
  },
  webContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#071F18',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#071F18',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 10,
  },
  loadingTitle: {
    color: '#E6B447',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    letterSpacing: 1,
  },
  loadingSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#071F18',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 20,
  },
  errorTitle: {
    color: '#E6B447',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  errorSubtitle: {
    color: '#F8FAFC',
    fontSize: 13,
    marginTop: 4,
  },
  errorUrl: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  errorInstructions: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'left',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(230, 180, 71, 0.2)',
    marginBottom: 20,
    width: '100%',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6B447',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    gap: 6,
  },
  retryButtonText: {
    color: '#071F18',
    fontWeight: 'bold',
    fontSize: 13,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 180, 71, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(230, 180, 71, 0.4)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  settingsButtonText: {
    color: '#E6B447',
    fontWeight: 'bold',
    fontSize: 13,
  },
  floatingSettings: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 10,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(7, 31, 24, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(230, 180, 71, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0F382A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(230, 180, 71, 0.4)',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#E6B447',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalDescription: {
    color: '#CBD5E1',
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  modalInput: {
    backgroundColor: '#071F18',
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(230, 180, 71, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalResetButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  modalResetText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  modalSaveButton: {
    backgroundColor: '#E6B447',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  modalSaveText: {
    color: '#071F18',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
