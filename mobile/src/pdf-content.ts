/** Normalize browser data URLs and native base64 to the private API contract. */
export function normalizePdfContent(value: string | undefined): string {
  if (!value) throw new Error('No pudimos leer el PDF. Descárgalo en tu dispositivo y vuelve a seleccionarlo.');
  const content = value.startsWith('data:') ? value.slice(value.indexOf(',') + 1) : value;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(content) || content.length % 4 !== 0 || !content.startsWith('JVBERi0')) {
    throw new Error('El archivo seleccionado no es un PDF válido. Exporta tu CV como PDF y vuelve a intentarlo.');
  }
  const bytes = content.length * 3 / 4 - (content.endsWith('==') ? 2 : content.endsWith('=') ? 1 : 0);
  if (bytes > 3 * 1024 * 1024) throw new Error('El CV supera los 3 MB. Comprime el PDF y vuelve a adjuntarlo.');
  if (bytes < 100) throw new Error('El PDF está vacío o incompleto. Selecciona otro archivo.');
  return content;
}
