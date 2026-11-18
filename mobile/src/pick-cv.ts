import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { normalizePdfContent } from './pdf-content';
import { pdfBase64 } from './pdf-base64';

/** One picker for registration and corrections; cancellation preserves the previous CV. */
export async function pickCvPdf(): Promise<{content:string;name:string} | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf', copyToCacheDirectory: true, base64: true, multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) throw new Error('No se seleccionó ningún PDF. Inténtalo nuevamente.');
  try {
    if (asset.size && asset.size > 3 * 1024 * 1024) throw new Error('El CV supera los 3 MB. Comprime el PDF y vuelve a adjuntarlo.');
    let raw: string | undefined;
    try { raw = Platform.OS === 'web' ? asset.base64 : await new File(asset.uri).base64(); }
    catch { throw new Error('No pudimos abrir el archivo. Descárgalo en tu dispositivo y vuelve a seleccionarlo.'); }
    return {content:normalizePdfContent(pdfBase64(raw)), name:asset.name};
  } finally {
    // The web picker allocates a blob URL; release it after reading the bytes.
    if (Platform.OS === 'web' && asset.uri.startsWith('blob:')) URL.revokeObjectURL(asset.uri);
  }
}
