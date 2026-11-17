"""Perfiles sintéticos independientes: no modifica ubicaciones de usuarios reales."""
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from accounts.models import User, ProviderProfile
from catalog.models import Category, Commune


class Command(BaseCommand):
    help = 'Crea tres prestadores ficticios con puntos públicos de demostración (solo DEBUG).'

    def add_arguments(self, parser):
        parser.add_argument('--refresh-labels', action='store_true', help='Actualizar nombres solo de perfiles sintéticos sin contraseña.')

    @transaction.atomic
    def handle(self, *args, **kwargs):
        if not (settings.DEBUG or settings.PUBLIC_DEMO_ENABLED):
            raise CommandError('Solo disponible en desarrollo o en la demo pública aislada.')
        category = Category.objects.first()
        if not category:
            raise CommandError('Aplica primero las migraciones del catálogo.')
        profiles = [('Andrés Soto', 'Gasfitería y reparaciones para el hogar.', -33.4489, -70.6693),
                    ('Carolina Rojas', 'Instalaciones y mantención para tu hogar.', -33.46, -70.65),
                    ('Matías Silva', 'Reparaciones y mantención general.', -33.49, -70.70)]
        for i, (name, description, lat, lon) in enumerate(profiles, 1):
            user,created = User.objects.get_or_create(username=f'mapa_demo_{i}',defaults={
                'email':f'mapa_demo_{i}@example.test','role':'PROVIDER','first_name':name.split()[0], 'last_name':name.split()[-1],
            })
            if not created:
                if kwargs.get('refresh_labels') and not user.has_usable_password() and user.email == f'mapa_demo_{i}@example.test':
                    ProviderProfile.objects.filter(user=user).update(display_name=name, description=description)
                    user.first_name=name.split()[0];user.last_name=name.split()[-1];user.save(update_fields=['first_name','last_name'])
                continue  # No reescribir ni republicar decisiones de perfiles existentes.
            user.set_unusable_password();user.save(update_fields=['password'])
            p=ProviderProfile.objects.create(user=user,display_name=name,
                description=description,
                latitude=lat,longitude=lon,map_visible=True,verification_status='APPROVED')
            p.categories.add(category);p.communes.set(Commune.objects.all())
        self.stdout.write(self.style.SUCCESS('Perfiles de mapa DEMO disponibles.'))
