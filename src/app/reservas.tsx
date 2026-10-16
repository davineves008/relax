import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
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
  info: '#93C5FD',
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

type Status = 'confirmado' | 'pendente' | 'concluido' | 'cancelado';

type Reserva = {
  id: string;
  servico: string;
  profissional: string;
  data: Date;
  duracao: string;
  status: Status;
};

// Datas relativas a hoje, para o exemplo sempre fazer sentido
function dataRelativa(dias: number, hora: number, minuto = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(hora, minuto, 0, 0);
  return d;
}

const RESERVAS_INICIAIS: Reserva[] = [
  { id: '1', servico: 'Massagem Relaxante', profissional: 'Ana Beatriz', data: dataRelativa(2, 15), duracao: '60 min', status: 'confirmado' },
  { id: '2', servico: 'Massagem Desportiva', profissional: 'Carlos Henrique', data: dataRelativa(5, 10, 30), duracao: '45 min', status: 'pendente' },
  { id: '3', servico: 'Drenagem Linfática', profissional: 'Juliana Prado', data: dataRelativa(12, 9), duracao: '60 min', status: 'confirmado' },
  { id: '4', servico: 'Massagem com Pedras Quentes', profissional: 'Ana Beatriz', data: dataRelativa(-13, 17), duracao: '90 min', status: 'concluido' },
  { id: '5', servico: 'Massagem Relaxante', profissional: 'Carlos Henrique', data: dataRelativa(-20, 14), duracao: '60 min', status: 'cancelado' },
];

