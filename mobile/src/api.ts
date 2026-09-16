export type Health = { status: 'ok'; service: 'fix-and-go-api'; database: 'ok' };
export const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');

export async function checkHealth(): Promise<Health> {
  if (!apiUrl) throw new Error('Configura EXPO_PUBLIC_API_URL en mobile/.env con la IP del Mac.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${apiUrl}/api/v1/health/`, { signal: controller.signal });
    if (!response.ok) throw new Error(`La API respondió con estado ${response.status}.`);
    const data = await response.json();
    if (data.status !== 'ok' || data.database !== 'ok' || data.service !== 'fix-and-go-api') {
      throw new Error('La respuesta no corresponde a la API de FIX&GO.');
    }
    return data as Health;
  } finally { clearTimeout(timeout); }
}
