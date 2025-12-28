from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MemberViewSet, ServiceTagViewSet, FamilieViewSet, GruppeViewSet, FeedbackViewSet
from .public_views import public_register, verify_family_code

router = DefaultRouter()
router.register(r'members', MemberViewSet)
router.register(r'services', ServiceTagViewSet)
router.register(r'families', FamilieViewSet)
router.register(r'gruppen', GruppeViewSet)
router.register(r'feedbacks', FeedbackViewSet)

urlpatterns = [
    path('public/register/', public_register, name='public_register'),
    path('public/verify-family-code/', verify_family_code, name='verify_family_code'),
    path('', include(router.urls)),
]
