from rest_framework import viewsets
from .models import Court, Reservation
from .serializers import CourtSerializer, ReservationSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view
from datetime import datetime, timedelta
from .models import Reservation, Court
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.dateparse import parse_datetime
from django.db.models import Q
import json

@api_view(['GET'])
def available_slots(request):
    courts = Court.objects.all()
    current_date = datetime.now().date()
    opening_hour, closing_hour = 8, 20

    slots = []
    for hour in range(opening_hour, closing_hour):
        slot_start = datetime.combine(current_date, datetime.min.time()) + timedelta(hours=hour)
        slot_end = slot_start + timedelta(hours=1)

        occupied_courts = Reservation.objects.filter(
            start_time=slot_start, end_time=slot_end
        ).values_list('court', flat=True)

        available_courts = courts.exclude(id__in=occupied_courts)

        slots.append({
            "start": slot_start.isoformat(),
            "end": slot_end.isoformat(),
            "available_courts": list(available_courts.values('id', 'name')),
            "status": "available" if available_courts.exists() else "full"
        })

    return Response(slots)

@api_view(['GET'])
def weekly_slots(request):
    courts = Court.objects.all()
    current_date = datetime.now().date()
    opening_hour, closing_hour = 8, 20  # Zakres godzin pracy
    days_to_display = 90  # Liczba dni do wyświetlenia

    slots = []
    for day_offset in range(days_to_display):
        day = current_date + timedelta(days=day_offset)

        for hour in range(opening_hour, closing_hour):
            slot_start = datetime.combine(day, datetime.min.time()) + timedelta(hours=hour)
            slot_end = slot_start + timedelta(hours=1)

            # Sprawdź kolizje czasowe z rezerwacjami
            overlapping_reservations = Reservation.objects.filter(
                start_time__lt=slot_end,  # Rezerwacja zaczyna się przed końcem slotu
                end_time__gt=slot_start   # Rezerwacja kończy się po rozpoczęciu slotu
            )

            # Jeśli liczba rezerwacji jest równa liczbie kortów, wszystkie są zajęte
            if overlapping_reservations.count() >= courts.count():
                status = "full"
            else:
                status = "available"

            slots.append({
                "day": day.isoformat(),
                "start": slot_start.isoformat(),
                "end": slot_end.isoformat(),
                "status": status
            })

    return Response(slots)

@api_view(['POST'])
def check_availability(request):
    try:
        # Pobranie danych z żądania
        data = json.loads(request.body)
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        court_id = data.get('court')

        # Walidacja wymaganych parametrów
        if not start_time or not end_time or not court_id:
            return JsonResponse({'error': 'Brak wymaganych parametrów: start_time, end_time, court'}, status=400)

        # Sprawdzenie kolizji rezerwacji
        occupied_reservations = Reservation.objects.filter(
            Q(start_time__lt=end_time, end_time__gt=start_time),  # Kolizja czasowa
            court_id=court_id  # Sprawdzenie dla tego samego kortu
        )

        if occupied_reservations.exists():
            return JsonResponse({'available': False})

        # Brak kolizji oznacza dostępność
        return JsonResponse({'available': True})

    except Exception as e:
        # Obsługa błędów i logowanie
        return JsonResponse({'error': f'Błąd w przetwarzaniu żądania: {e}'}, status=400)

@api_view(['GET'])
def get_available_courts(request):
    start_time = request.GET.get('start_time')
    end_time = request.GET.get('end_time')

    if not start_time or not end_time:
        return JsonResponse({"error": "Brak wymaganych parametrów"}, status=400)

    start_time = parse_datetime(start_time)
    end_time = parse_datetime(end_time)

    # Znajdź zajęte korty w podanym przedziale czasowym
    occupied_courts = Reservation.objects.filter(
        start_time__lt=end_time,  # Rezerwacja zaczyna się przed końcem nowego przedziału
        end_time__gt=start_time  # Rezerwacja kończy się po rozpoczęciu nowego przedziału
    ).exclude(
        end_time=start_time  # Wyklucz rezerwacje, które kończą się dokładnie na początku nowego przedziału
    ).values_list('court_id', flat=True)


    # Znajdź dostępne korty
    available_courts = Court.objects.exclude(id__in=occupied_courts)

    return JsonResponse({"available_courts": list(available_courts.values("id", "name"))})

class CourtViewSet(viewsets.ModelViewSet):
    queryset = Court.objects.all()
    serializer_class = CourtSerializer

class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer