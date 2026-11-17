"""Configura una demo LAN aislada. No modifica una configuración existente ajena."""
from pathlib import Path
import re, secrets, subprocess, os
root = Path(__file__).resolve().parents[1]
network = subprocess.check_output(['ifconfig', 'en0'], text=True)
match = re.search(r'\binet (\d+\.\d+\.\d+\.\d+)', network)
if not match:
    raise SystemExit('Conecta la Mac al Wi-Fi antes de configurar la demo.')
ip = match.group(1)
env = root / 'backend/.env'
marker = '# FIXGO_LOCAL_QA_MANAGED'
existing = env.read_text() if env.exists() else ''
if existing and marker not in existing:
    raise SystemExit('backend/.env ya tiene configuración propia. Revísala antes de cambiar la red.')
key = re.search(r'^DJANGO_SECRET_KEY=(.+)$', existing, re.M)
secret = key.group(1) if key else secrets.token_urlsafe(48)
text = f'''{marker}
DJANGO_SECRET_KEY={secret}
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,{ip}
CORS_ALLOWED_ORIGINS=http://localhost:8091,http://127.0.0.1:8091,http://{ip}:8091
PAYMENTS_DEMO_ENABLED=true
WEBPAY_INTEGRATION_ENABLED=false
PUBLIC_DEMO_ENABLED=false
SQLITE_PATH={root / 'backend/db.local-qa.sqlite3'}
MEDIA_ROOT={root / 'backend/media/local-qa'}
'''
env.write_text(text); os.chmod(env, 0o600)
(root/'mobile/.env.local').write_text(f'EXPO_PUBLIC_API_URL=http://{ip}:8000\n')
print(f'Celular y Mac: http://{ip}:8091 | API: http://{ip}:8000')
