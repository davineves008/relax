import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  Platform,
  Pressable,
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

/* ---------- Dados de exemplo (depois vêm da sua API) ---------- */

type Status = 'confirmado' | 'pendente' | 'concluido' | 'cancelado';

type Agendamento = {
  id: string;
  servico: string;
  profissional: string;
  dia: string;
  mes: string;
  hora: string;
  duracao: string;
  status: Status;
};

// foto: null mostra as iniciais; depois será a URL da foto do usuário
const USUARIO: { nome: string; foto: string | null } = {
  nome: 'Maria Souza',
  foto: null,
};

const AGENDAMENTOS_INICIAIS: Agendamento[] = [
  { id: '1', servico: 'Massagem Relaxante', profissional: 'Ana Beatriz', dia: '14', mes: 'OUT', hora: '15:00', duracao: '60 min', status: 'confirmado' },
  { id: '2', servico: 'Massagem Desportiva', profissional: 'Carlos Henrique', dia: '18', mes: 'OUT', hora: '10:30', duracao: '45 min', status: 'pendente' },
  { id: '3', servico: 'Drenagem Linfática', profissional: 'Juliana Prado', dia: '02', mes: 'OUT', hora: '09:00', duracao: '60 min', status: 'concluido' },
  { id: '4', servico: 'Massagem com Pedras Quentes', profissional: 'Ana Beatriz', dia: '21', mes: 'SET', hora: '17:00', duracao: '90 min', status: 'concluido' },
  { id: '5', servico: 'Massagem Relaxante', profissional: 'Carlos Henrique', dia: '10', mes: 'SET', hora: '14:00', duracao: '60 min', status: 'cancelado' },
];

const STATUS_INFO: Record<Status, { label: string; cor: string; icon: keyof typeof Ionicons.glyphMap }> = {
  confirmado: { label: 'Confirmado', cor: COLORS.accent2, icon: 'checkmark-circle' },
  pendente: { label: 'Pendente', cor: COLORS.gold, icon: 'time' },
  concluido: { label: 'Concluído', cor: COLORS.info, icon: 'checkmark-done' },
  cancelado: { label: 'Cancelado', cor: COLORS.danger, icon: 'close-circle' },
};

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
}

/* ---------- Componentes ---------- */

function Avatar({ nome, foto, size }: { nome: string; foto: string | null; size: number }) {
  const r = size / 2;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        padding: 2,
        backgroundColor: COLORS.gold,
      }}>
      {foto ? (
        <Image source={{ uri: foto }} style={{ flex: 1, borderRadius: r }} />
      ) : (
        <LinearGradient
          colors={[COLORS.accent, COLORS.accent2]}
          style={{ flex: 1, borderRadius: r, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#06312C', fontWeight: '800', fontSize: size * 0.36 }}>
            {iniciais(nome)}
          </Text>
        </LinearGradient>
      )}
    </View>
  );
}

type CardProps = {
  item: Agendamento;
  styles: ReturnType<typeof makeStyles>;
  s: (n: number) => number;
  onCancelar: (id: string) => void;
  onReagendar: (id: string) => void;
  onAvaliar: (id: string) => void;
};

