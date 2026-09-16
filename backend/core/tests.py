from unittest.mock import patch
from django.db import DatabaseError
from django.test import TestCase
from django.urls import reverse
from accounts.models import User

class HealthTests(TestCase):
    def test_anonymous_health_checks_real_database(self):
        response = self.client.get(reverse('health'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'status': 'ok', 'service': 'fix-and-go-api', 'database': 'ok'})

    def test_database_failure_returns_503_without_details(self):
        with patch('core.views.connection.cursor', side_effect=DatabaseError('private details')):
            response = self.client.get(reverse('health'))
        self.assertEqual(response.status_code, 503)
        self.assertNotIn('private details', response.content.decode())

    def test_health_rejects_mutation(self):
        self.assertEqual(self.client.post(reverse('health')).status_code, 405)

    def test_admin_requires_login(self):
        self.assertEqual(self.client.get('/admin/').status_code, 302)

    def test_custom_user_stores_hashed_password(self):
        user = User.objects.create_user(username='test-user', password='test-pass-123')
        self.assertNotEqual(user.password, 'test-pass-123')
        self.assertTrue(user.check_password('test-pass-123'))
