import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
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
import { LIMITES } from '@/constants/limites';

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

function AppText(props: TextProps) {
  return <Text maxFontSizeMultiplier={1.2} {...props} />;
}

/* ---------- Dados de exemplo (depois vêm do banco / API) ---------- */

type Perfil = 'cliente' | 'profissional' | 'admin';

type Usuario = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  criadoEm: string;
};

const USUARIOS_INICIAIS: Usuario[] = [
  { id: '1', nome: 'Maria Souza', email: 'maria.souza@email.com', perfil: 'cliente', ativo: true, criadoEm: '02/10/2026' },
  { id: '2', nome: 'Ana Beatriz', email: 'ana.beatriz@relax.com', perfil: 'profissional', ativo: true, criadoEm: '15/09/2026' },
  { id: '3', nome: 'Carlos Henrique', email: 'carlos.h@relax.com', perfil: 'profissional', ativo: true, criadoEm: '15/09/2026' },
  { id: '4', nome: 'Juliana Prado', email: 'juliana.prado@relax.com', perfil: 'profissional', ativo: false, criadoEm: '20/09/2026' },
  { id: '5', nome: 'Pedro Almeida', email: 'pedro.almeida@email.com', perfil: 'cliente', ativo: true, criadoEm: '05/10/2026' },
  { id: '6', nome: 'Fernanda Lima', email: 'fe.lima@email.com', perfil: 'cliente', ativo: false, criadoEm: '28/09/2026' },
  { id: '7', nome: 'Davi Santos', email: 'davi@relax.com', perfil: 'admin', ativo: true, criadoEm: '01/09/2026' },
];

const PERFIL_INFO: Record<Perfil, { label: string; cor: string }> = {
  cliente: { label: 'Cliente', cor: COLORS.info },
  profissional: { label: 'Profissional', cor: COLORS.accent2 },
  admin: { label: 'Admin', cor: COLORS.gold },
};

type Filtro = 'todos' | Perfil;
const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'cliente', label: 'Clientes' },
  { key: 'profissional', label: 'Profissionais' },
  { key: 'admin', label: 'Admins' },
];

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
}

// Remove acentos para a busca ignorar "á", "ç" etc.
function normalizar(t: string) {
  return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/* ---------- Componentes ---------- */

type CardProps = {
  item: Usuario;
  styles: ReturnType<typeof makeStyles>;
  s: (n: number) => number;
  onAlternarAtivo: (u: Usuario) => void;
  onExcluir: (u: Usuario) => void;
};

function CardUsuario({ item, styles, s, onAlternarAtivo, onExcluir }: CardProps) {
  const info = PERFIL_INFO[item.perfil];
  const size = s(48);

  return (
    <View style={[styles.card, !item.ativo && { opacity: 0.7 }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accent2]}
            style={[styles.avatarInner, { borderRadius: size / 2 }]}>
            <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{iniciais(item.nome)}</Text>
          </LinearGradient>
        </View>

        <View style={styles.cardInfo}>
          <AppText style={styles.nome} numberOfLines={1}>
            {item.nome}
          </AppText>
          <AppText style={styles.email} numberOfLines={1}>
            {item.email}
          </AppText>
        </View>

        <View style={[styles.statusDot, { backgroundColor: item.ativo ? COLORS.accent2 : COLORS.danger }]} />
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: `${info.cor}22`, borderColor: `${info.cor}66` }]}>
            <AppText style={[styles.badgeText, { color: info.cor }]}>{info.label}</AppText>
          </View>
          <AppText style={styles.data}>Desde {item.criadoEm}</AppText>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => onAlternarAtivo(item)} hitSlop={6} style={styles.actionOutline}>
            <AppText style={styles.actionOutlineText}>{item.ativo ? 'Desativar' : 'Ativar'}</AppText>
          </Pressable>
          <Pressable onPress={() => onExcluir(item)} hitSlop={8} style={styles.actionIcon}>
            <Ionicons name="trash-outline" size={s(18)} color={COLORS.danger} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* ---------- Tela ---------- */

