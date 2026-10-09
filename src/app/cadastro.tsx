import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  KeyboardTypeOptions,
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
  danger: '#F87171',
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

function AppText(props: TextProps) {
  return <Text maxFontSizeMultiplier={1.2} {...props} />;
}

// Força da senha de 0 a 3
function forcaSenha(senha: string) {
  let pontos = 0;
  if (senha.length >= 6) pontos++;
  if (senha.length >= 8 && /[A-Z]/.test(senha) && /[a-z]/.test(senha)) pontos++;
  if (/\d/.test(senha) && /[^A-Za-z0-9]/.test(senha) && senha.length >= 8) pontos++;
  return pontos;
}

type InputFieldProps = {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  styles: ReturnType<typeof makeStyles>;
  iconSize: number;
  secure?: boolean;
  erro?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words';
  rightElement?: React.ReactNode;
};

function InputField({
  icon,
  placeholder,
  value,
  onChangeText,
  styles,
  iconSize,
  secure,
  erro,
  keyboardType = 'default',
  autoCapitalize = 'none',
  rightElement,
}: InputFieldProps) {
  const [focado, setFocado] = useState(false);

  return (
    <View
      style={[
        styles.inputWrapper,
        focado && styles.inputFocused,
        erro && styles.inputErro,
      ]}>
      <Ionicons
        name={icon}
        size={iconSize}
        color={erro ? COLORS.danger : focado ? COLORS.accent : COLORS.muted}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        maxFontSizeMultiplier={1.2}
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
      />
      {rightElement}
    </View>
  );
}

