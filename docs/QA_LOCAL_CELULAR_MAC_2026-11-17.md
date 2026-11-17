# Prueba local de FIX&GO en celular y Mac

Fecha: 17 de noviembre de 2026. Alcance: navegador móvil como cliente y navegador de la Mac como prestador. No equivale a prueba de una app nativa instalada ni a certificación de producción.

## Abrir ahora

1. Conecta celular y Mac a la misma Wi-Fi. Mantén la Mac encendida y evita que entre en reposo durante la prueba.
2. Abre **http://192.168.100.220:8091/** en Safari o Chrome del celular y de la Mac.
3. En el celular ingresa como `cliente.local@example.test`. En la Mac, como `prestador.local@example.test`.
4. Las contraseñas están en `.local/accesos.txt` de la carpeta del software, excluida de Git. También se entregan en el mensaje de esta revisión.
5. Busca **Tomás Herrera · Servicios del hogar**, especialidad **Agua / Gasfitería**, comuna **Santiago**. Son cuentas y datos ficticios.

El servidor utiliza `backend/db.local-qa.sqlite3` y `backend/media/local-qa`. La base `db.sqlite3` anterior se conserva. La solicitud 3 contiene un recorrido QA completado y valoración sintética. Las solicitudes 1 y 2 provienen de intentos de calibración del script; crea una solicitud nueva para la prueba manual.

**Todos los pagos son simulados. No ingreses tarjetas reales ni transfieras dinero.** El ejemplo de $700 no se descuenta de ninguna cuenta.

## Reiniciar en otro momento

Desde la carpeta `work/fix-and-go-map`:

```bash
python3 scripts/configure-local.py
cd backend
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_local_qa
.venv/bin/python manage.py runserver 0.0.0.0:8000 --noreload
```

En otra terminal, desde `work/fix-and-go-map`:

```bash
cd mobile
npm run web -- --port 8091 --lan
```

El configurador imprime la dirección actual de la Mac. Si cambia el Wi-Fi, vuelve a ejecutarlo y reinicia ambos servidores. No restablece contraseñas ni elimina datos. Se detienen con Control+C en sus terminales. No publiques `.env`, `.local`, bases ni fotografías privadas.

## Recorrido principal de aceptación

Registra para cada caso: fecha, teléfono y versión de sistema, navegador, versión del código, resultado observado y captura sin contraseña. Todos los casos de celular físico están pendientes de que los ejecute el usuario.

| Caso | Dispositivo y acción | Resultado esperado |
|---|---|---|
| QA01 | Ambos: comprobar conexión antes de ingresar | Aviso legible de conexión disponible. |
| QA02 | Celular: contraseña incorrecta una vez | Error visible y comprensible, sin ErrorDetail, HTML ni trazas. Se puede cerrar y reintentar. |
| QA03 | Ambos: ingresar con sus cuentas | Cliente ve Explorar; prestador ve Inicio. No se mezclan sesiones. |
| QA04 | Celular: tocar zona de Santiago y filtrar Agua / Gasfitería | Mapa y ficha de Tomás; perfil y descripción legibles. |
| QA05 | Celular: solicitar reparación con descripción de más de 10 caracteres y dirección ficticia | Nueva solicitud; no se cobra ni se abre chat. Guarda su número. |
| QA06 | Mac: permanecer en Inicio o Solicitudes | Aparece la solicitud nueva en unos 5 a 12 segundos con red normal. También existe actualización manual. |
| QA07 | Mac: cotizar trabajo por $500 | Cliente recibe cotización; rol cliente no puede cotizar. |
| QA08 | Celular: aceptar cotización; primero elegir Volver sin cambios en el diálogo | No cambia el estado al volver. Aceptar después muestra el siguiente paso. |
| QA09 | Mac: proponer material, cantidad 1 y precio $200 | Aparece pendiente de aprobación. Total no incluye material no aprobado. |
| QA10 | Celular: intentar pagar con material pendiente | Pago bloqueado y explicación; aprobar material deja total $700. |
| QA11 | Ambos: revisar conversación antes del pago | Chat bloqueado. Dirección exacta no se revela al prestador antes del pago. |
| QA12 | Celular: seleccionar y guardar tarjeta simulada; confirmar pago | Se confirma pago de prueba por $700; dinero real $0. No pide número bancario ni CVV. |
| QA13 | Celular: revisar comprobante y actualizar | Mismo número de orden y total; no se duplica el pago. |
| QA14 | Ambos: abrir conversación y enviar un mensaje cada uno | Cada participante ve autor y mensaje; refresco periódico sin borrar el texto que está escribiendo. |
| QA15 | Mac: iniciar servicio | Estado En progreso, visible para cliente. |
| QA16 | Celular: intentar terminar sin foto | Error claro indicando que el prestador debe adjuntar evidencia; trabajo sigue en curso. |
| QA17 | Mac: agregar foto JPEG o PNG de menos de 2 MB, sin datos personales | Foto guardada; cliente puede abrirla. Prueba además una imagen inválida y verifica mensaje legible. |
| QA18 | Celular: confirmar trabajo terminado y valorar | Servicio completado, una valoración; aparece en clientes atendidos del prestador. |
| QA19 | Nueva solicitud sin pago: cancelar y primero volver sin cambios | Diálogo explica consecuencia, botón destructivo claro. Cancelar definitivamente cierra solo esa solicitud. |
| QA20 | Servicio pagado: enviar reclamo con al menos 10 caracteres | Se conserva motivo y estado En revisión. No se promete reembolso inmediato ni se sanciona automáticamente. |
| QA21 | Ambos: desconectar Wi-Fi durante consulta y reconectar | Aviso de conexión, datos escritos se conservan; actualización se recupera. No reenviar pago a ciegas. |
| QA22 | Celular: girar pantalla, abrir teclado y aumentar tamaño de texto | Botones y mensajes siguen accesibles; sin texto cortado ni controles detrás del teclado. Registrar problemas reales. |
| QA23 | Mac: recorrer controles con Tab; celular: VoiceOver o TalkBack | Controles con nombres y avisos anunciados; confirmar foco y retorno en diálogos. Validación asistiva pendiente. |
| QA24 | Ambos: cerrar sesión y volver a ingresar | Datos del servicio persisten. En web, recargar la página puede pedir login porque el token se mantiene solo en memoria. |

