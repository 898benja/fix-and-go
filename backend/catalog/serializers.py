from rest_framework import serializers

from accounts.models import ProviderProfile
from .models import Category, Commune


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon']
        read_only_fields = fields


class CommuneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commune
        fields = ['id', 'name', 'slug']
        read_only_fields = fields


class ProviderListSerializer(serializers.ModelSerializer):
    """Prestador en listado de búsqueda (sin datos privados)."""

    phone = serializers.SerializerMethodField()

    def get_phone(self, obj):
        return ''

    user_id = serializers.IntegerField(source='user.id', read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    communes = CommuneSerializer(many=True, read_only=True)

    class Meta:
        model = ProviderProfile
        fields = [
            'id', 'user_id', 'display_name', 'description',
            'years_experience', 'phone', 'categories', 'communes',
            'is_active', 'is_verified',
        ]
        read_only_fields = fields


class ProviderDetailSerializer(ProviderListSerializer):
    """Detalle completo del prestador (público)."""
    pass
