# Correos de FIX&GO

Se generan avisos al recibir una postulación, aprobarla o rechazarla, recibir una solicitud de servicio y confirmar un pago de demostración. El resumen del pago contiene servicio, prestador, fechas, acuerdos de la cotización, materiales, importes, IVA ilustrativo y comisión incluida. Una confirmación repetida no vuelve a generar el correo de pago.

## Configuración local

Sin `EMAIL_HOST`, los correos se guardan en `.local/emails` y **no llegan a la bandeja del destinatario**. Esta carpeta es privada y está excluida de Git. Para envío real, configurar en `backend/.env` las variables de correo indicadas en `.env.example`, usando un remitente autorizado por el proveedor. Nunca publicar la contraseña SMTP. Reiniciar Django después de configurar.

El canal implementado es correo; SMS no está integrado. El sistema usa `transaction.on_commit` para no enviar correos de operaciones revertidas. Si SMTP falla, el evento de negocio se conserva y el error queda en el registro del servidor; aún no existe una cola persistente de reintentos ni confirmación de entrega al buzón. Antes de un lanzamiento se debe agregar esa cola y supervisar rebotes.

Prueba manual: registrar un prestador con datos ficticios completos, revisar el estado pendiente, aprobar desde Django Admin y revisar el correo generado. Como cliente, crear y pagar una solicitud de demostración; revisar el resumen y repetir la confirmación para comprobar que no llega otro resumen idéntico.
