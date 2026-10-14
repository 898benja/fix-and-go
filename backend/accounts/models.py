from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models


class User(AbstractUser):
    """Identidad extensible con rol de negocio.

    Restricciones:
    - El correo electrónico es único sin distinguir mayúsculas (BD-02).
    - El rol es inmutable después de la creación (validado en serializers).
    - Un usuario con rol PROVIDER debe tener un ProviderProfile asociado
      (la creación automática se maneja en el serializer de registro).
    """

    class Role(models.TextChoices):
        CLIENT = 'CLIENT', 'Cliente'
        PROVIDER = 'PROVIDER', 'Prestador'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.CLIENT,
        verbose_name='rol',
    )
    email = models.EmailField('correo electrónico', unique=True)

    class Meta:
        verbose_name = 'usuario'
        verbose_name_plural = 'usuarios'
        # BD-02: índice para búsqueda rápida por rol
        indexes = [
            models.Index(fields=['role'], name='idx_user_role'),
            models.Index(fields=['email'], name='idx_user_email'),
        ]

    def save(self, *args, **kwargs):
        """Normaliza email a minúsculas antes de guardar (BD-02)."""
        if self.email:
            self.email = self.email.lower()
        super().save(*args, **kwargs)

    def clean(self):
        """Validación a nivel de modelo: el rol debe ser válido."""
        super().clean()
        if self.role not in dict(self.Role.choices):
            raise ValidationError({'role': 'Rol no válido.'})

    def __str__(self):
        return f'{self.get_full_name() or self.username} ({self.get_role_display()})'


class ProviderProfile(models.Model):
    """Perfil público del prestador de servicios.

    Restricciones:
    - Solo usuarios con rol PROVIDER pueden tener perfil (limit_choices_to).
    - Un usuario solo puede tener un perfil (OneToOneField).
    - El perfil debe tener un nombre visible no vacío.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='provider_profile',
        limit_choices_to={'role': User.Role.PROVIDER},
    )
    display_name = models.CharField('nombre visible', max_length=120)
    description = models.TextField('descripción', blank=True)
    years_experience = models.PositiveIntegerField(
        'años de experiencia', null=True, blank=True,
    )
    phone = models.CharField(
        'teléfono demostrativo', max_length=20, blank=True,
        help_text='Número ficticio para la demostración.',
    )
    categories = models.ManyToManyField(
        'catalog.Category',
        related_name='providers',
        verbose_name='categorías',
        blank=True,
    )
    communes = models.ManyToManyField(
        'catalog.Commune',
        related_name='providers',
        verbose_name='comunas',
        blank=True,
    )
    is_active = models.BooleanField('activo', default=True)
    is_verified = models.BooleanField(
        'verificación simulada', default=False,
        help_text='Dato demostrativo. FIX&GO no verificó realmente credenciales profesionales.',
    )

    class Meta:
        verbose_name = 'perfil de prestador'
        verbose_name_plural = 'perfiles de prestadores'
        ordering = ['display_name']
        # BD-06: índice para búsqueda de perfiles activos
        indexes = [
            models.Index(fields=['is_active'], name='idx_provider_active'),
        ]

    def clean(self):
        """Validación: solo usuarios PROVIDER pueden tener perfil."""
        if self.user_id and self.user.role != User.Role.PROVIDER:
            raise ValidationError(
                'Solo los usuarios con rol PROVIDER pueden tener perfil de prestador.'
            )

    def __str__(self):
        return self.display_name