export default function UsuariosScreen() {
  const { width } = useWindowDimensions();
  const scale = Math.min(Math.max(width / 390, 0.85), 1.2);
  const s = (n: number) => Math.round(n * scale);
  const styles = useMemo(() => makeStyles(s), [scale]); // eslint-disable-line react-hooks/exhaustive-deps

  const [usuarios, setUsuarios] = useState(USUARIOS_INICIAIS);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [busca, setBusca] = useState('');
  const [buscaFocada, setBuscaFocada] = useState(false);

  const termo = normalizar(busca.trim());
  const lista = usuarios.filter((u) => {
    const passaFiltro = filtro === 'todos' || u.perfil === filtro;
    const passaBusca =
      termo === '' || normalizar(u.nome).includes(termo) || normalizar(u.email).includes(termo);
    return passaFiltro && passaBusca;
  });

  const totalAtivos = usuarios.filter((u) => u.ativo).length;

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

  function alternarAtivo(u: Usuario) {
    const acao = u.ativo ? 'desativar' : 'ativar';
    Alert.alert(`${u.ativo ? 'Desativar' : 'Ativar'} usuário`, `Deseja ${acao} ${u.nome}?`, [
      { text: 'Voltar', style: 'cancel' },
      {
        text: u.ativo ? 'Desativar' : 'Ativar',
        onPress: () =>
          setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, ativo: !x.ativo } : x))),
      },
    ]);
  }

  function excluir(u: Usuario) {
    Alert.alert('Excluir usuário', `Tem certeza que deseja excluir ${u.nome}? Essa ação não pode ser desfeita.`, [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => setUsuarios((prev) => prev.filter((x) => x.id !== u.id)),
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
          {/* Cabeçalho */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={styles.backButton}
              android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}>
              <Ionicons name="chevron-back" size={s(22)} color={COLORS.text} />
            </Pressable>
            <View style={styles.headerTexts}>
              <AppText style={styles.title}>Usuários</AppText>
              <AppText style={styles.subtitle}>
                {usuarios.length} cadastrados · {totalAtivos} ativos
              </AppText>
            </View>
          </View>

          {/* Busca */}
          <View style={[styles.search, buscaFocada && styles.searchFocused]}>
            <Ionicons
              name="search-outline"
              size={s(20)}
              color={buscaFocada ? COLORS.accent : COLORS.muted}
            />
            <TextInput
              style={styles.searchInput}
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar por nome ou e-mail"
              placeholderTextColor={COLORS.muted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={LIMITES.busca.max}
              maxFontSizeMultiplier={1.2}
              onFocus={() => setBuscaFocada(true)}
              onBlur={() => setBuscaFocada(false)}
            />
            {busca.length > 0 && (
              <Pressable onPress={() => setBusca('')} hitSlop={10}>
                <Ionicons name="close-circle" size={s(18)} color={COLORS.muted} />
              </Pressable>
            )}
          </View>

          {/* Filtros */}
          <View style={styles.chipsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}>
              {FILTROS.map((f) => {
                const ativo = filtro === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setFiltro(f.key)}
                    style={[styles.chip, ativo && styles.chipActive]}>
                    <AppText style={[styles.chipText, ativo && styles.chipTextActive]}>{f.label}</AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Lista */}
          <FlatList
            data={lista}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: s(12) }} />}
            renderItem={({ item }) => (
              <CardUsuario
                item={item}
                styles={styles}
                s={s}
                onAlternarAtivo={alternarAtivo}
                onExcluir={excluir}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={s(48)} color={COLORS.muted} />
                <AppText style={styles.emptyTitle}>Nenhum usuário encontrado</AppText>
                <AppText style={styles.emptyText}>Tente mudar a busca ou o filtro.</AppText>
              </View>
            }
          />
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

    /* Busca */
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(12),
      backgroundColor: 'rgba(0,0,0,0.25)',
      borderWidth: 1.5,
      borderColor: 'transparent',
      borderRadius: s(16),
      paddingHorizontal: s(16),
      minHeight: Math.max(s(50), 48),
    },
    searchFocused: {
      borderColor: COLORS.accent,
      backgroundColor: 'rgba(45,212,191,0.08)',
    },
    searchInput: {
      flex: 1,
      color: COLORS.text,
      fontSize: Math.max(s(16), 16),
      paddingVertical: Platform.OS === 'android' ? 0 : s(12),
      includeFontPadding: false,
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    },

    /* Filtros */
    chipsWrapper: { marginTop: s(12), marginBottom: s(14), height: s(40) },
    chips: { gap: s(8), alignItems: 'center' },
    chip: {
      height: s(38),
      paddingHorizontal: s(16),
      borderRadius: 999,
      backgroundColor: COLORS.glass,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    chipText: { color: COLORS.muted, fontSize: s(14), fontWeight: '600' },
    chipTextActive: { color: '#06312C', fontWeight: '800' },

    /* Lista */
    listContent: { flexGrow: 1, paddingBottom: s(24) },

    /* Card */
    card: {
      backgroundColor: COLORS.glass,
      borderWidth: 1,
      borderColor: COLORS.glassBorder,
      borderRadius: s(22),
      padding: s(14),
      gap: s(12),
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: s(12) },
    avatar: { padding: 2, backgroundColor: COLORS.gold },
    avatarInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#06312C', fontWeight: '800' },
    cardInfo: { flex: 1, gap: s(2) },
    nome: { color: COLORS.text, fontSize: s(16), fontWeight: '700' },
    email: { color: COLORS.muted, fontSize: s(13) },
    statusDot: { width: s(10), height: s(10), borderRadius: 999 },

    cardBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: s(8),
    },
    badges: { flexDirection: 'row', alignItems: 'center', gap: s(10), flexShrink: 1 },
    badge: {
      paddingHorizontal: s(10),
      paddingVertical: s(5),
      borderRadius: 999,
      borderWidth: 1,
    },
    badgeText: { fontSize: s(12), fontWeight: '700' },
    data: { color: COLORS.muted, fontSize: s(12) },

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
    actionIcon: {
      width: 36,
      height: 36,
      borderRadius: s(12),
      borderWidth: 1,
      borderColor: 'rgba(248,113,113,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
    },

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
  });
}