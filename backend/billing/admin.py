from django.contrib import admin
from services.admin import BusinessReadOnlyAdmin
from .models import MaterialExtra, PaymentOrder, ServiceMessage
for model in [MaterialExtra, PaymentOrder, ServiceMessage]:
    admin.site.register(model, BusinessReadOnlyAdmin)
