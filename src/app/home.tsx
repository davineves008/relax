
import HomeCard from '@/components/home/HomeCard';
import type { Perfil } from '@/constants/perfis';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Acao = {
  titulo: string;
  descricao: string;
  icone: keyof typeof Ionicons.glyphMap;
  rota?: '/agendamento' | '/usuarios' | '/feedback' | '/reservas' | '/perfil';
};

const ACOES: Record<Perfil, Acao[]> = {
  Cliente: [
    {
      titulo: 'Agendar massagem',
      descricao: 'Escolha dia e horário',
      icone: 'calendar-outline',
      rota: '/agendamento',
    },
    {
      titulo: 'Minhas reservas',
      descricao: 'Acompanhe seus horários',
      icone: 'time-outline',
      rota: '/reservas',
    },
    {
      titulo: 'Avaliar atendimento',
      descricao: 'Compartilhe sua experiência',
      icone: 'star-outline',
      rota: '/feedback',
    },
    {
      titulo: 'Meu perfil',
      descricao: 'Seus dados pessoais',
      icone: 'person-outline',
      rota: '/perfil',
    },
  ],

  Aluno: [
    {
      titulo: 'Minha disponibilidade',
      descricao: 'Cadastre dias e horários',
      icone: 'calendar-outline',
      rota: '/agendamento',
    },
    {
      titulo: 'Meus atendimentos',
      descricao: 'Veja as práticas agendadas',
      icone: 'people-outline',
      rota: '/reservas',
    },
    {
      titulo: 'Minhas avaliações',
      descricao: 'Acompanhe seu progresso',
      icone: 'star-outline',
      rota: '/feedback',
    },
    {
      titulo: 'Meu perfil',
      descricao: 'Seus dados pessoais',
      icone: 'person-outline',
      rota: '/perfil',
    },
  ],

  Professor: [
    {
      titulo: 'Gerenciar agendas',
      descricao: 'Organize as práticas',
      icone: 'calendar-outline',
      rota: '/agendamento',
    },
    {
      titulo: 'Gerenciar usuários',
      descricao: 'Alunos e clientes',
      icone: 'people-outline',
      rota: '/usuarios',
    },
    {
      titulo: 'Avaliações',
      descricao: 'Acompanhe as práticas',
      icone: 'star-outline',
      rota: '/feedback',
    },
    {
      titulo: 'Relatórios',
      descricao: 'Resumo dos atendimentos',
      icone: 'bar-chart-outline',
    },
  ],

  AdmMaster: [
    {
      titulo: 'Gerenciar usuários',
      descricao: 'Administrar usuários e perfis',
      icone: 'people-outline',
      rota: '/usuarios',
    },
    {
      titulo: 'Gerenciar agendas',
      descricao: 'Acompanhar agendas e práticas',
      icone: 'calendar-outline',
      rota: '/agendamento',
    },
    {
      titulo: 'Avaliações',
      descricao: 'Acompanhar avaliações',
      icone: 'star-outline',
      rota: '/feedback',
    },
    {
      titulo: 'Relatórios',
      descricao: 'Visão geral do sistema',
      icone: 'bar-chart-outline',
    },
  ],
};

const TITULOS: Record<Perfil, string> = {
  Cliente: 'Seu espaço de bem-estar',
  Aluno: 'Suas práticas de massoterapia',
  Professor: 'Painel do professor',
  AdmMaster: 'Painel de administração geral',
};

const HERO: Record<
  Perfil,
  {
    icone: keyof typeof Ionicons.glyphMap;
    titulo: string;
    descricao: string;
  }
> = {
  Cliente: {
    icone: 'leaf-outline',
    titulo: 'Cuide de você hoje',
    descricao: 'Escolha uma prática de massoterapia e reserve seu horário.',
  },
  Aluno: {
    icone: 'fitness-outline',
    titulo: 'Prepare sua próxima prática',
    descricao: 'Organize seus horários e acompanhe seus atendimentos.',
  },
  Professor: {
    icone: 'school-outline',
    titulo: 'Organize suas turmas',
    descricao: 'Acesse as agendas e acompanhe as atividades dos alunos.',
  },
  AdmMaster: {
    icone: 'settings-outline',
    titulo: 'Gerencie o Relax+',
    descricao: 'Acompanhe os usuários, as agendas e as atividades do sistema.',
  },
};

