"""El postulante no se publica antes de la aprobación y sus documentos son privados."""
import base64
import io
import tempfile
from unittest.mock import patch
from django.contrib import admin
from django.test import override_settings
from django.urls import reverse
from PIL import Image
from rest_framework.test import APITestCase
from .models import ProviderProfile, User


class VerificationTests(APITestCase):
    def test_pending_provider_private_documents_and_admin_approval(self):
        with tempfile.TemporaryDirectory() as directory, override_settings(MEDIA_ROOT=directory):
            provider = User.objects.create_user(username='pro', email='pro@example.test', password='ValidPass-8492', role='PROVIDER')
            client = User.objects.create_user(username='client', email='client@example.test')
            profile = ProviderProfile.objects.create(user=provider, display_name='Oficio', is_active=False)
            self.client.force_authenticate(client)
            self.assertEqual(self.client.get(reverse('provider-list')).data['count'], 0)
            self.assertEqual(self.client.get(reverse('provider-verification')).status_code, 403)
            self.client.force_authenticate(provider)
            self.assertEqual(self.client.post(reverse('provider-verification'), {'rut':'12.345.678-5'}, format='json').status_code, 400)
            image=io.BytesIO();Image.new('RGB',(24,24),'blue').save(image,format='PNG')
            self.assertEqual(self.client.post(reverse('provider-avatar'), {'image_base64':base64.b64encode(image.getvalue()).decode()},format='json').status_code, 200)
            pdf=b'%PDF-1.4\n' + b'A' * 120 + b'\n%%EOF'
            submitted=self.client.post(reverse('provider-verification'), {
                'rut':'12.345.678-5','profession':'Gasfitería','professional_background':'Experiencia en instalaciones',
                'cv_base64':base64.b64encode(pdf).decode(),'privacy_acknowledged':True,
            },format='json')
            self.assertEqual(submitted.status_code, 200, submitted.data)
            profile.refresh_from_db()
            self.assertEqual(profile.verification_status,'PENDING')
            self.assertEqual(profile.rut,'12345678-5')
            self.client.force_authenticate(client)
            self.assertEqual(self.client.get(reverse('provider-list')).data['count'],0)
            self.assertNotIn('rut',str(self.client.get(reverse('provider-list')).data))
            self.assertEqual(self.client.get(reverse('admin:provider-cv-download',args=[profile.pk])).status_code,302)
            model_admin=admin.site._registry[ProviderProfile]
            with patch.object(model_admin,'message_user'):
                model_admin.approve_profiles(type('AdminRequest',(),{'user':None})(),ProviderProfile.objects.filter(pk=profile.pk))
            profile.refresh_from_db()
            self.assertEqual(profile.verification_status,'APPROVED')
            self.assertTrue(profile.is_verified)
            self.assertEqual(self.client.get(reverse('provider-list')).data['count'],1)
            self.assertNotIn('12345678-5',str(self.client.get(reverse('provider-list')).data))
