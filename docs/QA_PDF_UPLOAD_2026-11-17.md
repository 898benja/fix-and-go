# Corrección de carga de CV en navegador

Base revisada: `2ed89cabb2bd932de429563209107e2c4f2fe37b`.

El registro del prestador rechazaba un PDF legible y menor de 3 MB con HTTP 400 y «Adjunta un PDF válido». El backend exige Base64 estricto. El selector web entrega un Data URL cuando se solicita Base64; su prefijo no pertenece al contenido Base64. Además, la versión instalada del selector no habilita esa lectura por defecto.

Se solicita `base64: true` explícitamente en registro y envío de antecedentes. Ambos usan una función compartida que elimina el prefijo del Data URL, conserva Base64 nativo y comprueba formato y tamaño decodificado. La validación del backend no se relaja.

## Verificación realizada

- Node 26.13.1, Windows: 24 pruebas del cliente aprobadas, incluidas cuatro nuevas pruebas de regresión.
- TypeScript: `tsc --noEmit` aprobado.
- Expo: exportación web completada.
- Django, entorno Python 3.12: 17 pruebas de cuentas aprobadas sobre base de pruebas independiente. El primer intento quedó afectado por permisos de archivos temporales del sandbox; la repetición fuera de esa restricción aprobó.
- PDF proporcionado por el usuario: 74.151 bytes, una página, legible y no cifrado. Se reprodujo el rechazo del Data URL por el validador real del backend y se comprobó que el contenido normalizado es aceptado y preserva todos los bytes originales. El archivo y sus datos personales no se incluyen en el repositorio.
- Casos nuevos: Data URL web, Base64 nativo, entradas ausentes o malformadas, aceptación de exactamente 3 MB y rechazo de 3 MB más un byte.

## Límites

No se ejecutó nuevamente toda la suite del backend ni una prueba interactiva completa del formulario en navegador o teléfono. La comprobación con el PDF real fue contra el validador, sin registrar al usuario ni enviar correos. La instancia Docker existente necesita reconstruir el servicio móvil desde la versión corregida para incorporar el cambio; Expo necesita cargar el código actualizado.
