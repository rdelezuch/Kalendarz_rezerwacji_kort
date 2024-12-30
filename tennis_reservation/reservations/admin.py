from django.contrib import admin
from .models import Reservation

class ReservationAdmin(admin.ModelAdmin):
    list_display = ('id', 'court', 'start_time', 'end_time', 'get_user_email', 'get_user_first_name', 'get_user_last_name')
    
    # Definiowanie metod pomocniczych dla pól użytkownika
    def get_user_email(self, obj):
        return obj.user.email  # Pobieranie emaila użytkownika
    
    def get_user_first_name(self, obj):
        return obj.user.first_name  # Pobieranie imienia użytkownika
    
    def get_user_last_name(self, obj):
        return obj.user.last_name  # Pobieranie nazwiska użytkownika
    
    # Ustawianie nagłówków dla tych kolumn
    get_user_email.short_description = 'Email'
    get_user_first_name.short_description = 'Imię'
    get_user_last_name.short_description = 'Nazwisko'

admin.site.register(Reservation, ReservationAdmin)