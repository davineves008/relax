import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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

/* ---------- Dados de exemplo (depois vêm da API) ---------- */

type Avaliacao = {
  id: string;
  autor: string;
  data: string;
  nota: number;
  servico: string;
  comentario: string;
  tags: string[];
};

const AVALIACOES_INICIAIS: Avaliacao[] = [
  { id: '1', autor: 'Maria Souza', data: '02/10/2026', nota: 5, servico: 'Massagem Relaxante', comentario: 'Ambiente muito tranquilo e atendimento excelente. Saí renovada!', tags: ['Ambiente', 'Atendimento'] },
  { id: '2', autor: 'Pedro Almeida', data: '28/09/2026', nota: 4, servico: 'Massagem Desportiva', comentario: 'Ótima técnica, só atrasou um pouco pra começar.', tags: ['Técnica', 'Pontualidade'] },
  { id: '3', autor: 'Fernanda Lima', data: '21/09/2026', nota: 5, servico: 'Drenagem Linfática', comentario: '', tags: ['Higiene', 'Atendimento'] },
  { id: '4', autor: 'Lucas Ferreira', data: '15/09/2026', nota: 3, servico: 'Massagem Relaxante', comentario: 'Foi boa, mas esperava um pouco mais de pressão.', tags: ['Técnica'] },
];

const ROTULOS = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'];
const EMOJIS = ['✨', '😞', '😕', '😐', '🙂', '🤩'];
const COR_NOTA = ['rgba(255,255,255,0.15)', '#F87171', '#FB923C', '#FACC15', '#A3E635', '#34D399'];

const TAGS: { nome: string; icone: keyof typeof Ionicons.glyphMap }[] = [
  { nome: 'Pontualidade', icone: 'time-outline' },
  { nome: 'Ambiente', icone: 'leaf-outline' },
  { nome: 'Atendimento', icone: 'heart-outline' },
  { nome: 'Técnica', icone: 'hand-left-outline' },
  { nome: 'Higiene', icone: 'sparkles-outline' },
];
const ICONE_TAG = Object.fromEntries(TAGS.map((t) => [t.nome, t.icone])) as Record<
  string,
  keyof typeof Ionicons.glyphMap
>;

const MAX_COMENTARIO = 300;

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
}

/* ---------- Estrelas ---------- */

// Exibição (somente leitura)
function Estrelas({ nota, size, gap = 2 }: { nota: number; size: number; gap?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= nota ? 'star' : 'star-outline'}
          size={size}
          color={n <= nota ? COLORS.gold : COLORS.muted}
        />
      ))}
    </View>
  );
}

