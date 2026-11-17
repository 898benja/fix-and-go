"""Cuentas ficticias para el recorrido de dos dispositivos en la base LAN aislada."""
import secrets
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from accounts.models import User, ProviderProfile
from catalog.models import Category, Commune

class Command(BaseCommand):
    help = 'Crea cliente y prestador locales sin modificar cuentas existentes.'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        if not settings.DEBUG or Path(settings.DATABASES['default']['NAME']).name != 'db.local-qa.sqlite3':
            raise CommandError('Requiere la base aislada creada por scripts/configure-local.py.')
        lines = []
        for role, username, first, last in [('PROVIDER', 'prestador.local', 'Tomás', 'Herrera'), ('CLIENT', 'cliente.local', 'Alex', 'Rojas')]:
            email = f'{username}@example.test'
            user, created = User.objects.get_or_create(username=username, defaults={'email':email,'role':role,'first_name':first,'last_name':last})
            if created:
                password = secrets.token_urlsafe(12)
                user.set_password(password);user.save(update_fields=['password'])
                lines.append(f'{role}\nCorreo: {email}\nContraseña: {password}\n')
            if created and role == 'PROVIDER':
                profile = ProviderProfile.objects.create(user=user, display_name='Tomás Herrera · Servicios del hogar', description='Reparaciones de grifería y mantención del hogar. Atención coordinada en Santiago.', years_experience=5, latitude=-33.4489, longitude=-70.6693, map_visible=True)
                profile.categories.set(Category.objects.filter(slug='agua-gasfiteria'))
                profile.communes.set(Commune.objects.all())
        if lines:
            folder = settings.BASE_DIR.parent / '.local';folder.mkdir(exist_ok=True)
            path = folder/'accesos.txt'
            with path.open('a') as f:f.write('\n'.join(lines))
            path.chmod(0o600)
        self.stdout.write('Cuentas listas. Credenciales privadas en .local/accesos.txt; no se restablecen al repetir el comando.')
