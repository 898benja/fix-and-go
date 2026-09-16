from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """Identidad extensible; roles y perfiles se definirán con las reglas del MVP."""
