# Avance verificado — 4 de noviembre de 2026

- Backend: 83 pruebas aprobadas en Docker (base temporal).
- Móvil: 13 pruebas aprobadas y TypeScript sin errores.
- Flujo integrado automatizado: cotización, aceptación, materiales, bloqueo de pago pendiente, aprobación, tarjeta simulada, pago, habilitación de chat, inicio, carga de fotografía, confirmación del cliente y valoración.
- Pago: una acción principal; selección de tarjeta requerida; retirados el botón redundante de confirmar total y el control de forzar rechazo del recorrido normal.
- Alertas: corregida serialización de ErrorDetail, etiquetas de campos en español y mensajes recuperables para límites de intentos y fallos del servidor.
- Prestadores ficticios: nombres y descripciones aplicados en la instancia aislada, sin modificar perfiles reales.
- API pública comprobada con respuesta correcta y DEBUG=false.

## Pendiente

Recorrido manual completo de las pantallas con dos sesiones y pruebas en dispositivos físicos Android/iOS. La aprobación de pruebas API no equivale a validar toda la interfaz. Los pagos continúan simulados y el enlace depende del Mac y del túnel temporal. No se realizó commit ni push.
