import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextProps,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Perfil, USUARIO_TESTE } from '@/constants/perfis';
import { LIMITES, validarEmail, validarNome } from '@/constants/limites';

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

const PERFIL_LABEL: Record<Perfil, string> = {
  cliente: 'Cliente',
  aluno: 'Aluno',
  professor: 'Professor',
};

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
}

/* ---------- Linha de opção reutilizável ---------- */

type LinhaProps = {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descricao?: string;
  cor?: string;
  onPress?: () => void;
  direita?: React.ReactNode;
  ultima?: boolean;
  styles: ReturnType<typeof makeStyles>;
  s: (n: number) => number;
};

function Linha({ icone, titulo, descricao, cor = COLORS.accent, onPress, direita, ultima, styles, s }: LinhaProps) {
  const conteudo = (
    <View style={[styles.linha, !ultima && styles.linhaBorda]}>
      <View style={[styles.linhaIcone, { backgroundColor: `${cor}1F`, borderColor: `${cor}55` }]}>
        <Ionicons name={icone} size={s(18)} color={cor} />
      </View>
      <View style={styles.flex}>
        <AppText style={[styles.linhaTitulo, cor === COLORS.danger && { color: COLORS.danger }]}>{titulo}</AppText>
        {descricao ? <AppText style={styles.linhaDescricao}>{descricao}</AppText> : null}
      </View>
      {direita ?? (onPress ? <Ionicons name="chevron-forward" size={s(18)} color={COLORS.muted} /> : null)}
    </View>
  );

  if (!onPress) return conteudo;
  return (
    <Pressable onPress={onPress} android_ripple={{ color: 'rgba(255,255,255,0.08)' }}>
      {conteudo}
    </Pressable>
  );
}

/* ---------- Tela ---------- */

