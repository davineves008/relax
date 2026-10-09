import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TextProps,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  bgTop: '#0B1F1C',
  bgBottom: '#134E4A',
  accent: '#2DD4BF',
  accent2: '#34D399',
  gold: '#F5C26B',
  text: '#F0FDFA',
  muted: 'rgba(240,253,250,0.6)',
  glass: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.15)',
};

// Sombra diferente para iOS (shadow*) e Android (elevation)
const shadow = (color: string, radius: number, y: number, opacity: number, elevation: number) =>
  Platform.select({
    ios: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: y },
    },
    android: { elevation },
    default: {},
  }) ?? {};

// Texto que não estoura o layout se o usuário usar fonte gigante nas configurações
function AppText(props: TextProps) {
  return <Text maxFontSizeMultiplier={1.2} {...props} />;
}

type InputFieldProps = {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  styles: ReturnType<typeof makeStyles>;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address';
  rightElement?: React.ReactNode;
  iconSize: number;
};

function InputField({
  icon,
  placeholder,
  value,
  onChangeText,
  styles,
  secure,
  keyboardType = 'default',
  rightElement,
  iconSize,
}: InputFieldProps) {
  const [focado, setFocado] = useState(false);

  return (
    <View style={[styles.inputWrapper, focado && styles.inputFocused]}>
      <Ionicons name={icon} size={iconSize} color={focado ? COLORS.accent : COLORS.muted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        maxFontSizeMultiplier={1.2}
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
      />
      {rightElement}
    </View>
  );
}

export default function LoginScreen() {
  const { width, height } = useWindowDimensions();
  const [tecladoAberto, setTecladoAberto] = useState(false);

  // Detecta o teclado para liberar espaço (a tela não rola)
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setTecladoAberto(true));
    const hide = Keyboard.addListener(hideEvent, () => setTecladoAberto(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Escala considera largura E altura, pra tudo caber na tela sem rolar
  const scale = Math.min(Math.max(Math.min(width / 390, height / 800), 0.7), 1.2);
  const s = (n: number) => Math.round(n * scale);
  const compact = height < 700 || tecladoAberto;

  const styles = useMemo(() => makeStyles(s, compact), [scale, compact]); // eslint-disable-line react-hooks/exhaustive-deps

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const emailValido = /\S+@\S+\.\S+/.test(email);
  const podeEntrar = emailValido && senha.length >= 6 && !carregando;

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: -8,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fade, slide, float]);

  async function handleLogin() {
    if (!podeEntrar) return;
    Keyboard.dismiss();
    setCarregando(true);
    try {
      // TODO: trocar pela chamada real à sua API
      await new Promise((r) => setTimeout(r, 1000));
    router.replace('/home');
      // router.replace('/home');
    } catch {
      Alert.alert('Erro', 'Não foi possível entrar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        translucent={Platform.OS === 'android'}
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={[COLORS.bgTop, COLORS.bgBottom]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Container fixo (sem ScrollView) */}
          <View style={styles.body}>
            <Animated.View
              style={[
                styles.content,
                { opacity: fade, transform: [{ translateY: slide }] },
              ]}>
              {/* Header */}
              <View style={styles.header}>
                <Animated.View
                  style={[
                    styles.logoCircle,
                    { transform: [{ translateY: float }, { rotate: '-8deg' }] },
                  ]}>
                  <LinearGradient
                    colors={[COLORS.accent, COLORS.accent2]}
                    style={styles.logoGradient}>
                    <Ionicons name="leaf" size={s(compact ? 30 : 38)} color="#06312C" />
                  </LinearGradient>
                </Animated.View>
               <AppText style={styles.brand}>
  Relax<AppText style={styles.brandDot}>.</AppText>
</AppText>
<AppText style={styles.tagline}>Relaxe. Agende. Renove-se.</AppText>
{!compact && (
  <AppText style={styles.subtitle}>
    Encontre os melhores profissionais de massagem perto de você
  </AppText>
)}
              </View>

              {/* Card glass */}
              <View style={styles.card}>
                <InputField
                  styles={styles}
                  iconSize={s(20)}
                  icon="mail-outline"
                  placeholder="Seu e-mail"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />

                <InputField
                  styles={styles}
                  iconSize={s(20)}
                  icon="lock-closed-outline"
                  placeholder="Sua senha"
                  value={senha}
                  onChangeText={setSenha}
                  secure={!mostrarSenha}
                  rightElement={
                    <Pressable onPress={() => setMostrarSenha((v) => !v)} hitSlop={12}>
                      <Ionicons
                        name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                        size={s(20)}
                        color={COLORS.muted}
                      />
                    </Pressable>
                  }
                />

                <Pressable
                  onPress={() => Alert.alert('Recuperar senha', 'Em breve!')}
                  hitSlop={8}
                  style={styles.forgot}>
                  <AppText style={styles.forgotText}>Esqueceu a senha?</AppText>
                </Pressable>

                <Pressable
                  onPress={handleLogin}
                  disabled={!podeEntrar}
                  android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: false }}
                  style={({ pressed }) => [
                    styles.buttonWrapper,
                    !podeEntrar && { opacity: 0.45 },
                    pressed && Platform.OS === 'ios' && { transform: [{ scale: 0.98 }] },
                  ]}>
                  <LinearGradient
                    colors={[COLORS.accent, COLORS.accent2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.button}>
                    {carregando ? (
                      <ActivityIndicator color="#06312C" />
                    ) : (
                      <>
                        <AppText style={styles.buttonText}>Entrar</AppText>
                        <Ionicons name="arrow-forward" size={s(20)} color="#06312C" />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>

                {/* Login social: some quando o teclado está aberto pra caber na tela */}
                {!tecladoAberto && (
                  <>
                    <View style={styles.dividerRow}>
                     
                    </View>

                    
                  </>
                )}
              </View>

              {/* Rodapé */}
              <View style={styles.footer}>
                <AppText style={styles.footerText}>Novo por aqui?</AppText>
                <Pressable onPress={() => router.push('/cadastro')} hitSlop={10}>
                  <AppText style={styles.footerLink}>Crie sua conta</AppText>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(s: (n: number) => number, compact: boolean) {
  return StyleSheet.create({
    flex: { flex: 1 },
    root: { flex: 1, backgroundColor: COLORS.bgTop },
    // Ocupa a tela toda e centraliza o conteúdo, sem rolagem
    body: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: s(24),
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
    },
    // limita a largura em tablets / telas grandes
    content: {
      width: '100%',
      maxWidth: 440,
      alignSelf: 'center',
    },

    blob: { position: 'absolute', borderRadius: 999 },
    blobTop: {
      width: s(280),
      height: s(280),
      top: -s(90),
      right: -s(90),
      backgroundColor: 'rgba(45,212,191,0.22)',
    },
    blobBottom: {
      width: s(320),
      height: s(320),
      bottom: -s(120),
      left: -s(110),
      backgroundColor: 'rgba(245,194,107,0.14)',
    },

    header: { alignItems: 'center', marginBottom: s(compact ? 14 : 24) },
    logoCircle: {
      marginBottom: s(compact ? 10 : 18),
      borderRadius: s(28),
      backgroundColor: COLORS.accent, // necessário pra elevation renderizar certo no Android
      ...shadow(COLORS.accent, 24, 8, 0.6, 12),
    },
    logoGradient: {
      width: s(compact ? 60 : 80),
      height: s(compact ? 60 : 80),
      borderRadius: s(28),
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      color: COLORS.text,
      fontSize: s(compact ? 24 : 30),
      fontWeight: '800',
      textAlign: 'center',
      lineHeight: s(compact ? 30 : 36),
      letterSpacing: -0.5,
    },
    subtitle: {
      color: COLORS.muted,
      fontSize: s(15),
      textAlign: 'center',
      marginTop: s(10),
      lineHeight: s(21),
      paddingHorizontal: s(12),
    },

        brand: {
      color: COLORS.text,
      fontSize: s(compact ? 38 : 48),
      lineHeight: s(compact ? 44 : 56),
      fontWeight: '800',
      letterSpacing: -1,
      textAlign: 'center',
    },
    brandDot: {
      color: COLORS.gold,
    },
    tagline: {
      color: COLORS.accent,
      fontSize: s(14),
      fontWeight: '600',
      letterSpacing: 1.2,
      textAlign: 'center',
      marginTop: s(2),
    },

    card: {
      backgroundColor: COLORS.glass,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
      borderRadius: s(28),
      padding: s(18),
      gap: s(12),
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(12),
      backgroundColor: 'rgba(0,0,0,0.25)',
      borderWidth: 1.5,
      borderColor: 'transparent',
      borderRadius: s(16),
      paddingHorizontal: s(16),
      minHeight: Math.max(s(54), 48), // nunca menor que a área de toque recomendada
    },
    inputFocused: {
      borderColor: COLORS.accent,
      backgroundColor: 'rgba(45,212,191,0.08)',
    },
    input: {
      flex: 1,
      color: COLORS.text,
      fontSize: Math.max(s(16), 16),
      paddingVertical: Platform.OS === 'android' ? 0 : s(14),
      includeFontPadding: false,
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    },
    forgot: { alignSelf: 'flex-end' },
    forgotText: { color: COLORS.gold, fontSize: s(13), fontWeight: '600' },

    buttonWrapper: {
      borderRadius: s(16),
      overflow: Platform.OS === 'android' ? 'hidden' : 'visible', // ripple respeita o arredondado
      backgroundColor: COLORS.accent,
      ...shadow(COLORS.accent, 16, 6, 0.45, 8),
    },
    button: {
      minHeight: Math.max(s(54), 48),
      borderRadius: s(16),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(8),
    },
    buttonText: { color: '#06312C', fontSize: s(17), fontWeight: '800' },

    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: s(12), marginTop: s(2) },
    divider: { flex: 1, height: 1, backgroundColor: COLORS.glassBorder },
    dividerText: { color: COLORS.muted, fontSize: s(12) },

    socialRow: { flexDirection: 'row', gap: s(12) },
    socialButton: {
      flex: 1,
      minHeight: Math.max(s(48), 46),
      borderRadius: s(14),
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
      backgroundColor: COLORS.glass,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(8),
      overflow: 'hidden',
    },
    socialText: { color: COLORS.text, fontWeight: '600', fontSize: s(15) },

    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: s(6),
      marginTop: s(compact ? 14 : 20),
    },
    footerText: { color: COLORS.muted, fontSize: s(14) },
    footerLink: { color: COLORS.accent, fontSize: s(14), fontWeight: '700' },
  });


}