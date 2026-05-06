import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface RuneResult {
  rune_id: string;
  position: string;
  symbol: string;
  name: string;
  meaning: string;
  origin: string;
  interpretation: string;
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const contentMaxWidth = isDesktop ? 520 : width;

  const [result, setResult] = useState<RuneResult | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (showResult) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [showResult]);

  const drawRune = async () => {
    setIsDrawing(true);
    setShowResult(false);

    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    try {
      const response = await fetch(`${BACKEND_URL}/api/draw`, { method: 'POST' });
      const data = await response.json();
      setResult(data);

      await fetch(`${BACKEND_URL}/api/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rune_id: data.rune_id, position: data.position }),
      });

      setTimeout(() => {
        setIsDrawing(false);
        setShowResult(true);
        Animated.parallel([
          Animated.spring(cardScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
          Animated.timing(cardOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start();
      }, 1200);
    } catch (error) {
      console.error('Error drawing rune:', error);
      setIsDrawing(false);
    }
  };

  const resetDraw = () => {
    Animated.parallel([
      Animated.timing(cardScale, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setShowResult(false);
      setResult(null);
    });
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1670073952001-1aafed4bfc02?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHxkYXJrJTIwbXlzdGljYWwlMjBmb3Jlc3R8ZW58MHx8fHwxNzc4MDgzMjM1fDA&ixlib=rb-4.1.0&q=85&w=1200' }}
      style={styles.bgImage}
    >
      <LinearGradient
        colors={['rgba(6, 20, 13, 0.92)', 'rgba(6, 20, 13, 0.85)', 'rgba(6, 20, 13, 0.95)']}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.container}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, isDesktop && styles.titleDesktop]}>ルーン占い</Text>
              <Text style={styles.subtitle}>一枚引き</Text>
            </View>

            {!showResult ? (
              <View style={[styles.drawArea, isDesktop && styles.drawAreaDesktop]}>
                <Animated.View style={[styles.glowCircle, isDesktop && styles.glowCircleDesktop, { opacity: glowAnim }]} />
                <TouchableOpacity
                  testID="draw-rune-button"
                  style={styles.drawButton}
                  onPress={drawRune}
                  disabled={isDrawing}
                  activeOpacity={0.7}
                >
                  <Animated.View style={[styles.drawButtonInner, isDesktop && styles.drawButtonInnerDesktop, { transform: [{ scale: buttonScale }] }]}>
                    {isDrawing ? (
                      <View style={styles.drawingState}>
                        <Animated.Text style={[styles.drawingSymbol, { opacity: glowAnim }]}>ᚱ</Animated.Text>
                        <Text style={styles.drawingText}>引いています...</Text>
                      </View>
                    ) : (
                      <View style={styles.readyState}>
                        <Text style={[styles.runePreview, isDesktop && styles.runePreviewDesktop]}>ᛟ</Text>
                        <Text style={styles.drawText}>タップしてルーンを引く</Text>
                      </View>
                    )}
                  </Animated.View>
                </TouchableOpacity>
                <Text style={[styles.hint, isDesktop && styles.hintDesktop]}>心を落ち着けて、問いを念じてください</Text>
              </View>
            ) : (
              <Animated.View
                testID="rune-result-card"
                style={[
                  styles.resultCard,
                  {
                    transform: [{ scale: cardScale }],
                    opacity: cardOpacity,
                  },
                ]}
              >
                <LinearGradient
                  colors={['#14291E', '#0A1A12']}
                  style={[styles.resultGradient, isDesktop && styles.resultGradientDesktop]}
                >
                  <View style={[styles.positionBadge, result?.position === 'reversed' && styles.positionBadgeReversed]}>
                    <Text style={styles.positionText}>
                      {result?.position === 'upright' ? '正位置' : '逆位置'}
                    </Text>
                  </View>

                  <Animated.Text
                    style={[
                      styles.runeSymbol,
                      isDesktop && styles.runeSymbolDesktop,
                      result?.position === 'reversed' && styles.runeReversed,
                      { opacity: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                    ]}
                  >
                    {result?.symbol}
                  </Animated.Text>

                  <Text style={[styles.runeName, isDesktop && styles.runeNameDesktop]}>{result?.name}</Text>
                  <Text style={styles.runeMeaning}>{result?.meaning}</Text>

                  <View style={[styles.originSection, isDesktop && styles.originSectionDesktop]}>
                    <Text style={styles.originLabel}>成り立ち</Text>
                    <Text style={[styles.originText, isDesktop && styles.originTextDesktop]}>{result?.origin}</Text>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.interpretationLabel}>解釈</Text>
                  <Text style={[styles.interpretation, isDesktop && styles.interpretationDesktop]}>{result?.interpretation}</Text>

                  <TouchableOpacity
                    testID="draw-again-button"
                    style={styles.drawAgainButton}
                    onPress={resetDraw}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.drawAgainText}>もう一度引く</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            )}
          </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 36,
    color: '#D4AF37',
    letterSpacing: 4,
    textShadowColor: 'rgba(212, 175, 55, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  titleDesktop: {
    fontSize: 48,
    letterSpacing: 8,
  },
  subtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: '#A3B8AD',
    letterSpacing: 6,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  drawArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  drawAreaDesktop: {
    minHeight: 500,
  },
  glowCircle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  glowCircleDesktop: {
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  drawButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawButtonInner: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(10, 26, 18, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  drawButtonInnerDesktop: {
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  readyState: {
    alignItems: 'center',
  },
  runePreview: {
    fontFamily: 'CormorantGaramond_300Light',
    fontSize: 60,
    color: 'rgba(212, 175, 55, 0.4)',
    marginBottom: 8,
  },
  runePreviewDesktop: {
    fontSize: 72,
  },
  drawText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: '#D4AF37',
    letterSpacing: 1,
    textAlign: 'center',
  },
  drawingState: {
    alignItems: 'center',
  },
  drawingSymbol: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 60,
    color: '#D4AF37',
    marginBottom: 8,
  },
  drawingText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: '#A3B8AD',
    letterSpacing: 1,
  },
  hint: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: '#A3B8AD',
    marginTop: 30,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  hintDesktop: {
    fontSize: 14,
    marginTop: 40,
  },
  resultCard: {
    flex: 1,
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  resultGradient: {
    padding: 32,
    alignItems: 'center',
  },
  resultGradientDesktop: {
    padding: 48,
  },
  positionBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    marginBottom: 20,
  },
  positionBadgeReversed: {
    borderColor: 'rgba(163, 184, 173, 0.4)',
    backgroundColor: 'rgba(163, 184, 173, 0.1)',
  },
  positionText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: '#D4AF37',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  runeSymbol: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 100,
    color: '#D4AF37',
    textShadowColor: 'rgba(212, 175, 55, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
    marginBottom: 16,
  },
  runeSymbolDesktop: {
    fontSize: 120,
  },
  runeReversed: {
    transform: [{ rotate: '180deg' }],
  },
  runeName: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 26,
    color: '#F4EFEA',
    marginBottom: 6,
    textAlign: 'center',
  },
  runeNameDesktop: {
    fontSize: 32,
  },
  runeMeaning: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: '#A3B8AD',
    letterSpacing: 1,
    marginBottom: 20,
  },
  originSection: {
    width: '100%',
    backgroundColor: 'rgba(6, 20, 13, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.12)',
    padding: 16,
    marginBottom: 20,
  },
  originSectionDesktop: {
    padding: 24,
  },
  originLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: '#D4AF37',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  originText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: '#F4EFEA',
    lineHeight: 24,
  },
  originTextDesktop: {
    fontSize: 15,
    lineHeight: 28,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    marginVertical: 20,
  },
  interpretationLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: '#D4AF37',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  interpretation: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    color: '#F4EFEA',
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  interpretationDesktop: {
    fontSize: 16,
    lineHeight: 30,
  },
  drawAgainButton: {
    marginTop: 30,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  drawAgainText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: '#D4AF37',
    letterSpacing: 2,
  },
});
