from django.contrib import admin
from .models import Reservation

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['start_time', 'end_time', 'first_name', 'last_name', 'court', 'user_email']
