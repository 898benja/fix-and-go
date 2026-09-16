# FIX&GO

Repositorio de código del MVP móvil de FIX&GO para iOS y Android.

## Estado

Estructura inicial de desarrollo. Todavía no hay una aplicación ejecutable ni migraciones de base de datos.

## Arquitectura acordada

- App móvil: React Native, Expo y TypeScript.
- Backend: monolito modular con Django y Django REST Framework.
- Datos: SQLite compartida a través de la API local.
- Administración: Django Admin.
- Demostración: Mac como servidor local y teléfonos en una red compartida.

## Directorios

- `mobile/`: aplicación móvil.
- `backend/`: API, modelo de datos y pruebas.
- `infra/`: configuración de ejecución reproducible.
- `docs/`: documentación técnica y decisiones.

## Desarrollo

Benjamín Olmedo es responsable de la programación. Las reglas de cuentas, solicitudes, cotizaciones y cierre deben confirmarse antes de crear las migraciones iniciales.

Las dependencias se instalarán dentro del proyecto. No se deben versionar secretos, bases de datos locales ni datos personales reales.
