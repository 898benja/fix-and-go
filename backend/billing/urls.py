from django.urls import path
from . import views
urlpatterns = [
    path('requests/<int:pk>/materials/', views.materials, name='materials'),
    path('requests/<int:pk>/materials/<int:material_id>/decision/', views.decision, name='material-decision'),
    path('requests/<int:pk>/billing/', views.summary, name='billing-summary'),
    path('requests/<int:pk>/checkout/', views.checkout, name='checkout'),
    path('requests/<int:pk>/payment/demo-result/', views.demo_result, name='demo-payment-result'),
    path('requests/<int:pk>/receipt/', views.receipt, name='receipt'),
    path('requests/<int:pk>/messages/', views.messages, name='service-messages'),
]
