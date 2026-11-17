# FIX&GO — Mejora del recorrido de contratación

Fecha: 17 de noviembre de 2026.

## Criterios
Se conserva la identidad negra, blanca y amarilla. Se aplican jerarquía visual, lenguaje directo, controles amplios y divulgación progresiva. Referencia: [Apple Human Interface Guidelines: Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons). No implica certificación de accesibilidad.

## Cambios
- Formularios y detalle con ancho máximo de 760 puntos y márgenes de 16; evitan líneas excesivamente largas en escritorio.
- Opciones de selección con tipografía de 15 puntos y controles de al menos 44 puntos; botones principales de 50 puntos.
- Solicitud en dos etapas: completar y revisar. Se pueden editar los datos antes de enviar; el envío no implica aceptar precio ni pagar.
- Si una foto falla después de crear la solicitud, se abre la solicitud creada y se informa cómo agregarla, evitando repetir la contratación.
- En solicitudes aceptadas, el pago aparece antes de los datos secundarios. La tarjeta guardada se consulta automáticamente; se mantiene una acción de recuperación si falla la consulta.
- Tras el pago, el chat se presenta al inicio del detalle. El historial tiene desplazamiento propio; se conserva la posición cuando se leen mensajes anteriores. Botón explícito «Enviar» y recuperación del texto si falla el envío.
- El backend sigue controlando permisos, estados, materiales aprobados y habilitación del chat. La interfaz no decide importes definitivos.
- Los pagos siguen siendo demostraciones sin cobro real. La indicación se mantiene visible.

## Verificación
- TypeScript sin errores; 20 pruebas del cliente aprobadas.
- 90 pruebas del backend aprobadas, ejecutadas con la base temporal de pruebas.
- Comprobación visual en navegador local: solicitud aceptada, tarjeta recuperada automáticamente, pago simulado aprobado, chat habilitado y mensaje enviado correctamente.
- Pendiente de validación humana: iPhone físico, teclado y tamaño de texto aumentado, VoiceOver y prueba de comprensión con personas mayores. No se afirma que esta revisión sustituya esas pruebas.

## Registro y correo incluidos en la entrega
El prestador completa sus antecedentes antes de enviar la postulación y visualiza el estado de revisión administrativa. Los avisos de solicitud, revisión y pago cuentan con implementación y documentación. Sin credenciales SMTP se guardan en archivos locales; no se entregan correos reales ni SMS. Véase CORREOS_TRANSACCIONALES.md.
