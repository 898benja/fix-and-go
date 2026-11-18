/** Normalize Expo web data URLs and native Base64 to the API's strict contract. */
export function pdfBase64(value: string | undefined): string {
  if (!value) throw new Error('No pudimos leer el PDF. Selecciona el archivo nuevamente.');
  const content = value.startsWith('data:')
    ? /^data:[^,]*;base64,([\s\S]*)$/.exec(value)?.[1]
    : value;
  if (!content || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(content)) {
    throw new Error('No pudimos leer el PDF. Selecciona el archivo nuevamente.');
  }
  const padding = content.endsWith('==') ? 2 : content.endsWith('=') ? 1 : 0;
  const bytes = content.length / 4 * 3 - padding;
  if (bytes > 3 * 1024 * 1024) throw new Error('El CV debe ser un PDF de hasta 3 MB.');
  return content;
}
