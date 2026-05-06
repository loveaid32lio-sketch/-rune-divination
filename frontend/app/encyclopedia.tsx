import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Rune {
  id: string;
  symbol: string;
  name: string;
  name_en: string;
  meaning: string;
  origin: string;
  upright: string;
  reversed: string;
  reversible: boolean;
}

export default function EncyclopediaScreen() {
  const [runes, setRunes] = useState<Rune[]>([]);
  const [selectedRune, setSelectedRune] = useState<Rune | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchRunes();
  }, []);

  const fetchRunes = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/runes`);
      const data = await response.json();
      setRunes(data);
    } catch (error) {
      console.error('Error fetching runes:', error);
    }
  };

  const openDetail = (rune: Rune) => {
    setSelectedRune(rune);
    setModalVisible(true);
  };

  const renderRuneItem = ({ item, index }: { item: Rune; index: number }) => (
    <TouchableOpacity
      testID={`encyclopedia-rune-${item.id}`}
      style={styles.runeItem}
      onPress={() => openDetail(item)}
      activeOpacity={0.7}
    >
      <View style={styles.runeItemLeft}>
        <View style={styles.runeItemSymbolBox}>
          <Text style={styles.runeItemSymbol}>{item.symbol}</Text>
        </View>
      </View>
      <View style={styles.runeItemCenter}>
        <Text style={styles.runeItemName}>{item.name}</Text>
        <Text style={styles.runeItemMeaning}>{item.meaning}</Text>
      </View>
      <View style={styles.runeItemRight}>
        <Text style={styles.runeItemNumber}>{String(index + 1).padStart(2, '0')}</Text>
        <Ionicons name="chevron-forward" size={14} color="#A3B8AD" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1670073952001-1aafed4bfc02?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHxkYXJrJTIwbXlzdGljYWwlMjBmb3Jlc3R8ZW58MHx8fHwxNzc4MDgzMjM1fDA&ixlib=rb-4.1.0&q=85&w=800' }}
      style={styles.bgImage}
    >
      <LinearGradient
        colors={['rgba(6, 20, 13, 0.95)', 'rgba(6, 20, 13, 0.9)', 'rgba(6, 20, 13, 0.95)']}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>ルーン図鑑</Text>
            <Text style={styles.subtitle}>エルダーフサルク全{runes.length}文字</Text>
          </View>

          {/* Rune List */}
          <FlatList
            testID="encyclopedia-list"
            data={runes}
            renderItem={renderRuneItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Detail Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
              <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                <LinearGradient
                  colors={['#14291E', '#0A1A12', '#06140D']}
                  style={styles.modalGradient}
                >
                  {/* Close Button */}
                  <TouchableOpacity
                    testID="close-modal-button"
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={22} color="#A3B8AD" />
                  </TouchableOpacity>

                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                    {/* Symbol */}
                    <Text style={styles.modalSymbol}>{selectedRune?.symbol}</Text>
                    <Text style={styles.modalName}>{selectedRune?.name}</Text>
                    <Text style={styles.modalMeaning}>{selectedRune?.meaning}</Text>

                    {/* Reversible badge */}
                    <View style={[styles.reversibleBadge, !selectedRune?.reversible && styles.reversibleBadgeNo]}>
                      <Text style={styles.reversibleText}>
                        {selectedRune?.reversible ? '逆位置あり' : '逆位置なし'}
                      </Text>
                    </View>

                    {/* Origin */}
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionLabel}>成り立ち</Text>
                      <Text style={styles.sectionBody}>{selectedRune?.origin}</Text>
                    </View>

                    {/* Upright Meaning */}
                    <View style={styles.sectionCard}>
                      <View style={styles.sectionHeader}>
                        <View style={styles.dotGold} />
                        <Text style={styles.sectionLabel}>正位置の意味</Text>
                      </View>
                      <Text style={styles.sectionBody}>{selectedRune?.upright}</Text>
                    </View>

                    {/* Reversed Meaning */}
                    {selectedRune?.reversible && selectedRune?.reversed ? (
                      <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                          <View style={styles.dotSilver} />
                          <Text style={styles.sectionLabel}>逆位置の意味</Text>
                        </View>
                        <Text style={styles.sectionBody}>{selectedRune?.reversed}</Text>
                      </View>
                    ) : null}
                  </ScrollView>
                </LinearGradient>
              </Pressable>
            </Pressable>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 28,
    color: '#D4AF37',
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: '#A3B8AD',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  runeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 26, 18, 0.7)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.12)',
    padding: 14,
    marginBottom: 10,
  },
  runeItemLeft: {
    marginRight: 14,
  },
  runeItemSymbolBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 20, 13, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  runeItemSymbol: {
    fontSize: 24,
    color: '#D4AF37',
  },
  runeItemCenter: {
    flex: 1,
  },
  runeItemName: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 16,
    color: '#F4EFEA',
    marginBottom: 3,
  },
  runeItemMeaning: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: '#A3B8AD',
  },
  runeItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  runeItemNumber: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    color: 'rgba(163, 184, 173, 0.5)',
    letterSpacing: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(163, 184, 173, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalScroll: {
    paddingBottom: 20,
  },
  modalSymbol: {
    fontSize: 72,
    color: '#D4AF37',
    textAlign: 'center',
    textShadowColor: 'rgba(212, 175, 55, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 12,
  },
  modalName: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 26,
    color: '#F4EFEA',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalMeaning: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: '#A3B8AD',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 16,
  },
  reversibleBadge: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    marginBottom: 24,
  },
  reversibleBadgeNo: {
    borderColor: 'rgba(163, 184, 173, 0.3)',
    backgroundColor: 'rgba(163, 184, 173, 0.08)',
  },
  reversibleText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    color: '#A3B8AD',
    letterSpacing: 1,
  },
  sectionCard: {
    backgroundColor: 'rgba(6, 20, 13, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: '#D4AF37',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sectionBody: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: '#F4EFEA',
    lineHeight: 24,
  },
  dotGold: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
    marginRight: 8,
  },
  dotSilver: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A3B8AD',
    marginRight: 8,
  },
});
