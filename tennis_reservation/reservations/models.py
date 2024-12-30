from django.db import models
from django.contrib.auth.models import User

class Court(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class Reservation(models.Model):
    court = models.ForeignKey(Court, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    first_name = models.CharField(max_length=100)  # Kolumna dla imienia
    last_name = models.CharField(max_length=100)   # Kolumna dla nazwiska
    user_email = models.EmailField()
    phone = models.CharField(max_length=15, blank=True, null=True)
    agreement = models.BooleanField(default=False)

    def __str__(self):
        return f"Rezerwacja {self.first_name} {self.last_name} - Kort {self.court}"