## Resultados ejecutados en esta revisión

- Backend: 85 pruebas aprobadas con Python 3.13, Django 5.2.17, DRF 3.16.1 y dependencias de `requirements.txt`.
- Cliente: 20 pruebas automatizadas aprobadas; TypeScript sin errores.
- `manage.py check`: sin incidencias; modelos sin migraciones pendientes; `pip check`: dependencias compatibles.
- Recorrido HTTP real: 13 verificaciones aprobadas, incluyendo total $700, bloqueos, chat, foto, cierre, valoración y orden única.
- Navegador de la Mac: login incorrecto y correcto, inicio del prestador, entrada por IP LAN, mapa/ficha del cliente y diálogo de cancelación observados.
- Pendientes: dispositivo físico del usuario, red del teléfono, Safari/Chrome móvil, accesibilidad con lector, carga/concurrencia sostenida, Webpay externo y despliegue comercial.

## Problemas corregidos

- Avisos de error, éxito y actualización con componente compartido, texto y semántica accesible.
- Confirmaciones explican consecuencias y distinguen acciones destructivas; ancho limitado en escritorio.
- Errores generales ya no ocultan errores adicionales de campos.
- HTML, trazas y respuestas malformadas no se presentan como mensajes técnicos al usuario.
- Sesiones vencidas notificadas también desde actualizaciones en segundo plano.
- Falla al cargar especialidades deja de ser silenciosa y permite reintentar.
- Inicio y listado del prestador actualizan automáticamente; cotizados, aceptados y en curso se distinguen.
- Validación de modelos Django se devuelve como 400 legible, en vez de tratarse como fallo interno.
- Transiciones documentadas alineadas con cancelación antes del pago; las guardas económicas permanecen en backend.

## Si el celular no conecta

Primero abre `http://192.168.100.220:8000/api/v1/health/` desde el teléfono: debe devolver `status: ok`. Si no abre, revisa misma Wi-Fi, IP actual, servidores activos y aislamiento de dispositivos de la red. Si macOS solicita permitir conexiones entrantes al servidor, revisa esa autorización local; no desactives el firewall completo. Si abre la app pero no el mapa, el mapa necesita Internet para descargar cartografía. La demo no usa un enlace público ni requiere hosting.

## Criterio de aceptación

Aceptar el recorrido cuando QA01–QA19 y QA24 funcionen en ambos dispositivos, sin pérdida de datos, duplicación de pagos ni acceso entre roles incorrectos. Registrar pendientes de accesibilidad y recuperación antes de declarar esas capacidades validadas. Ningún conjunto finito de pruebas permite afirmar que no existe ningún bug: esta revisión acredita los casos indicados y conserva los límites pendientes.
