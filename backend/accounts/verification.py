"""Verificación documental privada de prestadores en Chile."""
import base64
import binascii
import uuid
from django.core.files.base import ContentFile
from rest_framework import serializers


def normalize_rut(value):
    compact = value.upper().replace('.', '').replace('-', '').replace(' ', '')
    if len(compact) < 8 or len(compact) > 9 or not compact[:-1].isdigit() or compact[-1] not in '0123456789K':
        raise serializers.ValidationError('Ingresa un RUT chileno válido.')
    total = sum(int(digit) * factor for digit, factor in zip(reversed(compact[:-1]), [2, 3, 4, 5, 6, 7] * 2))
    check = 11 - total % 11
    digit = '0' if check == 11 else 'K' if check == 10 else str(check)
    if compact[-1] != digit:
        raise serializers.ValidationError('El dígito verificador del RUT no coincide.')
    return f'{compact[:-1]}-{digit}'


class VerificationInput(serializers.Serializer):
    rut = serializers.CharField(max_length=20)
    profession = serializers.CharField(max_length=120)
    professional_background = serializers.CharField(max_length=2000)
    cv_base64 = serializers.CharField(max_length=4200000, trim_whitespace=False)
    privacy_acknowledged = serializers.BooleanField()

    def validate_rut(self, value):
        return normalize_rut(value)

    def validate_privacy_acknowledged(self, value):
        if not value:
            raise serializers.ValidationError('Debes aceptar el uso de estos datos para revisar tu postulación.')
        return value

    def validate_cv_base64(self, value):
        try:
            content = base64.b64decode(value, validate=True)
        except (ValueError, binascii.Error):
            raise serializers.ValidationError('Adjunta un PDF válido.')
        if not content.startswith(b'%PDF-') or len(content) > 3 * 1024 * 1024 or len(content) < 100:
            raise serializers.ValidationError('El CV debe ser un PDF de hasta 3 MB.')
        return content


def save_verification(profile, data):
    """Guarda la postulación; solo el personal administrador puede aprobarla."""
    from django.utils import timezone
    from .models import ProviderProfile
    if ProviderProfile.objects.filter(rut=data['rut']).exclude(pk=profile.pk).exists():
        raise serializers.ValidationError({'rut':'Este RUT ya está registrado en otra postulación.'})
    old_cv = profile.cv.name
    profile.rut = data['rut']
    profile.profession = data['profession'].strip()
    profile.professional_background = data['professional_background'].strip()
    profile.cv.save(f'{uuid.uuid4().hex}.pdf', ContentFile(data['cv_base64']), save=False)
    profile.verification_status = 'PENDING'
    profile.is_verified = False
    profile.verification_note = ''
    profile.reviewed_at = None
    try:
        profile.save()
    except Exception:
        profile.cv.delete(save=False)
        raise
    if old_cv and old_cv != profile.cv.name:
        profile.cv.storage.delete(old_cv)
