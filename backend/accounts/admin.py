"""Admin de la app accounts (BE-13).

Búsquedas, filtros y columnas útiles para usuarios y perfiles.
Bloqueo de ediciones peligrosas (rol y contraseña no editables directamente).
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.http import FileResponse, Http404
from django.urls import path, reverse
from django.utils import timezone
from django.utils.html import format_html

from .models import ProviderProfile, User
from core.notifications import provider_review


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Administración de usuarios FIX&GO.

    BE-13: búsqueda por email/nombre, filtros por rol/estado,
    columna de rol visible en el listado.
    """

    list_display = [
        'username', 'email', 'first_name', 'last_name',
        'role', 'is_active', 'date_joined',
    ]
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['email', 'first_name', 'last_name', 'username']
    list_per_page = 25

    fieldsets = BaseUserAdmin.fieldsets + (
        ('FIX&GO', {'fields': ('role',)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('FIX&GO', {'fields': ('email', 'role')}),
    )

    # BE-13: bloquear edición de rol desde admin (solo visible)
    readonly_fields = ['date_joined', 'last_login']

    def get_readonly_fields(self, request, obj=None):
        return self.readonly_fields + (['role'] if obj else [])


@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    """Administración de perfiles de prestadores.

    BE-13: búsqueda, filtros, vista de categorías y comunas.
    """

    list_display = [
        'display_name', 'user', 'verification_status', 'is_active', 'is_verified',
        'years_experience', 'phone', 'get_categories', 'get_communes',
    ]
    list_filter = ['verification_status', 'is_active', 'is_verified', 'categories', 'communes']
    search_fields = ['display_name', 'user__email', 'user__first_name', 'user__last_name']
    filter_horizontal = ['categories', 'communes']
    raw_id_fields = ['user']
    list_per_page = 25
    readonly_fields = ['rut', 'profession', 'professional_background', 'cv_download', 'reviewed_at', 'verification_status', 'is_verified']
    exclude = ['cv']
    actions = ['approve_profiles', 'reject_profiles']

    def get_urls(self):
        return [path('<int:profile_id>/cv/', self.admin_site.admin_view(self.download_cv), name='provider-cv-download')] + super().get_urls()

    @admin.display(description='CV privado')
    def cv_download(self, obj):
        if not obj or not obj.cv:
            return 'Sin CV'
        return format_html('<a href="{}">Descargar CV</a>', reverse('admin:provider-cv-download', args=[obj.pk]))

    def download_cv(self, request, profile_id):
        obj = self.get_object(request, str(profile_id))
        if not obj or not obj.cv or not self.has_view_permission(request, obj):
            raise Http404
        return FileResponse(obj.cv.open('rb'), as_attachment=True, filename='cv-prestador.pdf', content_type='application/pdf')

    @admin.action(description='Aprobar postulaciones completas')
    def approve_profiles(self, request, queryset):
        count = 0
        for profile in queryset:
            if profile.verification_status == 'PENDING' and all([profile.rut, profile.profession, profile.professional_background, profile.cv, profile.avatar]):
                profile.verification_status = 'APPROVED'
                profile.is_verified = True
                profile.is_active = True
                profile.reviewed_at = timezone.now()
                profile.save(update_fields=['verification_status','is_verified','is_active','reviewed_at'])
                provider_review(profile, approved=True)
                count += 1
        self.message_user(request, f'{count} postulaciones aprobadas tras revisión administrativa.')

    @admin.action(description='Rechazar postulaciones seleccionadas')
    def reject_profiles(self, request, queryset):
        count = 0
        for profile in queryset.filter(verification_status='PENDING'):
            profile.verification_status='REJECTED';profile.is_verified=False;profile.is_active=False;profile.reviewed_at=timezone.now()
            profile.save(update_fields=['verification_status','is_verified','is_active','reviewed_at'])
            provider_review(profile, approved=False)
            count += 1
        self.message_user(request, f'{count} postulaciones rechazadas. Agrega una observación interna para orientar la nueva presentación.')

    @admin.display(description='Categorías')
    def get_categories(self, obj):
        return ', '.join(c.name for c in obj.categories.all())

    @admin.display(description='Comunas')
    def get_communes(self, obj):
        return ', '.join(c.name for c in obj.communes.all())


# Personalización del sitio
admin.site.site_header = 'FIX&GO · Administración'
admin.site.site_title = 'FIX&GO Admin'
admin.site.index_title = 'Panel de administración'