export default function CadastroScreen() {
  const { width, height } = useWindowDimensions();
  const [tecladoAberto, setTecladoAberto] = useState(false);

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

  const scale = Math.min(Math.max(Math.min(width / 390, height / 800), 0.7), 1.2);
  const s = (n: number) => Math.round(n * scale);
  const compact = height < 700 || tecladoAberto;

  const styles = useMemo(() => makeStyles(s, compact), [scale, compact]); // eslint-disable-line react-hooks/exhaustive-deps

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const nomeValido = nome.trim().length >= 3;
  const emailValido = /\S+@\S+\.\S+/.test(email);
  const senhaValida = senha.length >= 6;
  const senhasIguais = senha === confirmarSenha;
  const confirmacaoPreenchida = confirmarSenha.length > 0;
  const erroConfirmacao = confirmacaoPreenchida && !senhasIguais;
  const podeCadastrar =
    nomeValido && emailValido && senhaValida && confirmacaoPreenchida && senhasIguais && !carregando;

  const forca = forcaSenha(senha);
  const corForca = ['rgba(255,255,255,0.15)', COLORS.danger, COLORS.gold, COLORS.accent2][forca];

  // animações de entrada
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
          toValue: -6,
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

  function validar() {
    if (!nomeValido) return 'Digite seu nome completo (mínimo 3 letras).';
    if (!emailValido) return 'Digite um e-mail válido.';
    if (!senhaValida) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (!confirmacaoPreenchida) return 'Confirme sua senha.';
    if (!senhasIguais) return 'As senhas não coincidem.';
    return null;
  }

  async function handleCadastro() {
    if (carregando) return;

    const erro = validar();
    if (erro) {
      Alert.alert('Confira os dados', erro);
      return;
    }

    Keyboard.dismiss();
    setCarregando(true);
    try {
      // TODO: trocar pela chamada real à sua API
      await new Promise((r) => setTimeout(r, 1000));
      router.replace('/home');
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a conta. Tente novamente.');
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
        {/* Botão voltar */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backButton}
          android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}>
          <Ionicons name="chevron-back" size={s(22)} color={COLORS.text} />
        </Pressable>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.body}>
            <Animated.View
              style={[
                styles.content,
                { opacity: fade, transform: [{ translateY: slide }] },
              ]}>
              {/* Header */}
              <View style={styles.header}>
                {!tecladoAberto && (
                  <Animated.View
                    style={[
                      styles.logoCircle,
                      { transform: [{ translateY: float }, { rotate: '-8deg' }] },
                    ]}>
                    <LinearGradient
                      colors={[COLORS.accent, COLORS.accent2]}
                      style={styles.logoGradient}>
                      <Ionicons name="sparkles" size={s(compact ? 26 : 32)} color="#06312C" />
                    </LinearGradient>
                  </Animated.View>
                )}
                <AppText style={styles.brand}>
                  Relax<AppText style={styles.brandDot}>.</AppText>
                </AppText>
                <AppText style={styles.tagline}>Crie sua conta</AppText>
                {!compact && (
                  <AppText style={styles.subtitle}>
                    Leva menos de um minuto para começar a agendar
                  </AppText>
                )}
              </View>

              {/* Card glass */}
              <View style={styles.card}>
                <InputField
                  styles={styles}
                  iconSize={s(20)}
                  icon="person-outline"
                  placeholder="Nome completo"
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                />

                <InputField
                  styles={styles}
                  iconSize={s(20)}
                  icon="mail-outline"
                  placeholder="Seu e-mail"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />

                <View>
                  <InputField
                    styles={styles}
                    iconSize={s(20)}
                    icon="lock-closed-outline"
                    placeholder="Crie uma senha"
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
                  {/* Barrinha de força da senha */}
                  <View style={styles.strengthRow}>
                    {[1, 2, 3].map((n) => (
                      <View
                        key={n}
                        style={[
                          styles.strengthBar,
                          { backgroundColor: forca >= n ? corForca : 'rgba(255,255,255,0.15)' },
                        ]}
                      />
                    ))}
                  </View>
                </View>

                <View>
                  <InputField
                    styles={styles}
                    iconSize={s(20)}
                    icon="shield-checkmark-outline"
                    placeholder="Confirme sua senha"
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                    secure={!mostrarConfirmacao}
                    erro={erroConfirmacao}
                    rightElement={
                      <Pressable onPress={() => setMostrarConfirmacao((v) => !v)} hitSlop={12}>
                        <Ionicons
                          name={mostrarConfirmacao ? 'eye-off-outline' : 'eye-outline'}
                          size={s(20)}
                          color={COLORS.muted}
                        />
                      </Pressable>
                    }
                  />
                  {erroConfirmacao && (
                    <AppText style={styles.erroTexto}>As senhas não coincidem</AppText>
                  )}
                </View>

                <Pressable
                  onPress={handleCadastro}
                  android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: false }}
                  style={({ pressed }) => [
                    styles.buttonWrapper,
                    !podeCadastrar && { opacity: 0.65 },
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
                        <AppText style={styles.buttonText}>Criar conta</AppText>
                        <Ionicons name="arrow-forward" size={s(20)} color="#06312C" />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>

              {/* Rodapé (some com o teclado aberto pra caber na tela) */}
              {!tecladoAberto && (
                <View style={styles.footer}>
                  <AppText style={styles.footerText}>Já tem conta?</AppText>
                  <Pressable onPress={() => router.back()} hitSlop={10}>
                    <AppText style={styles.footerLink}>Entrar</AppText>
                  </Pressable>
                </View>
              )}
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
    body: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: s(24),
    },
    content: {
      width: '100%',
      maxWidth: 440,
      alignSelf: 'center',
    },

    backButton: {
      position: 'absolute',
      top: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + s(8) : s(8),
      left: s(16),
      zIndex: 10,
      width: Math.max(s(40), 40),
      height: Math.max(s(40), 40),
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.glass,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
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

    header: { alignItems: 'center', marginBottom: s(compact ? 12 : 20) },
    logoCircle: {
      marginBottom: s(compact ? 8 : 14),
      borderRadius: s(24),
      backgroundColor: COLORS.accent,
      ...shadow(COLORS.accent, 24, 8, 0.6, 12),
    },
    logoGradient: {
      width: s(compact ? 52 : 68),
      height: s(compact ? 52 : 68),
      borderRadius: s(24),
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
      marginTop: s(8),
      lineHeight: s(21),
      paddingHorizontal: s(12),
    },

    brand: {
      color: COLORS.text,
      fontSize: s(compact ? 34 : 40),
      lineHeight: s(compact ? 40 : 46),
      fontWeight: '800',
      letterSpacing: -1,
      textAlign: 'center',
    },
    brandDot: {
      color: COLORS.gold,
    },
    tagline: {
      color: COLORS.accent,
      fontSize: s(15),
      fontWeight: '600',
      letterSpacing: 1,
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
      minHeight: Math.max(s(52), 48),
    },
    inputFocused: {
      borderColor: COLORS.accent,
      backgroundColor: 'rgba(45,212,191,0.08)',
    },
    inputErro: {
      borderColor: COLORS.danger,
      backgroundColor: 'rgba(248,113,113,0.08)',
    },
    input: {
      flex: 1,
      color: COLORS.text,
      fontSize: Math.max(s(16), 16),
      paddingVertical: Platform.OS === 'android' ? 0 : s(14),
      includeFontPadding: false,
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    },

    strengthRow: {
      flexDirection: 'row',
      gap: s(6),
      marginTop: s(8),
      paddingHorizontal: s(4),
    },
    strengthBar: {
      flex: 1,
      height: 4,
      borderRadius: 2,
    },
    erroTexto: {
      color: COLORS.danger,
      fontSize: s(12),
      marginTop: s(6),
      marginLeft: s(4),
    },

    buttonWrapper: {
      borderRadius: s(16),
      overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
      backgroundColor: COLORS.accent,
      marginTop: s(2),
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