export default function PerfilScreen() {
  const { width } = useWindowDimensions();
  const scale = Math.min(Math.max(width / 390, 0.85), 1.2);
  const s = (n: number) => Math.round(n * scale);
  const styles = useMemo(() => makeStyles(s), [scale]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dados provisórios; na integração real vêm da autenticação / API
  const [nome, setNome] = useState(USUARIO_TESTE.nome);
  const [email, setEmail] = useState('seu.email@exemplo.com');
  const perfil: Perfil = USUARIO_TESTE.perfil;

  // edição
  const [editando, setEditando] = useState(false);
  const [nomeEdit, setNomeEdit] = useState(nome);
  const [emailEdit, setEmailEdit] = useState(email);
  const [campoFocado, setCampoFocado] = useState<'nome' | 'email' | null>(null);

  // preferências
  const [notificacoes, setNotificacoes] = useState(true);
  const [lembretes, setLembretes] = useState(true);

  // animação de entrada
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  function iniciarEdicao() {
    setNomeEdit(nome);
    setEmailEdit(email);
    setEditando(true);
  }

  function salvar() {
    const erro = validarNome(nomeEdit) ?? validarEmail(emailEdit);
    if (erro) {
      Alert.alert('Confira os dados', erro);
      return;
    }
    // TODO: enviar as alterações para a API
    setNome(nomeEdit.trim());
    setEmail(emailEdit.trim());
    setEditando(false);
  }

  function sair() {
    Alert.alert('Sair da conta', 'Deseja realmente sair?', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        // TODO: limpar o token / sessão antes de navegar
        onPress: () => router.replace('/'),
      },
    ]);
  }

  function excluirConta() {
    Alert.alert(
      'Excluir conta',
      'Todos os seus dados e reservas serão apagados. Essa ação não pode ser desfeita.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Excluir conta',
          style: 'destructive',
          // TODO: chamar a API para excluir a conta e depois sair
          onPress: () => router.replace('/'),
        },
      ]
    );
  }

  const emBreve = (titulo: string) => () => Alert.alert(titulo, 'Em breve!');

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
          <Animated.View
            style={[styles.flex, styles.container, { opacity: fade, transform: [{ translateY: slide }] }]}>
            {/* Cabeçalho */}
            <View style={styles.header}>
              <Pressable
                onPress={voltar}
                hitSlop={10}
                style={styles.backButton}
                android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}>
                <Ionicons name="chevron-back" size={s(22)} color={COLORS.text} />
              </Pressable>
              <AppText style={styles.title}>Meu perfil</AppText>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}>
              {/* Identidade */}
              <View style={styles.identidade}>
                <View style={styles.avatarWrapper}>
                  <View style={styles.avatar}>
                    <LinearGradient colors={[COLORS.accent, COLORS.accent2]} style={styles.avatarInner}>
                      <Text style={styles.avatarText}>{iniciais(nome)}</Text>
                    </LinearGradient>
                  </View>
                  <Pressable
                    onPress={emBreve('Foto de perfil')}
                    hitSlop={8}
                    style={styles.cameraBadge}
                    accessibilityLabel="Alterar foto de perfil">
                    <Ionicons name="camera" size={s(16)} color="#3B2A06" />
                  </Pressable>
                </View>

                <AppText style={styles.nome} numberOfLines={1}>
                  {nome}
                </AppText>
                <AppText style={styles.email} numberOfLines={1}>
                  {email}
                </AppText>
                <View style={styles.perfilBadge}>
                  <Ionicons name="leaf" size={s(12)} color={COLORS.accent} />
                  <AppText style={styles.perfilBadgeText}>{PERFIL_LABEL[perfil]}</AppText>
                </View>
              </View>

              {/* Números */}
              <View style={styles.stats}>
                {[
                  { valor: '12', rotulo: 'Reservas' },
                  { valor: '4', rotulo: 'Avaliações' },
                  { valor: 'Set/26', rotulo: 'Membro desde' },
                ].map((item, i) => (
                  <View key={item.rotulo} style={[styles.stat, i > 0 && styles.statBorda]}>
                    <AppText style={styles.statValor}>{item.valor}</AppText>
                    <AppText style={styles.statRotulo}>{item.rotulo}</AppText>
                  </View>
                ))}
              </View>

              {/* Dados pessoais */}
              <View style={styles.secao}>
                <View style={styles.secaoHeader}>
                  <AppText style={styles.secaoTitulo}>Dados pessoais</AppText>
                  <Pressable
                    onPress={editando ? () => setEditando(false) : iniciarEdicao}
                    hitSlop={10}
                    style={styles.editarBtn}>
                    <Ionicons
                      name={editando ? 'close' : 'create-outline'}
                      size={s(16)}
                      color={editando ? COLORS.danger : COLORS.accent}
                    />
                    <AppText style={[styles.editarText, editando && { color: COLORS.danger }]}>
                      {editando ? 'Cancelar' : 'Editar'}
                    </AppText>
                  </Pressable>
                </View>

                <View style={styles.card}>
                  {editando ? (
                    <View style={styles.form}>
                      <View style={[styles.inputWrapper, campoFocado === 'nome' && styles.inputFocused]}>
                        <Ionicons
                          name="person-outline"
                          size={s(20)}
                          color={campoFocado === 'nome' ? COLORS.accent : COLORS.muted}
                        />
                        <TextInput
                          style={styles.input}
                          value={nomeEdit}
                          onChangeText={setNomeEdit}
                          placeholder="Nome completo"
                          placeholderTextColor={COLORS.muted}
                          autoCapitalize="words"
                          autoCorrect={false}
                          maxLength={LIMITES.nome.max}
                          maxFontSizeMultiplier={1.2}
                          onFocus={() => setCampoFocado('nome')}
                          onBlur={() => setCampoFocado(null)}
                        />
                        {nomeEdit.length >= LIMITES.nome.max * 0.8 && (
                          <AppText
                            style={[
                              styles.contadorCampo,
                              nomeEdit.length >= LIMITES.nome.max && { color: COLORS.danger },
                            ]}>
                            {nomeEdit.length}/{LIMITES.nome.max}
                          </AppText>
                        )}
                      </View>

                      <View style={[styles.inputWrapper, campoFocado === 'email' && styles.inputFocused]}>
                        <Ionicons
                          name="mail-outline"
                          size={s(20)}
                          color={campoFocado === 'email' ? COLORS.accent : COLORS.muted}
                        />
                        <TextInput
                          style={styles.input}
                          value={emailEdit}
                          onChangeText={(t) => setEmailEdit(t.replace(/\s/g, ''))}
                          placeholder="Seu e-mail"
                          placeholderTextColor={COLORS.muted}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          maxLength={LIMITES.email.max}
                          maxFontSizeMultiplier={1.2}
                          onFocus={() => setCampoFocado('email')}
                          onBlur={() => setCampoFocado(null)}
                        />
                        {emailEdit.length >= LIMITES.email.max * 0.8 && (
                          <AppText
                            style={[
                              styles.contadorCampo,
                              emailEdit.length >= LIMITES.email.max && { color: COLORS.danger },
                            ]}>
                            {emailEdit.length}/{LIMITES.email.max}
                          </AppText>
                        )}
                      </View>

                      <Pressable
                        onPress={salvar}
                        android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: false }}
                        style={({ pressed }) => [
                          styles.buttonWrapper,
                          pressed && Platform.OS === 'ios' && { transform: [{ scale: 0.98 }] },
                        ]}>
                        <LinearGradient
                          colors={[COLORS.accent, COLORS.accent2]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.button}>
                          <Ionicons name="checkmark" size={s(20)} color="#06312C" />
                          <AppText style={styles.buttonText}>Salvar alterações</AppText>
                        </LinearGradient>
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <Linha styles={styles} s={s} icone="person-outline" titulo="Nome" descricao={nome} />
                      <Linha styles={styles} s={s} icone="mail-outline" titulo="E-mail" descricao={email} ultima />
                    </>
                  )}
                </View>
              </View>

              {/* Preferências */}
              <View style={styles.secao}>
                <AppText style={styles.secaoTitulo}>Preferências</AppText>
                <View style={styles.card}>
                  <Linha
                    styles={styles}
                    s={s}
                    icone="notifications-outline"
                    titulo="Notificações"
                    descricao="Novidades e confirmações"
                    direita={
                      <Switch
                        value={notificacoes}
                        onValueChange={setNotificacoes}
                        trackColor={{ false: 'rgba(255,255,255,0.2)', true: COLORS.accent }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="rgba(255,255,255,0.2)"
                      />
                    }
                  />
                  <Linha
                    styles={styles}
                    s={s}
                    icone="alarm-outline"
                    titulo="Lembretes de reserva"
                    descricao="Aviso antes do horário marcado"
                    ultima
                    direita={
                      <Switch
                        value={lembretes}
                        onValueChange={setLembretes}
                        trackColor={{ false: 'rgba(255,255,255,0.2)', true: COLORS.accent }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="rgba(255,255,255,0.2)"
                      />
                    }
                  />
                </View>
              </View>

              {/* Conta e segurança */}
              <View style={styles.secao}>
                <AppText style={styles.secaoTitulo}>Conta e segurança</AppText>
                <View style={styles.card}>
                  <Linha
                    styles={styles}
                    s={s}
                    icone="lock-closed-outline"
                    titulo="Alterar senha"
                    onPress={emBreve('Alterar senha')}
                  />
                  <Linha
                    styles={styles}
                    s={s}
                    icone="help-circle-outline"
                    titulo="Ajuda e suporte"
                    onPress={emBreve('Ajuda e suporte')}
                  />
                  <Linha
                    styles={styles}
                    s={s}
                    icone="document-text-outline"
                    titulo="Termos e privacidade"
                    onPress={emBreve('Termos e privacidade')}
                    ultima
                  />
                </View>
              </View>

              {/* Sair e excluir */}
              <View style={styles.secao}>
                <View style={styles.card}>
                  <Linha
                    styles={styles}
                    s={s}
                    icone="log-out-outline"
                    titulo="Sair da conta"
                    cor={COLORS.gold}
                    onPress={sair}
                  />
                  <Linha
                    styles={styles}
                    s={s}
                    icone="trash-outline"
                    titulo="Excluir minha conta"
                    cor={COLORS.danger}
                    onPress={excluirConta}
                    ultima
                  />
                </View>
              </View>

              <AppText style={styles.versao}>Relax · versão 1.0.0</AppText>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(s: (n: number) => number) {
  return StyleSheet.create({
    flex: { flex: 1 },
    root: { flex: 1, backgroundColor: COLORS.bgTop },
    container: {
      width: '100%',
      maxWidth: 520,
      alignSelf: 'center',
      paddingHorizontal: s(20),
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

    /* Cabeçalho */
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(14),
      paddingTop: s(Platform.OS === 'android' ? 20 : 8),
      paddingBottom: s(8),
    },
    backButton: {
      width: Math.max(s(40), 40),
      height: Math.max(s(40), 40),
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.glass,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
    },
    title: { color: COLORS.text, fontSize: s(26), fontWeight: '800', letterSpacing: -0.5 },

    scrollContent: { paddingBottom: s(32), gap: s(22) },

    /* Identidade */
    identidade: { alignItems: 'center', gap: s(6), paddingTop: s(8) },
    avatarWrapper: { marginBottom: s(8) },
    avatar: {
      width: s(110),
      height: s(110),
      borderRadius: 999,
      padding: s(3),
      backgroundColor: COLORS.gold,
      ...shadow(COLORS.gold, 18, 6, 0.4, 10),
    },
    avatarInner: { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#06312C', fontSize: s(40), fontWeight: '800' },
    cameraBadge: {
      position: 'absolute',
      right: 0,
      bottom: s(2),
      width: Math.max(s(34), 34),
      height: Math.max(s(34), 34),
      borderRadius: 999,
      backgroundColor: COLORS.gold,
      borderWidth: 3,
      borderColor: COLORS.bgBottom,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nome: { color: COLORS.text, fontSize: s(24), fontWeight: '800', letterSpacing: -0.3 },
    email: { color: COLORS.muted, fontSize: s(14) },
    perfilBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(6),
      paddingHorizontal: s(12),
      paddingVertical: s(6),
      borderRadius: 999,
      marginTop: s(4),
      backgroundColor: 'rgba(45,212,191,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(45,212,191,0.35)',
    },
    perfilBadgeText: { color: COLORS.accent, fontSize: s(12), fontWeight: '800' },

    /* Números */
    stats: {
      flexDirection: 'row',
      backgroundColor: COLORS.glass,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
      borderRadius: s(22),
      paddingVertical: s(16),
    },
    stat: { flex: 1, alignItems: 'center', gap: s(2) },
    statBorda: { borderLeftWidth: 1, borderLeftColor: COLORS.glassBorder },
    statValor: { color: COLORS.text, fontSize: s(20), fontWeight: '800' },
    statRotulo: { color: COLORS.muted, fontSize: s(12) },

    /* Seções */
    secao: { gap: s(10) },
    secaoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    secaoTitulo: { color: COLORS.text, fontSize: s(16), fontWeight: '800' },
    editarBtn: { flexDirection: 'row', alignItems: 'center', gap: s(4), minHeight: 32 },
    editarText: { color: COLORS.accent, fontSize: s(14), fontWeight: '700' },

    card: {
      backgroundColor: COLORS.glass,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
      borderRadius: s(22),
      overflow: 'hidden',
    },

    /* Linha de opção */
    linha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(14),
      paddingHorizontal: s(16),
      paddingVertical: s(14),
      minHeight: Math.max(s(60), 56),
    },
    linhaBorda: { borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
    linhaIcone: {
      width: s(38),
      height: s(38),
      borderRadius: s(12),
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    linhaTitulo: { color: COLORS.text, fontSize: s(15), fontWeight: '700' },
    linhaDescricao: { color: COLORS.muted, fontSize: s(13), marginTop: s(2) },

    /* Edição */
    form: { padding: s(16), gap: s(12) },
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
    input: {
      flex: 1,
      color: COLORS.text,
      fontSize: Math.max(s(16), 16),
      paddingVertical: Platform.OS === 'android' ? 0 : s(14),
      includeFontPadding: false,
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    },
    contadorCampo: { color: COLORS.muted, fontSize: s(12), fontWeight: '600' },
    buttonWrapper: {
      borderRadius: s(16),
      overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
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

    versao: { color: COLORS.muted, fontSize: s(12), textAlign: 'center', opacity: 0.7 },
  });
}