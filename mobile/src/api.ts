/** Contrato compartido con Django: todas las rutas terminan en /. */
// La demo pública sirve web y API bajo el mismo origen para evitar que el
// navegador del visitante intente conectar con `localhost` de su computador.
const publicDemoOrigin =
  typeof window !== "undefined" &&
  typeof window.location !== "undefined" &&
  (window.location.hostname.endsWith(".trycloudflare.com") ||
    window.location.port === "18091")
    ? window.location.origin
    : undefined;
export const apiUrl =
  publicDemoOrigin ?? process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");
export type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "CLIENT" | "PROVIDER";
  phone: string;
  default_address: string;
  default_commune: number | null;
};
export type Session = { token: string; user: User };
export type Option = { id: number; name: string; slug: string };
export type Provider = {
  verification_status?: 'DRAFT'|'PENDING'|'APPROVED'|'REJECTED';
  avatar?: string;
  avg_rating?: number | null;
  rating_count?: number;
  latitude: number | null;
  longitude: number | null;
  map_visible: boolean;
  distance_km?: number | null;
  requested_point?: { latitude: number; longitude: number };
  id: number;
  user_id: number;
  display_name: string;
  description: string;
  years_experience: number | null;
  phone: string;
  categories: Option[];
  communes: Option[];
  is_active: boolean;
};
export type Quote = {
  id: number;
  description: string;
  price: number;
  status: string;
  notes: string;
};
export type RequestItem = {
  id: number;
  description: string;
  category_name: string;
  commune_name: string;
  client_name: string;
  provider_name: string;
  status: string;
  status_display: string;
  address?: string;
  preferred_date?: string | null;
  preferred_time?: string;
  quote?: Quote | null;
};
export type Rating = { id: number; score: number; comment: string };
export type Page<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
// Background refresh must also notify the active session when its token expires.
const expiryListeners = new Set<(token: string) => void>();
export function onSessionExpired(listener: (token: string) => void) {
  expiryListeners.add(listener);
  return () => { expiryListeners.delete(listener); };
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export function describe(value: unknown): string {
  if (typeof value === "string") {
    const embedded = value.match(/ErrorDetail\(string=['"](.*?)['"],\s*code=['"].*?['"]\)/g);
    if (embedded) return embedded.map(item => item.match(/string=['"](.*?)['"]/)?.[1] || "").filter(Boolean).join(" ");
    if (/Traceback|<html|<!doctype|\[object Object\]/i.test(value)) return "No se pudo completar la acción. Inténtalo nuevamente.";
    return value.trim() || "Revisa los datos e inténtalo nuevamente.";
  }
  if (Array.isArray(value)) return value.map(describe).join(" ");
  const labels: Record<string, string> = {email:"Correo electrónico", password:"Contraseña", first_name:"Nombre", last_name:"Apellido", phone:"Teléfono", default_address:"Dirección", default_commune:"Comuna", display_name:"Nombre visible", description:"Descripción", address:"Dirección", category_id:"Servicio", commune_id:"Comuna", provider_id:"Prestador", price:"Precio", quantity:"Cantidad", unit_price:"Precio por unidad", preferred_date:"Fecha", preferred_time:"Horario", text:"Mensaje", score:"Calificación", reason:"Motivo", caption:"Descripción de la foto", non_field_errors:"", detail:""};
  if (value && typeof value === "object" && Object.keys(value).length)
    return Object.entries(value)
      .map(([key, item]) => `${labels[key] === undefined ? "Revisa los datos" : labels[key]}${labels[key] === "" ? "" : ": "}${describe(item)}`)
      .join("\n");
  return "No se pudo completar la operación.";
}
export async function api<T>(
  path: string,
  token?: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  if (!apiUrl)
    throw new Error(
      "No pudimos conectar con el servicio. Inténtalo nuevamente más tarde.",
    );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${apiUrl}/api/v1/${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    let data: any;
    let malformed = false;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
      malformed = true;
    }
    if (response.status === 401 && token) expiryListeners.forEach(listener => listener(token));
    if (!response.ok)
      throw new ApiError(
        response.status >= 500
          ? "El servicio no está disponible por el momento. Inténtalo de nuevo en unos minutos."
          : response.status === 429
          ? "Has realizado varios intentos seguidos. Espera un momento y vuelve a intentarlo."
          : response.status === 401 && !path.startsWith("auth/login/")
          ? "Tu sesión terminó. Vuelve a ingresar."
          : [describe(data?.detail ?? data), data?.field_errors ? describe(data.field_errors) : ""].filter(Boolean).join("\n"),
        response.status,
      );
    if (malformed) throw new ApiError("No pudimos leer la respuesta del servicio. Actualiza la pantalla e inténtalo nuevamente.", response.status);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw new Error("La conexión está tardando demasiado. Comprueba tu red y vuelve a intentarlo.");
    throw new Error(
      "No pudimos conectar con FIX&GO. Comprueba la red e inténtalo otra vez.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
export async function checkHealth() {
  const health = await api<{
    status: string;
    database: string;
    service: string;
  }>("health/");
  if (
    health.status !== "ok" ||
    health.database !== "ok" ||
    health.service !== "fix-and-go-api"
  )
    throw new Error("La API de FIX&GO no está disponible.");
  return health;
}
/** Catálogos pequeños: recorrer páginas sin enviar tokens a URLs recibidas del servidor. */
export async function options(path: string): Promise<Option[]> {
  const rows: Option[] = [];
  for (let page = 1; ; page++) {
    const result = await api<Page<Option>>(
      `${path}?page=${page}&page_size=100`,
    );
    rows.push(...result.results);
    if (!result.next) return rows;
  }
}
