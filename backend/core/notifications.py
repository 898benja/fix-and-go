"""Avisos transaccionales: no incluir CV, RUT ni datos de tarjeta."""
import logging
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction

logger = logging.getLogger(__name__)


def queue_email(email, subject, body):
    if not email:
        return
    def deliver():
        try:
            send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
        except Exception:
            logger.exception('No se pudo enviar un aviso de FIX&GO; revisar configuración de correo.')
    transaction.on_commit(deliver)


def provider_review(profile, approved):
    name = profile.user.first_name or profile.display_name
    if approved:
        body = (f'Hola, {name}:\n\nTu perfil de prestador fue aprobado. Ya puedes configurar tus servicios '
                'y recibir solicitudes en FIX&GO.\n\nEquipo FIX&GO')
        subject = 'FIX&GO · Tu perfil fue aprobado'
    else:
        body = (f'Hola, {name}:\n\nTu postulación requiere correcciones. '
                f'{profile.verification_note or "Revisa tus antecedentes en la app y vuelve a enviarlos."}\n\nEquipo FIX&GO')
        subject = 'FIX&GO · Revisa tu postulación'
    queue_email(profile.user.email, subject, body)


def payment_receipt(order):
    sr = order.service_request
    materials = order.snapshot.get('materials', [])
    money = lambda value: '$' + f'{value:,}'.replace(',', '.')
    lines = [
        f'Hola, {sr.client.first_name or "cliente"}:', '',
        'Tu pago de demostración fue confirmado. No se cobró dinero real ni se emitió boleta tributaria.',
        f'Solicitud: #{sr.pk}', f'Servicio: {sr.category.name}',
        f'Problema informado: {sr.description}',
        f'Trabajo acordado: {order.snapshot.get("service_description", "Ver cotización en la app")}',
        f'Prestador: {sr.provider.provider_profile.display_name}',
        f'Comuna: {sr.commune.name}',
        f'Fecha preferida: {sr.preferred_date or "Por acordar"} {sr.preferred_time or ""}',
        f'Fecha propuesta en cotización: {order.snapshot.get("proposed_date") or "Por acordar"}',
        f'Duración estimada: {order.snapshot.get("estimated_duration") or "Por acordar"}',
        f'Acuerdos y observaciones: {order.snapshot.get("notes") or "Sin observaciones adicionales"}',
        f'Fecha de confirmación del pago: {order.paid_at.isoformat() if order.paid_at else "Pendiente"}',
        '', f'Servicio: {money(order.service_amount)} CLP',
    ]
    for item in materials:
        lines.append(f'Material: {item["description"]} ({item["quantity"]} × {money(item["unit_price"])}): {money(item["total"])} CLP')
    lines.extend([f'Materiales aprobados: {money(order.materials_amount)} CLP',
                  f'Total incluido IVA ilustrativo ({order.vat_percent}%): {money(order.total)} CLP',
                  f'IVA ilustrativo incluido: {money(order.vat_amount)} CLP',
                  f'Comisión FIX&GO incluida en el precio del servicio: {money(order.commission_amount)} CLP',
                  '', 'Este mensaje resume una operación del MVP. No es comprobante tributario ni cargo bancario.',
                  'Puedes consultar el detalle y coordinar el trabajo en la app.'])
    queue_email(sr.client.email, f'FIX&GO · Resumen del servicio #{sr.pk}', '\n'.join(lines))
