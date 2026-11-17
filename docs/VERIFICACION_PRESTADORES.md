# Verificación de prestadores — FIX&GO

## Recorrido

1. El prestador completa un único formulario con nombre, correo, contraseña, teléfono, RUT, oficio, formación, experiencia, foto y CV PDF de hasta 3 MB; acepta el uso de los antecedentes para la revisión.
2. Si faltan antecedentes o no son válidos, no se crea la cuenta. Al completar el envío se crea una postulación `PENDING`, con perfil **inactivo**.
3. La app muestra **Estamos validando tus datos**. Administración puede aprobar o rechazar y el sistema genera un aviso por correo. Tras la aprobación se configuran especialidades, comunas y zona de atención.
4. El servidor valida el dígito verificador del RUT, la unicidad del RUT, el formato y tamaño del PDF, y exige foto. La solicitud queda `PENDING`. Ni el RUT ni el CV aparecen en el catálogo ni en la API pública.
5. Un administrador autenticado revisa los antecedentes en Django Admin. El CV se descarga por una ruta protegida del administrador. Puede aprobar solo postulaciones completas o rechazar la postulación y dejar una observación interna.
6. Solo `APPROVED` y `is_active=True` aparecen en el catálogo y pueden recibir solicitudes nuevas. El prestador consulta su estado desde la app.

El RUT válido **solo confirma la consistencia del número**. El CV y la foto requieren revisión humana; esta función no acredita automáticamente identidad, título, licencia ni autorización para ejercer oficios regulados. Los perfiles sintéticos del MVP son demostrativos.

## Operación de administración

Ruta: `/admin/accounts/providerprofile/`. Filtrar por `Pendiente`. Abrir cada ficha; contrastar nombre, foto, RUT, experiencia, CV, especialidades y comunas. Escribir una observación interna si falta información y usar la acción **Rechazar postulaciones seleccionadas**. Si todo es consistente, usar **Aprobar postulaciones completas**. El estado y la fecha de revisión se guardan en la base. Solo personal autorizado debe tener acceso a Django Admin.

## Protección de datos y límites

- El RUT, la formación, el CV y la observación de revisión no se incluyen en el perfil público. El archivo usa un nombre aleatorio y no existe una ruta pública `/media/` en Django.
- El flujo recoge solo los datos necesarios para esta revisión. No pide fotografía de la cédula, datos de salud ni antecedentes penales de forma general.
- La base, sus copias y los CV deben quedar bajo acceso restringido; la demo local no debe usarse para recibir documentos reales por un túnel público sin HTTPS, política de conservación, procedimiento de derechos del titular y controles operativos adicionales.
- Antes de operar con personas reales, definir responsable de datos, aviso de privacidad, base legal, tiempo de conservación, eliminación, respaldo cifrado, accesos administrativos con segundo factor y registro de auditoría. La aprobación desde este MVP es una decisión humana de la plataforma, no una certificación estatal.

La [Ley 19.628 vigente](https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-10-21) rige el tratamiento actual de datos personales. La [Ley 21.719](https://www.bcn.cl/leychile/navegar?f=2026-12-01&i=1209272) entra en vigor el **1 de diciembre de 2026**; el proceso de producción debe revisarse contra ese régimen antes de su entrada en vigor. Este documento describe controles del MVP y no sustituye una evaluación legal y de seguridad para un lanzamiento público.
