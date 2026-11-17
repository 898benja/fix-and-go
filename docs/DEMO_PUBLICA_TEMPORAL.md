# Demostración temporal por Internet

Esta configuración sirve la app web Expo y la API Django bajo una sola URL HTTPS mediante un Cloudflare Quick Tunnel. No necesita cuenta ni dominio. Los contenedores usan un volumen SQLite independiente del entorno local; no copiar datos personales a esta instancia. Django se ejecuta con `DEBUG=false`; el pago simulado se habilita únicamente mediante `PUBLIC_DEMO_ENABLED=true` y `PAYMENTS_DEMO_ENABLED=true`. Webpay de integración está deshabilitado.

## Iniciar

Desde la raíz del repositorio del software, con Docker Desktop abierto:

```sh
cp public-demo.env.example .env.public-demo
```

Editar `.env.public-demo` y sustituir la clave de ejemplo por una cadena aleatoria larga. No compartir ni subir ese archivo.

```sh
docker compose --env-file .env.public-demo -f compose.public-demo.yaml up --build -d
curl http://localhost:18091/api/v1/health/
docker compose --env-file .env.public-demo -f compose.public-demo.yaml exec -T backend python manage.py seed_map_demo
docker run -d --name fixgo_public_tunnel --network fixgo_public_demo_default cloudflare/cloudflared:latest tunnel --no-autoupdate --url http://gateway:80
docker logs fixgo_public_tunnel
```

El registro del último comando muestra una URL `https://...trycloudflare.com`. Abrirla en otro computador y pulsar **Comprobar conexión**. Los tres prestadores del mapa son ficticios y no tienen contraseña; el evaluador puede crear una cuenta de cliente con datos ficticios. El enlace será distinto cada vez que se cree otro túnel; actualizar el README antes de compartirlo con el docente. La demo pública está disponible para cualquiera que tenga la URL, así que usar solo cuentas y datos ficticios.

## Detener

```sh
docker stop fixgo_public_tunnel
docker compose --env-file .env.public-demo -f compose.public-demo.yaml down
```

`down` conserva el volumen de la base de datos; no usar `down -v` salvo que se quiera borrar expresamente la demo. El túnel no tiene garantía de disponibilidad y requiere que el Mac y Docker permanezcan encendidos. Para uso permanente se necesita hosting y configuración de producción.

## Evidencia de verificación inicial

El 4 de noviembre de 2026 se obtuvo HTTP 200 en la pantalla de acceso, `/api/v1/health/` y `/map/` a través de la URL pública. Un cliente ficticio se registró por esa URL con HTTP 201 y consultó tres prestadores ficticios con HTTP 200. La cotización y el pago simulado aún requieren una prueba manual completa desde otro computador.
