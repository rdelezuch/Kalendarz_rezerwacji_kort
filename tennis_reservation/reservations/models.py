from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Court(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class Reservation(models.Model):
    court = models.ForeignKey(Court, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reservations", null=True, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    notes = models.CharField(max_length=150, blank=True, null=True)

    def __str__(self):
        return f"Rezerwacja - Kort {self.court}"
