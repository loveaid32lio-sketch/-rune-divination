import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Reading {
  id: string;
  rune_id: string;
  position: string;
  rune_symbol: string;
  rune_name: string;
  rune_meaning: string;
  rune_origin: string;
  interpretation: string;
  timestamp: string;
}

export default function HistoryScreen() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchReadings = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/readings`);
      const data = await response.json();
      setReadings(data);
    } catch (error) {
      console.error('Error fetching readings:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReadings();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReadings();
    setRefreshing(false);
  };

  const clearHistory = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/readings`, { method: 'DELETE' });
      setReadings([]);
    } catch (error) {
      console.error('Error clearing readings:', error);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }: { item: Reading }) => {
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity
        testID="history-item"
        style={styles.card}
        onPress={() => toggleExpand(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <Text
              style={[
                styles.cardSymbol,
                item.position === 'reversed' && styles.cardSymbolReversed,
              ]}
            >
              {item.rune_symbol}
            </Text>
          </View>
          <View style={styles.cardCenter}>
            <Text style={styles.cardName}>{item.rune_name}</Text>
            <View style={styles.cardMeta}>
              <View style={[styles.positionDot, item.position === 'reversed' && styles.positionDotReversed]} />
              <Text style={styles.cardPosition}>
                {item.position === 'upright' ? '正位置' : '逆位置'}
              </Text>
              <Text style={styles.cardDate}>{formatDate(item.timestamp)}</Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#A3B8AD"
          />
        </View>

        {isExpanded && (
          <View style={styles.cardExpanded}>
            <View style={styles.expandDivider} />
            <Text style={styles.expandLabel}>成り立ち</Text>
            <Text style={styles.expandOrigin}>{item.rune_origin}</Text>
            <Text style={styles.expandLabel}>意味</Text>
            <Text style={styles.expandMeaning}>{item.rune_meaning}</Text>
            <Text style={styles.expandLabel}>解釈</Text>
            <Text style={styles.expandInterpretation}>{item.interpretation}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
            <View>
              <Text style={styles.title}>占い履歴</Text>
              <Text style={styles.countText}>{readings.length}件の記録</Text>
            </View>
            {readings.length > 0 && (
              <TouchableOpacity
                testID="clear-history-button"
                style={styles.clearButton}
                onPress={clearHistory}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color="#A3B8AD" />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          {readings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptySymbol}>ᛟ</Text>
              <Text style={styles.emptyTitle}>まだ記録がありません</Text>
              <Text style={styles.emptyText}>ルーンを引くと、ここに記録されます</Text>
            </View>
          ) : (
            <FlatList
              testID="history-list"
              data={readings}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#D4AF37"
                />
              }
            />
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  countText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: '#A3B8AD',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(163, 184, 173, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: 'rgba(10, 26, 18, 0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    padding: 18,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLeft: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 20, 13, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardSymbol: {
    fontSize: 26,
    color: '#D4AF37',
  },
  cardSymbolReversed: {
    transform: [{ rotate: '180deg' }],
  },
  cardCenter: {
    flex: 1,
  },
  cardName: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 17,
    color: '#F4EFEA',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
    marginRight: 6,
  },
  positionDotReversed: {
    backgroundColor: '#A3B8AD',
  },
  cardPosition: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    color: '#A3B8AD',
    marginRight: 12,
  },
  cardDate: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    color: '#A3B8AD',
    opacity: 0.7,
  },
  cardExpanded: {
    marginTop: 14,
  },
  expandDivider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    marginBottom: 14,
  },
  expandLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: '#D4AF37',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  expandMeaning: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: '#A3B8AD',
    marginBottom: 12,
  },
  expandOrigin: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: '#F4EFEA',
    lineHeight: 21,
    marginBottom: 14,
  },
  expandInterpretation: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: '#F4EFEA',
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptySymbol: {
    fontSize: 60,
    color: 'rgba(212, 175, 55, 0.2)',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 20,
    color: '#F4EFEA',
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: '#A3B8AD',
    textAlign: 'center',
    lineHeight: 20,
  },
});
