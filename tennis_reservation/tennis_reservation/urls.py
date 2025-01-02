from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from reservations.views import (
    CourtViewSet,
    UserViewSet,
    ReservationViewSet,
    available_slots,
    weekly_slots,
    check_availability,
    get_available_courts,
    RegisterView,
    user_data,
    user_reservations,
    update_user_data,
    delete_reservation,
    send_reservation_email,
    get_all_courts,
    court_reservation_details,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from accounts.serializers import MyTokenObtainPairSerializer

router = DefaultRouter()
router.register(r'courts', CourtViewSet)
router.register(r'reservations', ReservationViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/available_slots/', available_slots, name='available_slots'),
    path('api/weekly_slots/', weekly_slots, name='weekly_slots'),
    path('api/check_availability/', check_availability, name='check_availability'),
    path('api/get_available_courts/', get_available_courts, name='get_available_courts'),
    path('api/accounts/', include('accounts.urls')),
    path('api/token/', TokenObtainPairView.as_view(serializer_class=MyTokenObtainPairSerializer), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/user-data/', user_data, name='user_data'),
    path('api/user-reservations/', user_reservations, name='user_reservations'),
    path('api/update-user-data/', update_user_data, name='update_user_data'),
    path('api/delete-reservation/<int:reservation_id>/', delete_reservation, name='delete_reservation'),
    path('api/send-reservation-email/', send_reservation_email, name='send_reservation_email'),
    path('api/get-all-courts/', get_all_courts, name='get_all_courts'),
    path('api/court-reservation-details/', court_reservation_details, name='court_reservation_details'),
]
