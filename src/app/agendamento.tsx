
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useState } from 'react';
import {
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const AGENDAS = [
  { id: '1', nome: 'Práticas de Massoterapia', professor: 'Professor responsável' },
  { id: '2', nome: 'Massagem Relaxante', professor: 'Professor responsável' },
];

const HORARIOS = [
  { id: '1', hora: '09:00', livre: true },
  { id: '2', hora: '10:30', livre: true },
  { id: '3', hora: '14:00', livre: false },
  { id: '4', hora: '15:30', livre: true },
];

const DIAS = [
  { id: '1', nome: 'QUI', numero: 8 },
  { id: '2', nome: 'SEX', numero: 9 },
  { id: '3', nome: 'SAB', numero: 10 },
  { id: '4', nome: 'DOM', numero: 11 },
  { id: '5', nome: 'SEG', numero: 12 },
];

export default function AgendamentoScreen() {
  const [agenda, setAgenda] = useState('1');
  const [dia, setDia] = useState(8);
  const [horario, setHorario] = useState('');

  function voltar() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/home');
  }
}

  function confirmar() {
    if (!horario) {
      if (Platform.OS === 'web') {
        window.alert('Selecione um horário disponível.');
      } else {
        Alert.alert('Atenção', 'Selecione um horário disponível.');
      }
      return;
    }

    const nomeAgenda = AGENDAS.find(
      (item) => item.id === agenda
    )?.nome;

    const mensagem =
      `${nomeAgenda}\nDia: ${dia}\nHorário: ${horario}` +
      '\n\nA reserva ainda não foi salva no servidor.';

    if (Platform.OS === 'web') {
      window.alert(mensagem);
    } else {
      Alert.alert('Agendamento selecionado', mensagem);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
       <View style={styles.header}>
  <View style={styles.headerEsquerda}>
    <TouchableOpacity
      style={styles.botaoVoltar}
      onPress={voltar}
      activeOpacity={0.7}
      hitSlop={10}
    >
      <Ionicons name="chevron-back" size={22} color="#315747" />
    </TouchableOpacity>

    <View>
      <Text style={styles.logo}>Relax</Text>
      <Text style={styles.subtitulo}>
        Práticas de Massoterapia
      </Text>
    </View>
  </View>

  <View style={styles.avatar}>
    <Text style={styles.avatarTexto}>R</Text>
  </View>
</View>
        <View style={styles.banner}>
          <Text style={styles.bannerTitulo}>
            Encontre seu horário
          </Text>
          <Text style={styles.bannerTexto}>
            Escolha uma agenda, um dia e o horário da sua prática.
          </Text>
        </View>

        <Text style={styles.titulo}>Agendas disponíveis</Text>

        {AGENDAS.map((item) => {
          const selecionada = agenda === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.cardAgenda,
                selecionada && styles.selecionado,
              ]}
              onPress={() => {
                setAgenda(item.id);
                setHorario('');
              }}
              activeOpacity={0.8}
            >
             
              <View style={styles.agendaInfo}>
                <Text style={styles.agendaNome}>{item.nome}</Text>
                <Text style={styles.professor}>{item.professor}</Text>
              </View>

              <Text style={styles.marcador}>
                {selecionada ? '●' : '○'}
              </Text>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.titulo}>Escolha o dia</Text>

        <View style={styles.dias}>
          {DIAS.map((item) => {
            const selecionado = dia === item.numero;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.cardDia,
                  selecionado && styles.diaAtivo,
                ]}
                onPress={() => {
                  setDia(item.numero);
                  setHorario('');
                }}
              >
                <Text
                  style={[
                    styles.diaNome,
                    selecionado && styles.textoBranco,
                  ]}
                >
                  {item.nome}
                </Text>

                <Text
                  style={[
                    styles.diaNumero,
                    selecionado && styles.textoBranco,
                  ]}
                >
                  {item.numero}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.titulo}>Horários disponíveis</Text>

        <View style={styles.horarios}>
          {HORARIOS.map((item) => {
            const selecionado = horario === item.hora;

            return (
              <TouchableOpacity
                key={item.id}
                disabled={!item.livre}
                style={[
                  styles.cardHorario,
                  selecionado && styles.horarioAtivo,
                  !item.livre && styles.horarioOcupado,
                ]}
                onPress={() => setHorario(item.hora)}
              >
                <Text
                  style={[
                    styles.horaTexto,
                    selecionado && styles.textoBranco,
                    !item.livre && styles.textoOcupado,
                  ]}
                >
                  {item.hora}
                </Text>

                <Text
                  style={[
                    styles.statusHorario,
                    selecionado && styles.textoBranco,
                    !item.livre && styles.textoOcupado,
                  ]}
                >
                  {item.livre ? 'Disponível' : 'Ocupado'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.botao}
          onPress={confirmar}
          activeOpacity={0.8}
        >
          <Text style={styles.botaoTexto}>
            Solicitar agendamento
          </Text>
        </TouchableOpacity>

        <Text style={styles.rodape}>
          Relax - Aprender, praticar e evoluir
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F7F3',
  },
  container: {
    padding: 20,
    paddingBottom: 35,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },

    headerEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  botaoVoltar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  logo: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#477864',
  },
  subtitulo: {
    fontSize: 12,
    color: '#758078',
    marginTop: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCECE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTexto: {
    color: '#315747',
    fontSize: 19,
    fontWeight: 'bold',
  },
  banner: {
    backgroundColor: '#E4EEE7',
    borderRadius: 18,
    padding: 20,
    marginBottom: 25,
  },
  bannerTitulo: {
    color: '#294B3B',
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bannerTexto: {
    color: '#587164',
    fontSize: 14,
    lineHeight: 21,
  },
  titulo: {
    color: '#26352D',
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 13,
    marginTop: 5,
  },
  cardAgenda: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E7E1',
  },
  selecionado: {
    borderColor: '#477864',
    borderWidth: 2,
  },
  agendaIcone: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#477864',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconeTexto: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  agendaInfo: {
    flex: 1,
    marginLeft: 12,
  },
  agendaNome: {
    color: '#26352D',
    fontSize: 14,
    fontWeight: 'bold',
  },
  professor: {
    color: '#758078',
    fontSize: 12,
    marginTop: 5,
  },
  marcador: {
    color: '#477864',
    fontSize: 22,
    marginLeft: 8,
  },
  dias: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  cardDia: {
    width: '18%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E7E1',
  },
  diaAtivo: {
    backgroundColor: '#477864',
    borderColor: '#477864',
  },
  diaNome: {
    color: '#758078',
    fontSize: 10,
    fontWeight: 'bold',
  },
  diaNumero: {
    color: '#26352D',
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 5,
  },
  textoBranco: {
    color: '#FFFFFF',
  },
  horarios: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardHorario: {
    width: '48%',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E4DC',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  horarioAtivo: {
    backgroundColor: '#477864',
    borderColor: '#477864',
  },
  horarioOcupado: {
    backgroundColor: '#E8EAE7',
    borderColor: '#E8EAE7',
  },
  horaTexto: {
    color: '#315747',
    fontSize: 17,
    fontWeight: 'bold',
  },
  statusHorario: {
    color: '#758078',
    fontSize: 12,
    marginTop: 5,
  },
  textoOcupado: {
    color: '#999F99',
  },
  botao: {
    backgroundColor: '#315747',
    borderRadius: 13,
    padding: 17,
    alignItems: 'center',
    marginTop: 15,
  },
  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  rodape: {
    color: '#89928B',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 22,
  },
});