const STATUS_INFO: Record<Status, { label: string; cor: string; icon: keyof typeof Ionicons.glyphMap }> = {
  confirmado: { label: 'Confirmada', cor: COLORS.accent2, icon: 'checkmark-circle' },
  pendente: { label: 'Aguardando confirmação', cor: COLORS.gold, icon: 'time' },
  concluido: { label: 'Concluída', cor: COLORS.info, icon: 'checkmark-done' },
  cancelado: { label: 'Cancelada', cor: COLORS.danger, icon: 'close-circle' },
};

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const doisDigitos = (n: number) => String(n).padStart(2, '0');
const formatarHora = (d: Date) => `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;

// "Hoje", "Amanhã", "Em 3 dias" (compara só o dia, ignorando a hora)
function quandoFalta(d: Date) {
  const inicio = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dias = Math.round((inicio(d) - inicio(new Date())) / 86400000);
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Amanhã';
  if (dias > 1) return `Em ${dias} dias`;
  return '';
}

const ehProxima = (r: Reserva) => r.status === 'confirmado' || r.status === 'pendente';

/* ---------- Card ---------- */

type CardProps = {
  item: Reserva;
  destaque?: boolean;
  styles: ReturnType<typeof makeStyles>;
  s: (n: number) => number;
  onCancelar: (r: Reserva) => void;
  onReagendar: () => void;
  onAvaliar: () => void;
};

function CardReserva({ item, destaque, styles, s, onCancelar, onReagendar, onAvaliar }: CardProps) {
  const info = STATUS_INFO[item.status];
  const ativa = ehProxima(item);
  const quando = ativa ? quandoFalta(item.data) : '';

  return (
    <View style={[styles.card, destaque && styles.cardDestaque, item.status === 'cancelado' && { opacity: 0.7 }]}>
      {destaque && (
        <LinearGradient
          colors={['rgba(45,212,191,0.22)', 'rgba(245,194,107,0.10)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {destaque && (
        <View style={styles.destaqueTopo}>
          <Ionicons name="sparkles" size={s(14)} color={COLORS.gold} />
          <AppText style={styles.destaqueLabel}>SUA PRÓXIMA RESERVA</AppText>
        </View>
      )}

      <View style={styles.cardTop}>
        <View style={[styles.dateBox, destaque && styles.dateBoxDestaque]}>
          <AppText style={[styles.dateDay, destaque && { color: '#06312C' }]}>{doisDigitos(item.data.getDate())}</AppText>
          <AppText style={[styles.dateMonth, destaque && { color: '#06312C' }]}>{MESES[item.data.getMonth()]}</AppText>
        </View>

        <View style={styles.cardInfo}>
          <AppText style={styles.servico} numberOfLines={1}>
            {item.servico}
          </AppText>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={s(14)} color={COLORS.muted} />
            <AppText style={styles.infoText} numberOfLines={1}>
              {item.profissional}
            </AppText>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={s(14)} color={COLORS.muted} />
            <AppText style={styles.infoText} numberOfLines={1}>
              {DIAS_SEMANA[item.data.getDay()]}, {formatarHora(item.data)} · {item.duracao}
            </AppText>
          </View>
        </View>

        {quando !== '' && (
          <View style={styles.quandoPill}>
            <AppText style={styles.quandoText}>{quando}</AppText>
          </View>
        )}
      </View>

      <View style={styles.cardBottom}>
        <View style={[styles.badge, { backgroundColor: `${info.cor}22`, borderColor: `${info.cor}66` }]}>
          <Ionicons name={info.icon} size={s(14)} color={info.cor} />
          <AppText style={[styles.badgeText, { color: info.cor }]}>{info.label}</AppText>
        </View>

        <View style={styles.actions}>
          {ativa && (
            <>
              <Pressable onPress={onReagendar} hitSlop={6} style={styles.actionOutline}>
                <AppText style={styles.actionOutlineText}>Reagendar</AppText>
              </Pressable>
              <Pressable onPress={() => onCancelar(item)} hitSlop={6} style={styles.actionGhost}>
                <AppText style={styles.actionGhostText}>Cancelar</AppText>
              </Pressable>
            </>
          )}
          {item.status === 'concluido' && (
            <Pressable onPress={onAvaliar} hitSlop={6} style={styles.actionGold}>
              <Ionicons name="star" size={s(14)} color="#3B2A06" />
              <AppText style={styles.actionGoldText}>Avaliar</AppText>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

/* ---------- Tela ---------- */

export default function ReservasScreen() {
  const { width } = useWindowDimensions();
  const scale = Math.min(Math.max(width / 390, 0.85), 1.2);
  const s = (n: number) => Math.round(n * scale);
  const styles = useMemo(() => makeStyles(s), [scale]); // eslint-disable-line react-hooks/exhaustive-deps

  const [reservas, setReservas] = useState(RESERVAS_INICIAIS);
  const [aba, setAba] = useState<'proximas' | 'historico'>('proximas');
  const [atualizando, setAtualizando] = useState(false);

  // próximas em ordem de data (a mais perto primeiro); histórico da mais recente pra mais antiga
  const proximas = reservas.filter(ehProxima).sort((a, b) => a.data.getTime() - b.data.getTime());
  const historico = reservas.filter((r) => !ehProxima(r)).sort((a, b) => b.data.getTime() - a.data.getTime());
  const lista = aba === 'proximas' ? proximas : historico;

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
      toValue: aba === 'proximas' ? 0 : 1,
      friction: 9,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [aba, indicador]);

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  function cancelar(r: Reserva) {
    Alert.alert(
      'Cancelar reserva',
      `Deseja cancelar ${r.servico} com ${r.profissional}, ${DIAS_SEMANA[r.data.getDay()].toLowerCase()} às ${formatarHora(r.data)}?`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar reserva',
          style: 'destructive',
          onPress: () =>
            setReservas((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: 'cancelado' } : x))),
        },
      ]
    );
  }

  const atualizar = useCallback(async () => {
    setAtualizando(true);
    // TODO: buscar as reservas na API
    await new Promise((r) => setTimeout(r, 900));
    setAtualizando(false);
  }, []);

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
              <AppText style={styles.title}>Minhas reservas</AppText>
              <AppText style={styles.subtitle}>
                {proximas.length === 0
                  ? 'Nenhum horário marcado'
                  : `${proximas.length} ${proximas.length === 1 ? 'horário marcado' : 'horários marcados'}`}
              </AppText>
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
            {(['proximas', 'historico'] as const).map((tab) => {
              const ativo = aba === tab;
              return (
                <Pressable key={tab} onPress={() => setAba(tab)} style={styles.segmentItem}>
                  <AppText style={[styles.segmentText, ativo && styles.segmentTextActive]}>
                    {tab === 'proximas' ? `Próximas (${proximas.length})` : `Histórico (${historico.length})`}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {/* Lista */}
          <FlatList
            data={lista}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: s(12) }} />}
            refreshControl={
              <RefreshControl
                refreshing={atualizando}
                onRefresh={atualizar}
                tintColor={COLORS.accent}
                colors={[COLORS.accent]}
                progressBackgroundColor={COLORS.bgBottom}
              />
            }
            renderItem={({ item, index }) => (
              <CardReserva
                item={item}
                destaque={aba === 'proximas' && index === 0}
                styles={styles}
                s={s}
                onCancelar={cancelar}
                onReagendar={() => router.push('/agendamento')}
                onAvaliar={() => router.push('/feedback')}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="calendar-outline" size={s(52)} color={COLORS.muted} />
                <AppText style={styles.emptyTitle}>
                  {aba === 'proximas' ? 'Nenhuma reserva por aqui' : 'Seu histórico está vazio'}
                </AppText>
                <AppText style={styles.emptyText}>
                  {aba === 'proximas'
                    ? 'Que tal reservar um momento só pra você?'
                    : 'Seus atendimentos anteriores vão aparecer aqui.'}
                </AppText>
              </View>
            }
          />

          {/* Botão fixo no rodapé */}
          <View style={styles.footerBar}>
            <Pressable
              onPress={() => router.push('/agendamento')}
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
                <Ionicons name="add" size={s(22)} color="#06312C" />
                <AppText style={styles.buttonText}>Nova reserva</AppText>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
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

    /* Lista */
    listContent: { flexGrow: 1, paddingBottom: s(16) },

    /* Card */
    card: {
      backgroundColor: COLORS.glass,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
      borderRadius: s(22),
      padding: s(14),
      gap: s(12),
      overflow: 'hidden',
    },
    cardDestaque: {
      borderRadius: s(26),
      padding: s(16),
      borderColor: 'rgba(45,212,191,0.55)',
    },
    destaqueTopo: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
    destaqueLabel: { color: COLORS.gold, fontSize: s(11), fontWeight: '800', letterSpacing: 1.2 },

    cardTop: { flexDirection: 'row', alignItems: 'center', gap: s(14) },
    dateBox: {
      width: s(58),
      height: s(64),
      borderRadius: s(16),
      backgroundColor: 'rgba(0,0,0,0.25)',
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateBoxDestaque: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    dateDay: { color: COLORS.text, fontSize: s(22), fontWeight: '800', lineHeight: s(26) },
    dateMonth: { color: COLORS.gold, fontSize: s(12), fontWeight: '700', letterSpacing: 1 },
    cardInfo: { flex: 1, gap: s(4) },
    servico: { color: COLORS.text, fontSize: s(16), fontWeight: '700' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
    infoText: { color: COLORS.muted, fontSize: s(13), flexShrink: 1 },

    quandoPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: s(10),
      paddingVertical: s(5),
      borderRadius: 999,
      backgroundColor: 'rgba(245,194,107,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(245,194,107,0.4)',
    },
    quandoText: { color: COLORS.gold, fontSize: s(11), fontWeight: '800' },

    cardBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: s(8),
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(5),
      paddingHorizontal: s(10),
      paddingVertical: s(6),
      borderRadius: 999,
      borderWidth: 1,
    },
    badgeText: { fontSize: s(12), fontWeight: '700' },

    actions: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
    actionOutline: {
      minHeight: 36,
      paddingHorizontal: s(14),
      borderRadius: s(12),
      borderWidth: 1,
      borderColor: COLORS.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionOutlineText: { color: COLORS.accent, fontSize: s(13), fontWeight: '700' },
    actionGhost: {
      minHeight: 36,
      paddingHorizontal: s(8),
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionGhostText: { color: COLORS.danger, fontSize: s(13), fontWeight: '700' },
    actionGold: {
      minHeight: 36,
      flexDirection: 'row',
      gap: s(6),
      paddingHorizontal: s(14),
      borderRadius: s(12),
      backgroundColor: COLORS.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionGoldText: { color: '#3B2A06', fontSize: s(13), fontWeight: '800' },

    /* Vazio */
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(8),
      paddingVertical: s(48),
    },
    emptyTitle: { color: COLORS.text, fontSize: s(17), fontWeight: '700', marginTop: s(8) },
    emptyText: { color: COLORS.muted, fontSize: s(14), textAlign: 'center' },

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
      gap: s(6),
    },
    buttonText: { color: '#06312C', fontSize: s(17), fontWeight: '800' },
  });
}