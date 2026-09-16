# FIX&GO

Base técnica del MVP móvil: React Native + Expo + TypeScript y una API monolítica modular Django REST Framework con SQLite local.

## Implementado

- Pantalla móvil de diagnóstico de conexión, con tiempo límite y reintento.
- `GET /api/v1/health/`: comprueba la conexión SQL; devuelve 503 si falla.
- Modelo de usuario extensible y panel Django Admin.
- Migraciones y pruebas de backend; dependencias versionadas.

Todavía no se implementaron registro móvil, roles de contratación, solicitudes, cotizaciones ni trabajos. Sus reglas están pendientes en `docs/decisiones-iniciales.md`.

## Backend (Python 3.13)

```sh
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Copia el secreto generado a `DJANGO_SECRET_KEY` en `.env`. Añade la IP LAN del Mac a `DJANGO_ALLOWED_HOSTS`, separada por coma. Usa `ipconfig getifaddr en0` si Wi-Fi está en esa interfaz.

```sh
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

Administración local: http://127.0.0.1:8000/admin/ . Crea tu propia contraseña; no hay credenciales compartidas. El servidor de desarrollo es para una red de pruebas confiable, no para publicarlo en Internet.

## App móvil (Node 24)

```sh
cd mobile
npm ci
cp .env.example .env
```

Configura `EXPO_PUBLIC_API_URL=http://IP_DEL_MAC:8000`. Esta variable es pública; nunca coloques secretos en variables `EXPO_PUBLIC_`.

```sh
npm start -- --lan
```

Abre el QR con Expo Go compatible con el SDK declarado en `mobile/package.json`. Mac y teléfonos deben estar en una red que permita comunicación entre equipos. En un teléfono `localhost` apunta al propio teléfono. Reinicia Expo después de cambiar `.env`.

Pulsa **Probar conexión**. El resultado debe confirmar API y SQLite. Si la red del instituto aísla dispositivos, prueba una red alternativa y vuelve a configurar la IP. La comprobación en teléfonos físicos sigue pendiente.

## Validación

```sh
cd backend
.venv/bin/python manage.py check
.venv/bin/python manage.py test
cd ../mobile
npm run typecheck
npx expo install --check
npx expo export --platform ios --platform android
```

## Organización

- `mobile/`: app y cliente HTTP.
- `backend/accounts/`: identidad extensible; roles pendientes.
- `backend/core/`: diagnóstico técnico.
- `infra/`: reservado para configuración reproducible; Docker pendiente.
- `docs/`: decisiones técnicas.

La base de datos, archivos `.env`, dependencias y claves permanecen fuera de Git. Solo usar datos ficticios para las pruebas académicas.

## Compatibilidad de compilación nativa

La plantilla usa Expo SDK 57. Expo Go en dispositivo físico debe ser compatible con ese SDK y con el sistema del teléfono. Generar bundles JavaScript no equivale a compilar una app nativa. Para compilar iOS localmente SDK 57 requiere Xcode 26.4 o superior; este Mac tiene Xcode 16.2, por lo que esa compilación queda pendiente. Referencia: https://docs.expo.dev/versions/v57.0.0/ .
