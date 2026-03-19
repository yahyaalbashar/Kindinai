from django.urls import path
from . import views

urlpatterns = [
    path('create-payment-intent/', views.create_payment_intent),
    path('generate-story/', views.generate_story_view),
    path('story/<uuid:order_id>/', views.get_story),
    path('generate-audio/', views.generate_audio_view),
    path('webhook/stripe/', views.stripe_webhook),
]