export default function HomeScreen() {
  const { usuario, autenticado } = useAuth();

  useEffect(() => {
    if (!autenticado) {
      router.replace('/');
    }
  }, [autenticado]);

  // Evita renderizar dados privados sem sessão.
  if (!autenticado || !usuario) {
    return null;
  }

  const perfil = usuario.perfil as Perfil;
  const nome = usuario.nome.trim();

  const primeiroNome = nome.split(/\s+/)[0] || 'Usuário';

  const iniciais = nome
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join('')
    .toUpperCase();

  const acoes = ACOES[perfil];
  const titulo = TITULOS[perfil];
  const hero = HERO[perfil];

  if (!acoes || !titulo || !hero) {
    return null;
  }

  // Ainda não existe integração com notificações.
  const temNovidade = false;

  function abrirAcao(acao: Acao) {
    if (acao.rota) {
      router.push(acao.rota);
      return;
    }

    Alert.alert(
      acao.titulo,
      'Esta funcionalidade será implementada na próxima etapa.'
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0B1F1C"
      />

      <LinearGradient
        colors={['#0B1F1C', '#134E4A']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView
        style={styles.safe}
        edges={['top', 'bottom']}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.brand}>
                Relax
                <Text style={styles.brandAccent}>+</Text>
              </Text>

              <Text style={styles.greeting}>
                Olá, {primeiroNome}!
              </Text>

              <Text style={styles.subtitle}>
                {titulo}
              </Text>
            </View>

            <View style={styles.headerAcoes}>
              <Pressable
                onPress={() =>
                  Alert.alert(
                    'Notificações',
                    'Funcionalidade em desenvolvimento.'
                  )
                }
                hitSlop={8}
                style={styles.iconBtn}
                accessibilityLabel="Notificações"
              >
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color="#F0FDFA"
                />

                {temNovidade && (
                  <View style={styles.badge} />
                )}
              </Pressable>

              <Pressable
                onPress={() => router.push('/perfil')}
                style={styles.avatar}
                accessibilityLabel="Abrir meu perfil"
              >
                <Text style={styles.avatarText}>
                  {iniciais}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.hero}>
            <Ionicons
              name={hero.icone}
              size={28}
              color="#6EE7B7"
            />

            <Text style={styles.heroTitle}>
              {hero.titulo}
            </Text>

            <Text style={styles.heroDescription}>
              {hero.descricao}
            </Text>

            <Pressable
              onPress={() => abrirAcao(acoes[0])}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {acoes[0].titulo}
              </Text>

              <Ionicons
                name="arrow-forward"
                size={19}
                color="#06312C"
              />
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>
            Acesso rápido
          </Text>

          <View style={styles.grid}>
            {acoes.map((acao) => (
              <HomeCard
                key={acao.titulo}
                titulo={acao.titulo}
                descricao={acao.descricao}
                icone={acao.icone}
                onPress={() => abrirAcao(acao)}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B1F1C',
  },
  safe: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 18,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  headerText: {
    flex: 1,
  },
  brand: {
    color: '#F0FDFA',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 13,
  },
  brandAccent: {
    color: '#F5C26B',
  },
  greeting: {
    color: '#F0FDFA',
    fontSize: 27,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(240,253,250,0.7)',
    fontSize: 14,
    marginTop: 5,
  },

  headerAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#F5C26B',
    borderWidth: 1.5,
    borderColor: '#0B1F1C',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45,212,191,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.35)',
  },
  avatarText: {
    color: '#2DD4BF',
    fontSize: 18,
    fontWeight: '800',
  },

  hero: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 28,
  },
  heroTitle: {
    color: '#F0FDFA',
    fontSize: 23,
    fontWeight: '800',
    marginTop: 12,
  },
  heroDescription: {
    color: 'rgba(240,253,250,0.75)',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 20,
  },
  primaryButton: {
    minHeight: 52,
    backgroundColor: '#2DD4BF',
    borderRadius: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: '#06312C',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#F0FDFA',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
});
