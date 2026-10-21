"""Materiales aprobados y liquidación final del MVP.

Importes enteros en CLP, con IVA incluido en los precios de demostración.
Nunca guardar PAN, CVV, contraseñas bancarias o tarjetas en estos modelos.
"""
from django.conf import settings
from django.db import models

class MaterialExtra(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING'
        APPROVED = 'APPROVED'
        REJECTED = 'REJECTED'
    service_request = models.ForeignKey('services.ServiceRequest', on_delete=models.PROTECT, related_name='material_extras')
    description = models.CharField(max_length=240)
    quantity = models.PositiveIntegerField()
    unit_price = models.PositiveIntegerField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(null=True)

    class Meta:
        ordering = ['id']
        constraints = [
            models.CheckConstraint(condition=models.Q(quantity__gte=1, quantity__lte=10000), name='material_quantity_range'),
            models.CheckConstraint(condition=models.Q(unit_price__gte=1, unit_price__lte=100000000), name='material_price_range'),
        ]

class PaymentOrder(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING'
        DEMO_PAID = 'DEMO_PAID'
        FAILED = 'FAILED'
    # One final collection per service. Snapshot remains immutable after checkout.
    service_request = models.OneToOneField('services.ServiceRequest', on_delete=models.PROTECT, related_name='payment_order')
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    mode = models.CharField(max_length=10, default='DEMO', editable=False)
    service_amount = models.PositiveIntegerField()
    materials_amount = models.PositiveIntegerField()
    total = models.PositiveIntegerField()
    net_amount = models.PositiveIntegerField()
    vat_amount = models.PositiveIntegerField()
    vat_percent = models.PositiveSmallIntegerField()
    snapshot = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True)

    class Meta:
        constraints = [models.CheckConstraint(condition=models.Q(total__gt=0), name='payment_total_positive')]

class ServiceMessage(models.Model):
    """Mensajería interna de demostración, sin enlace ni publicación de teléfonos."""
    service_request = models.ForeignKey('services.ServiceRequest', on_delete=models.PROTECT, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    text = models.CharField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['id']
