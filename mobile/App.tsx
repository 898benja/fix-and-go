import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiUrl, checkHealth } from './src/api';

export default function App() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('Comprueba la conexión antes de comenzar a desarrollar el recorrido.');
  async function verify() {
    setStatus('loading');
    try {
      await checkHealth();
      setStatus('ok'); setMessage('La API responde y SQLite está disponible.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'No se pudo conectar. Revisa la red compartida y la API.');
    }
  }
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <StatusBar style="dark" />
      <Text style={styles.brand}>FIX&GO</Text>
      <Text style={styles.tag}>ENTORNO DE DESARROLLO</Text>
      <Text style={styles.title}>Primero, conectemos todo.</Text>
      <Text style={styles.body}>Base móvil para servicios técnicos del hogar. Esta pantalla verifica la comunicación con tu Mac.</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Conexión con el backend</Text>
        <Text selectable style={styles.url}>{apiUrl ?? 'Dirección de API pendiente'}</Text>
        <Text accessibilityLiveRegion="polite" style={[styles.message, status === 'error' && styles.error]}>{message}</Text>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: status === 'loading' }} disabled={status === 'loading'} onPress={verify} style={[styles.button, status === 'loading' && styles.disabled]}>
          {status === 'loading' ? <ActivityIndicator color="#102a36" /> : <Text style={styles.buttonText}>{status === 'ok' ? 'Comprobar otra vez' : 'Probar conexión'}</Text>}
        </Pressable>
      </View>
      <Text style={styles.note}>Siguiente paso: definir cuentas, solicitudes y cotizaciones. Aún no hay funciones de contratación disponibles.</Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40, backgroundColor: '#f4f6f7', gap: 18 },
  brand: { fontSize: 32, fontWeight: '900', color: '#102a36' },
  tag: { fontSize: 11, letterSpacing: 2, color: '#536573', fontWeight: '700' },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '800', color: '#102a36' },
  body: { fontSize: 16, lineHeight: 24, color: '#536573' },
  card: { backgroundColor: 'white', padding: 22, borderRadius: 18, gap: 16 },
  cardTitle: { fontSize: 19, fontWeight: '700', color: '#102a36' },
  url: { color: '#536573', fontSize: 13 },
  message: { color: '#234f42', fontSize: 16, lineHeight: 24 },
  error: { color: '#a02e22' },
  button: { backgroundColor: '#ffbd35', padding: 17, borderRadius: 12, alignItems: 'center', minHeight: 54 },
  disabled: { opacity: 0.6 },
  buttonText: { fontWeight: '700', fontSize: 16, color: '#102a36' },
  note: { fontSize: 13, lineHeight: 20, color: '#536573' },
});