function CardAgendamento({ item, styles, s, onCancelar, onReagendar, onAvaliar }: CardProps) {
  const info = STATUS_INFO[item.status];
  const ativo = item.status === 'confirmado' || item.status === 'pendente';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.dateBox}>
          <AppText style={styles.dateDay}>{item.dia}</AppText>
          <AppText style={styles.dateMonth}>{item.mes}</AppText>
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
              {item.hora} · {item.duracao}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={[styles.badge, { backgroundColor: `${info.cor}22`, borderColor: `${info.cor}66` }]}>
          <Ionicons name={info.icon} size={s(14)} color={info.cor} />
          <AppText style={[styles.badgeText, { color: info.cor }]}>{info.label}</AppText>
        </View>

        <View style={styles.actions}>
          {ativo && (
            <>
              <Pressable onPress={() => onReagendar(item.id)} hitSlop={6} style={styles.actionOutline}>
                <AppText style={styles.actionOutlineText}>Reagendar</AppText>
              </Pressable>
              <Pressable onPress={() => onCancelar(item.id)} hitSlop={6} style={styles.actionGhost}>
                <AppText style={styles.actionGhostText}>Cancelar</AppText>
              </Pressable>
            </>
          )}
          {item.status === 'concluido' && (
            <Pressable onPress={() => onAvaliar(item.id)} hitSlop={6} style={styles.actionGold}>
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

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const scale = Math.min(Math.max(width / 390, 0.85), 1.2);
  const s = (n: number) => Math.round(n * scale);
  const styles = useMemo(() => makeStyles(s), [scale]); // eslint-disable-line react-hooks/exhaustive-deps

  const [agendamentos, setAgendamentos] = useState(AGENDAMENTOS_INICIAIS);
  const [aba, setAba] = useState<'proximos' | 'historico'>('proximos');

  const lista = agendamentos.filter((a) =>
    aba === 'proximos'
      ? a.status === 'confirmado' || a.status === 'pendente'
      : a.status === 'concluido' || a.status === 'cancelado'
  );
  const totalProximos = agendamentos.filter(
    (a) => a.status === 'confirmado' || a.status === 'pendente'
  ).length;

  const primeiroNome = USUARIO.nome.split(' ')[0];

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

  function cancelar(id: string) {
    Alert.alert('Cancelar agendamento', 'Tem certeza que deseja cancelar?', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar agendamento',
        style: 'destructive',
        onPress: () =>
          setAgendamentos((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status: 'cancelado' } : a))
          ),
      },
    ]);
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
        <Animated.View
          style={[styles.flex, styles.container, { opacity: fade, transform: [{ translateY: slide }] }]}>
          {/* Cabeçalho: foto à esquerda, nome e boas-vindas ao lado */}
          <View style={styles.header}>
            <Pressable onPress={() => Alert.alert('Foto de perfil', 'Em breve: trocar foto!')}>
              <Avatar nome={USUARIO.nome} foto={USUARIO.foto} size={s(60)} />
            </Pressable>
            <View style={styles.headerTexts}>
              <AppText style={styles.nome} numberOfLines={1}>
                Olá, {primeiroNome}!
              </AppText>
              <AppText style={styles.frase} numberOfLines={2}>
                Que bom ter você de volta. Pronto para relaxar?
              </AppText>
            </View>
          </View>

          {/* Título da seção */}
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Meus agendamentos</AppText>
            {totalProximos > 0 && (
              <View style={styles.counter}>
                <AppText style={styles.counterText}>{totalProximos}</AppText>
              </View>
            )}
          </View>

          {/* Abas */}
          <View style={styles.segment}>
            {(['proximos', 'historico'] as const).map((tab) => {
              const ativo = aba === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setAba(tab)}
                  style={[styles.segmentItem, ativo && styles.segmentItemActive]}>
                  <AppText style={[styles.segmentText, ativo && styles.segmentTextActive]}>
                    {tab === 'proximos' ? 'Próximos' : 'Histórico'}
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
            renderItem={({ item }) => (
              <CardAgendamento
                item={item}
                styles={styles}
                s={s}
                onCancelar={cancelar}
                onReagendar={() => Alert.alert('Reagendar', 'Em breve!')}
                onAvaliar={() => Alert.alert('Avaliar', 'Em breve!')}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="calendar-outline" size={s(48)} color={COLORS.muted} />
                <AppText style={styles.emptyTitle}>Nenhum agendamento por aqui</AppText>
                <AppText style={styles.emptyText}>
                  {aba === 'proximos'
                    ? 'Que tal reservar um momento só pra você?'
                    : 'Seus atendimentos anteriores vão aparecer aqui.'}
                </AppText>
              </View>
            }
          />

          {/* Botão flutuante */}
          <Pressable
            onPress={() => Alert.alert('Novo agendamento', 'Próxima tela!')}
            android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: false }}
            style={({ pressed }) => [
              styles.fab,
              pressed && Platform.OS === 'ios' && { transform: [{ scale: 0.98 }] },
            ]}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accent2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fabInner}>
              <Ionicons name="add" size={s(22)} color="#06312C" />
              <AppText style={styles.fabText}>Agendar massagem</AppText>
            </LinearGradient>
          </Pressable>
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
      paddingBottom: s(18),
    },
    headerTexts: { flex: 1 },
    nome: {
      color: COLORS.text,
      fontSize: s(22),
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    frase: {
      color: COLORS.muted,
      fontSize: s(14),
      lineHeight: s(19),
      marginTop: s(2),
    },

    /* Seção */
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(10),
      marginBottom: s(12),
    },
    sectionTitle: {
      color: COLORS.text,
      fontSize: s(18),
      fontWeight: '700',
    },
    counter: {
      minWidth: s(24),
      height: s(24),
      paddingHorizontal: s(7),
      borderRadius: 999,
      backgroundColor: COLORS.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    counterText: { color: '#06312C', fontSize: s(13), fontWeight: '800' },

    /* Abas */
    segment: {
      flexDirection: 'row',
      backgroundColor: COLORS.glass,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
      borderRadius: s(14),
      padding: s(4),
      marginBottom: s(14),
    },
    segmentItem: {
      flex: 1,
      minHeight: Math.max(s(40), 40),
      borderRadius: s(10),
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentItemActive: { backgroundColor: COLORS.accent },
    segmentText: { color: COLORS.muted, fontSize: s(14), fontWeight: '600' },
    segmentTextActive: { color: '#06312C', fontWeight: '800' },

    /* Lista */
    listContent: {
      flexGrow: 1,
      paddingBottom: s(100), // espaço para o botão flutuante
    },

    /* Card */
    card: {
      backgroundColor: COLORS.glass,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
      borderRadius: s(22),
      padding: s(14),
      gap: s(12),
    },
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
    dateDay: { color: COLORS.text, fontSize: s(22), fontWeight: '800', lineHeight: s(26) },
    dateMonth: { color: COLORS.gold, fontSize: s(12), fontWeight: '700', letterSpacing: 1 },
    cardInfo: { flex: 1, gap: s(4) },
    servico: { color: COLORS.text, fontSize: s(16), fontWeight: '700' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
    infoText: { color: COLORS.muted, fontSize: s(13), flexShrink: 1 },

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

    /* Botão flutuante */
    fab: {
      position: 'absolute',
      left: s(20),
      right: s(20),
      bottom: s(16),
      borderRadius: s(18),
      overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
      backgroundColor: COLORS.accent,
      ...shadow(COLORS.accent, 16, 6, 0.45, 8),
    },
    fabInner: {
      minHeight: Math.max(s(56), 48),
      borderRadius: s(18),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(8),
    },
    fabText: { color: '#06312C', fontSize: s(16), fontWeight: '800' },
  });
}