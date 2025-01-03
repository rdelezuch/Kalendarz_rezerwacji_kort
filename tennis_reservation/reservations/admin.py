from django.contrib import admin
from .models import Reservation

class ReservationAdmin(admin.ModelAdmin):
    list_display = ('id', 'court', 'start_time', 'end_time', 'get_user_email', 'get_user_first_name', 'get_user_last_name')
    
    def get_user_email(self, obj):
        return obj.user.email
    
    def get_user_first_name(self, obj):
        return obj.user.first_name
    
    def get_user_last_name(self, obj):
        return obj.user.last_name
    
    # Ustawianie nagłówków
    get_user_email.short_description = 'Email'
    get_user_first_name.short_description = 'Imię'
    get_user_last_name.short_description = 'Nazwisko'

admin.site.register(Reservation, ReservationAdmin)