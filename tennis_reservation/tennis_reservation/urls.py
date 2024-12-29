from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from reservations.views import CourtViewSet, ReservationViewSet, available_slots, weekly_slots, check_availability, get_available_courts

router = DefaultRouter()
router.register(r'courts', CourtViewSet)
router.register(r'reservations', ReservationViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/available_slots/', available_slots, name='available_slots'),
    path('api/weekly_slots/', weekly_slots, name='weekly_slots'),
    path('api/check_availability/', check_availability, name='check_availability'),
    path('api/get_available_courts/', get_available_courts, name='get_available_courts'),
]