// Estrela tocável, com "pulinho" ao selecionar
function EstrelaSelecionavel({
  n,
  ativa,
  size,
  onPress,
}: {
  n: number;
  ativa: boolean;
  size: number;
  onPress: () => void;
}) {
  const escala = useRef(new Animated.Value(1)).current;

  function tocar() {
    Animated.sequence([
      Animated.timing(escala, { toValue: 1.35, duration: 110, useNativeDriver: true }),
      Animated.spring(escala, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  }

  return (
    <Pressable
      onPress={tocar}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}>
      <Animated.View style={{ transform: [{ scale: escala }] }}>
        <Ionicons
          name={ativa ? 'star' : 'star-outline'}
          size={size}
          color={ativa ? COLORS.gold : COLORS.muted}
        />
      </Animated.View>
    </Pressable>
  );
}

/* ---------- Tela ---------- */

export default function FeedbackScreen() {
  const { width } = useWindowDimensions();
  const scale = Math.min(Math.max(width / 390, 0.85), 1.2);
  const s = (n: number) => Math.round(n * scale);
  const styles = useMemo(() => makeStyles(s), [scale]); // eslint-disable-line react-hooks/exhaustive-deps

  const [aba, setAba] = useState<'avaliar' | 'avaliacoes'>('avaliar');
  const [avaliacoes, setAvaliacoes] = useState(AVALIACOES_INICIAIS);

  // formulário
  const [nota, setNota] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comentario, setComentario] = useState('');
  const [comentarioFocado, setComentarioFocado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // resumo
  const total = avaliacoes.length;
  const media = total ? avaliacoes.reduce((acc, a) => acc + a.nota, 0) / total : 0;
  const recomendam = total
    ? Math.round((avaliacoes.filter((a) => a.nota >= 4).length / total) * 100)
    : 0;
  const contagem = [5, 4, 3, 2, 1].map((n) => ({
    n,
    qtd: avaliacoes.filter((a) => a.nota === n).length,
  }));

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

  // indicador deslizante das abas
  const [segLargura, setSegLargura] = useState(0);
  const indicador = useRef(new Animated.Value(0)).current;
  const itemLargura = Math.max((segLargura - s(8)) / 2, 0);

  useEffect(() => {
    Animated.spring(indicador, {
      toValue: aba === 'avaliar' ? 0 : 1,
      friction: 9,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [aba, indicador]);

  // emoji que "pula" quando a nota muda
  const emojiEscala = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    emojiEscala.setValue(0.6);
    Animated.spring(emojiEscala, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
  }, [nota, emojiEscala]);

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  function alternarTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function enviar() {
    if (enviando) return;
    if (nota === 0) {
      Alert.alert('Falta a nota', 'Toque nas estrelas para avaliar o atendimento.');
      return;
    }

    setEnviando(true);
    try {
      // TODO: trocar pela chamada real à sua API
      await new Promise((r) => setTimeout(r, 800));

      const nova: Avaliacao = {
        id: String(Date.now()),
        autor: 'Você',
        data: new Date().toLocaleDateString('pt-BR'),
        nota,
        servico: 'Massagem Relaxante',
        comentario: comentario.trim(),
        tags,
      };
      setAvaliacoes((prev) => [nova, ...prev]);

      setNota(0);
      setTags([]);
      setComentario('');
      setAba('avaliacoes');
      Alert.alert('Obrigado!', 'Sua avaliação foi enviada.');
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar sua avaliação. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  const corNota = COR_NOTA[nota];

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
              <View style={styles.headerTexts}>
                <AppText style={styles.title}>Avaliações</AppText>
                <AppText style={styles.subtitle}>Sua opinião ajuda o Relax a evoluir</AppText>
              </View>
            </View>

            {/* Abas com indicador deslizante */}
            <View style={styles.segment} onLayout={(e) => setSegLargura(e.nativeEvent.layout.width)}>
              <Animated.View
                style={[
                  styles.segmentIndicator,
                  {
                    width: itemLargura,
                    transform: [
                      {
                        translateX: indicador.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, itemLargura],
                        }),
                      },
                    ],
                  },
                ]}
              />
              {(['avaliar', 'avaliacoes'] as const).map((tab) => {
                const ativo = aba === tab;
                return (
                  <Pressable key={tab} onPress={() => setAba(tab)} style={styles.segmentItem}>
                    <AppText style={[styles.segmentText, ativo && styles.segmentTextActive]}>
                      {tab === 'avaliar' ? 'Avaliar' : `Avaliações (${total})`}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}>
              {aba === 'avaliar' ? (
                <View style={styles.stack}>
                  {/* Atendimento avaliado */}
                  <View style={styles.servicoCard}>
                    <LinearGradient colors={[COLORS.accent, COLORS.accent2]} style={styles.servicoIcon}>
                      <Ionicons name="leaf" size={s(22)} color="#06312C" />
                    </LinearGradient>
                    <View style={styles.flex}>
                      <AppText style={styles.servicoLabel}>ATENDIMENTO</AppText>
                      <AppText style={styles.servicoNome} numberOfLines={1}>
                        Massagem Relaxante
                      </AppText>
                      <AppText style={styles.servicoInfo} numberOfLines={1}>
                        com Ana Beatriz · 14 OUT, 15:00
                      </AppText>
                    </View>
                  </View>

                  {/* Hero da nota: emoji que reage */}
                  <View style={[styles.hero, nota > 0 && { borderColor: `${corNota}99` }]}>
                    <LinearGradient
                      colors={[nota > 0 ? `${corNota}2E` : 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0.02)']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                    />
                    <Animated.Text
                      style={[styles.emoji, { transform: [{ scale: emojiEscala }] }]}
                      allowFontScaling={false}>
                      {EMOJIS[nota]}
                    </Animated.Text>
                    <AppText style={styles.pergunta}>Como foi seu atendimento?</AppText>

                    <View style={styles.estrelasRow}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <EstrelaSelecionavel
                          key={n}
                          n={n}
                          ativa={n <= nota}
                          size={s(40)}
                          onPress={() => setNota(n)}
                        />
                      ))}
                    </View>

                    <View style={[styles.rotuloPill, nota > 0 && { backgroundColor: `${corNota}26` }]}>
                      <AppText style={[styles.rotulo, { color: nota > 0 ? corNota : COLORS.muted }]}>
                        {nota === 0 ? 'Toque nas estrelas' : ROTULOS[nota]}
                      </AppText>
                    </View>
                  </View>

                  {/* Tags */}
                  <View style={styles.secao}>
                    <AppText style={styles.secaoTitulo}>O que mais chamou atenção?</AppText>
                    <View style={styles.tags}>
                      {TAGS.map(({ nome, icone }) => {
                        const ativa = tags.includes(nome);
                        return (
                          <Pressable
                            key={nome}
                            onPress={() => alternarTag(nome)}
                            style={[styles.tag, ativa && styles.tagActive]}>
                            <Ionicons
                              name={ativa ? 'checkmark-circle' : icone}
                              size={s(16)}
                              color={ativa ? '#06312C' : COLORS.muted}
                            />
                            <AppText style={[styles.tagText, ativa && styles.tagTextActive]}>{nome}</AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Comentário */}
                  <View style={styles.secao}>
                    <AppText style={styles.secaoTitulo}>Quer contar mais? (opcional)</AppText>
                    <View style={[styles.textareaWrapper, comentarioFocado && styles.textareaFocused]}>
                      <TextInput
                        style={styles.textarea}
                        value={comentario}
                        onChangeText={(t) => setComentario(t.slice(0, MAX_COMENTARIO))}
                        placeholder="Escreva aqui sua experiência..."
                        placeholderTextColor={COLORS.muted}
                        multiline
                        textAlignVertical="top"
                        maxFontSizeMultiplier={1.2}
                        onFocus={() => setComentarioFocado(true)}
                        onBlur={() => setComentarioFocado(false)}
                      />
                      <AppText style={styles.contador}>
                        {comentario.length}/{MAX_COMENTARIO}
                      </AppText>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.stack}>
                  {/* Resumo */}
                  <View style={styles.resumoCard}>
                    <LinearGradient
                      colors={['rgba(45,212,191,0.20)', 'rgba(245,194,107,0.10)']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <View style={styles.resumo}>
                      <View style={styles.resumoMedia}>
                        <AppText style={styles.mediaNumero}>{media.toFixed(1).replace('.', ',')}</AppText>
                        <Estrelas nota={Math.round(media)} size={s(16)} />
                        <AppText style={styles.mediaTotal}>
                          {total} {total === 1 ? 'avaliação' : 'avaliações'}
                        </AppText>
                      </View>

                      <View style={styles.barras}>
                        {contagem.map(({ n, qtd }) => (
                          <View key={n} style={styles.barraRow}>
                            <AppText style={styles.barraLabel}>{n}</AppText>
                            <Ionicons name="star" size={s(11)} color={COLORS.gold} />
                            <View style={styles.barraFundo}>
                              <View style={{ width: total ? `${(qtd / total) * 100}%` : '0%', height: '100%' }}>
                                <LinearGradient
                                  colors={[COLORS.gold, '#FB923C']}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={styles.barraPreenchida}
                                />
                              </View>
                            </View>
                            <AppText style={styles.barraQtd}>{qtd}</AppText>
                          </View>
                        ))}
                      </View>
                    </View>

                    <View style={styles.recomendamPill}>
                      <Ionicons name="thumbs-up" size={s(14)} color={COLORS.accent2} />
                      <AppText style={styles.recomendamText}>{recomendam}% recomendam</AppText>
                    </View>
                  </View>

                  {/* Lista */}
                  {avaliacoes.length === 0 ? (
                    <View style={styles.empty}>
                      <Ionicons name="chatbubble-ellipses-outline" size={s(48)} color={COLORS.muted} />
                      <AppText style={styles.emptyTitle}>Nenhuma avaliação ainda</AppText>
                      <AppText style={styles.emptyText}>Seja o primeiro a avaliar um atendimento.</AppText>
                    </View>
                  ) : (
                    avaliacoes.map((a) => {
                      const minha = a.autor === 'Você';
                      return (
                        <View key={a.id} style={[styles.reviewCard, minha && styles.reviewCardMinha]}>
                          <View style={styles.reviewTop}>
                            <View style={styles.avatar}>
                              <LinearGradient colors={[COLORS.accent, COLORS.accent2]} style={styles.avatarInner}>
                                <Text style={styles.avatarText}>{iniciais(a.autor)}</Text>
                              </LinearGradient>
                            </View>
                            <View style={styles.flex}>
                              <View style={styles.autorRow}>
                                <AppText style={styles.autor} numberOfLines={1}>
                                  {a.autor}
                                </AppText>
                                {minha && (
                                  <View style={styles.minhaBadge}>
                                    <AppText style={styles.minhaBadgeText}>Nova</AppText>
                                  </View>
                                )}
                              </View>
                              <AppText style={styles.reviewInfo} numberOfLines={1}>
                                {a.servico} · {a.data}
                              </AppText>
                            </View>
                            <View style={[styles.notaPill, { backgroundColor: `${COR_NOTA[a.nota]}26` }]}>
                              <Ionicons name="star" size={s(12)} color={COR_NOTA[a.nota]} />
                              <AppText style={[styles.notaPillText, { color: COR_NOTA[a.nota] }]}>
                                {a.nota}
                              </AppText>
                            </View>
                          </View>

                          {a.comentario !== '' && (
                            <AppText style={styles.comentario}>“{a.comentario}”</AppText>
                          )}

                          {a.tags.length > 0 && (
                            <View style={styles.tags}>
                              {a.tags.map((t) => (
                                <View key={t} style={styles.tagStatic}>
                                  <Ionicons name={ICONE_TAG[t] ?? 'pricetag-outline'} size={s(12)} color={COLORS.accent} />
                                  <AppText style={styles.tagStaticText}>{t}</AppText>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </ScrollView>

            {/* Botão fixo no rodapé (só na aba Avaliar) */}
            {aba === 'avaliar' && (
              <View style={styles.footerBar}>
                <Pressable
                  onPress={enviar}
                  android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: false }}
                  style={({ pressed }) => [
                    styles.buttonWrapper,
                    nota === 0 && { opacity: 0.65 },
                    pressed && Platform.OS === 'ios' && { transform: [{ scale: 0.98 }] },
                  ]}>
                  <LinearGradient
                    colors={[COLORS.accent, COLORS.accent2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.button}>
                    {enviando ? (
                      <ActivityIndicator color="#06312C" />
                    ) : (
                      <>
                        <AppText style={styles.buttonText}>Enviar avaliação</AppText>
                        <Ionicons name="send" size={s(18)} color="#06312C" />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(s: (n: number) => number) {
  const glassCard = {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: s(24),
  } as const;

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
      paddingBottom: s(16),
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
    headerTexts: { flex: 1 },
    title: { color: COLORS.text, fontSize: s(26), fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { color: COLORS.muted, fontSize: s(13), marginTop: s(2) },

    /* Abas */
    segment: {
      flexDirection: 'row',
      backgroundColor: COLORS.glass,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
      borderRadius: 999,
      padding: s(4),
      marginBottom: s(16),
    },
    segmentIndicator: {
      position: 'absolute',
      top: s(4),
      left: s(4),
      height: Math.max(s(42), 42),
      borderRadius: 999,
      backgroundColor: COLORS.accent,
      ...shadow(COLORS.accent, 10, 3, 0.4, 4),
    },
    segmentItem: {
      flex: 1,
      height: Math.max(s(42), 42),
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentText: { color: COLORS.muted, fontSize: s(14), fontWeight: '600' },
    segmentTextActive: { color: '#06312C', fontWeight: '800' },

    scrollContent: { paddingBottom: s(24) },
    stack: { gap: s(16) },

    /* Atendimento */
    servicoCard: {
      ...glassCard,
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(14),
      padding: s(14),
    },
    servicoIcon: {
      width: s(50),
      height: s(50),
      borderRadius: s(16),
      alignItems: 'center',
      justifyContent: 'center',
    },
    servicoLabel: { color: COLORS.accent, fontSize: s(11), fontWeight: '800', letterSpacing: 1.2 },
    servicoNome: { color: COLORS.text, fontSize: s(17), fontWeight: '800', marginTop: s(2) },
    servicoInfo: { color: COLORS.muted, fontSize: s(13), marginTop: s(2) },

    /* Hero da nota */
    hero: {
      ...glassCard,
      borderRadius: s(28),
      overflow: 'hidden',
      alignItems: 'center',
      paddingVertical: s(24),
      paddingHorizontal: s(16),
      gap: s(12),
    },
    emoji: { fontSize: s(64), lineHeight: s(76), textAlign: 'center' },
    pergunta: { color: COLORS.text, fontSize: s(19), fontWeight: '800', textAlign: 'center' },
    estrelasRow: { flexDirection: 'row', gap: s(10), marginTop: s(4) },
    rotuloPill: {
      paddingHorizontal: s(16),
      paddingVertical: s(7),
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.08)',
      marginTop: s(4),
    },
    rotulo: { fontSize: s(15), fontWeight: '800', letterSpacing: 0.3 },

    /* Seções */
    secao: { gap: s(10) },
    secaoTitulo: { color: COLORS.text, fontSize: s(16), fontWeight: '800' },

    /* Tags */
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8) },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(6),
      minHeight: 42,
      paddingHorizontal: s(14),
      borderRadius: 999,
      backgroundColor: COLORS.glass,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
    },
    tagActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    tagText: { color: COLORS.muted, fontSize: s(14), fontWeight: '600' },
    tagTextActive: { color: '#06312C', fontWeight: '800' },
    tagStatic: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(5),
      paddingHorizontal: s(10),
      paddingVertical: s(6),
      borderRadius: 999,
      backgroundColor: 'rgba(45,212,191,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(45,212,191,0.30)',
    },
    tagStaticText: { color: COLORS.accent, fontSize: s(12), fontWeight: '700' },

    /* Comentário */
    textareaWrapper: {
      backgroundColor: 'rgba(0,0,0,0.25)',
      borderWidth: 1.5,
      borderColor: 'transparent',
      borderRadius: s(20),
      paddingHorizontal: s(16),
      paddingTop: s(12),
      paddingBottom: s(8),
    },
    textareaFocused: {
      borderColor: COLORS.accent,
      backgroundColor: 'rgba(45,212,191,0.08)',
    },
    textarea: {
      color: COLORS.text,
      fontSize: Math.max(s(16), 16),
      minHeight: s(84),
      includeFontPadding: false,
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    },
    contador: { color: COLORS.muted, fontSize: s(12), textAlign: 'right', marginTop: s(4) },

    /* Rodapé fixo */
    footerBar: {
      paddingTop: s(10),
      paddingBottom: s(Platform.OS === 'android' ? 16 : 6),
    },
    buttonWrapper: {
      borderRadius: s(18),
      overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
      backgroundColor: COLORS.accent,
      ...shadow(COLORS.accent, 16, 6, 0.45, 8),
    },
    button: {
      minHeight: Math.max(s(56), 48),
      borderRadius: s(18),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(8),
    },
    buttonText: { color: '#06312C', fontSize: s(17), fontWeight: '800' },

    /* Resumo */
    resumoCard: {
      ...glassCard,
      borderRadius: s(28),
      overflow: 'hidden',
      padding: s(18),
      gap: s(14),
    },
    resumo: { flexDirection: 'row', alignItems: 'center', gap: s(18) },
    resumoMedia: { alignItems: 'center', gap: s(4) },
    mediaNumero: { color: COLORS.text, fontSize: s(48), fontWeight: '800', lineHeight: s(54) },
    mediaTotal: { color: COLORS.muted, fontSize: s(12), marginTop: s(2) },
    barras: { flex: 1, gap: s(6) },
    barraRow: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
    barraLabel: { color: COLORS.muted, fontSize: s(12), width: s(10), textAlign: 'right' },
    barraFundo: {
      flex: 1,
      height: s(7),
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.12)',
      overflow: 'hidden',
    },
    barraPreenchida: { flex: 1, borderRadius: 999 },
    barraQtd: { color: COLORS.muted, fontSize: s(12), width: s(18) },
    recomendamPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: s(6),
      paddingHorizontal: s(12),
      paddingVertical: s(7),
      borderRadius: 999,
      backgroundColor: 'rgba(52,211,153,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(52,211,153,0.35)',
    },
    recomendamText: { color: COLORS.accent2, fontSize: s(13), fontWeight: '700' },

    /* Avaliação na lista */
    reviewCard: {
      ...glassCard,
      padding: s(16),
      gap: s(12),
    },
    reviewCardMinha: { borderColor: 'rgba(245,194,107,0.55)', backgroundColor: 'rgba(245,194,107,0.08)' },
    reviewTop: { flexDirection: 'row', alignItems: 'center', gap: s(12) },
    avatar: { width: s(44), height: s(44), borderRadius: 999, padding: 2, backgroundColor: COLORS.gold },
    avatarInner: { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#06312C', fontWeight: '800', fontSize: s(15) },
    autorRow: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
    autor: { color: COLORS.text, fontSize: s(15), fontWeight: '800', flexShrink: 1 },
    minhaBadge: {
      paddingHorizontal: s(8),
      paddingVertical: s(2),
      borderRadius: 999,
      backgroundColor: COLORS.gold,
    },
    minhaBadgeText: { color: '#3B2A06', fontSize: s(10), fontWeight: '800' },
    reviewInfo: { color: COLORS.muted, fontSize: s(12), marginTop: s(2) },
    notaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(4),
      paddingHorizontal: s(10),
      paddingVertical: s(6),
      borderRadius: 999,
    },
    notaPillText: { fontSize: s(14), fontWeight: '800' },
    comentario: {
      color: COLORS.text,
      fontSize: s(14),
      lineHeight: s(21),
      opacity: 0.9,
      fontStyle: 'italic',
    },

    /* Vazio */
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(8),
      paddingVertical: s(48),
    },
    emptyTitle: { color: COLORS.text, fontSize: s(17), fontWeight: '700', marginTop: s(8) },
    emptyText: { color: COLORS.muted, fontSize: s(14), textAlign: 'center' },
  });
}