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
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
from rest_framework.views import APIView
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
import json
from .serializers import UserSerializer

User = get_user_model()

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
    court_id = request.GET.get('court')
    courts = Court.objects.all()
    current_date = datetime.now().date()
    opening_hour, closing_hour = 8, 20  # Zakres godzin pracy
    days_to_display = 30  # Liczba dni do wyświetlenia

    slots = []
    for day_offset in range(days_to_display):
        day = current_date + timedelta(days=day_offset)

        for hour in range(opening_hour, closing_hour):
            slot_start = datetime.combine(day, datetime.min.time()) + timedelta(hours=hour)
            slot_end = slot_start + timedelta(hours=1)

            # Sprawdzenie kolizji
            overlapping_reservations = Reservation.objects.filter(
                start_time__lt=slot_end,
                end_time__gt=slot_start
            )

            if court_id:
                overlapping_reservations = overlapping_reservations.filter(court_id=court_id)

            if overlapping_reservations.count() >= (1 if court_id else courts.count()):
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

@api_view(['GET'])
def get_all_courts(request):
    courts = Court.objects.all().values('id', 'name')
    return Response(list(courts))

@api_view(['POST'])
#@permission_classes([IsAuthenticated])
def check_availability(request):
    try:
        data = json.loads(request.body)
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        court_id = data.get('court')

        if not start_time or not end_time or not court_id:
            return JsonResponse({'error': 'Brak wymaganych parametrów: start_time, end_time, court'}, status=400)

        # Sprawdzenie kolizji rezerwacji
        occupied_reservations = Reservation.objects.filter(
            Q(start_time__lt=end_time, end_time__gt=start_time),
            court_id=court_id
        )

        if occupied_reservations.exists():
            return JsonResponse({'available': False})

        # Brak kolizji oznacza dostępność
        return JsonResponse({'available': True})

    except Exception as e:
        return JsonResponse({'error': f'Błąd w przetwarzaniu żądania: {e}'}, status=400)

@api_view(['GET'])
def get_available_courts(request):
    start_time = request.GET.get('start_time')
    end_time = request.GET.get('end_time')

    if not start_time or not end_time:
        return JsonResponse({"error": "Brak wymaganych parametrów"}, status=400)

    start_time = parse_datetime(start_time)
    end_time = parse_datetime(end_time)

    occupied_courts = Reservation.objects.filter(
        start_time__lt=end_time,
        end_time__gt=start_time
    ).exclude(
        end_time=start_time 
    ).values_list('court_id', flat=True)

    available_courts = Court.objects.exclude(id__in=occupied_courts)

    return JsonResponse({"available_courts": list(available_courts.values("id", "name"))})

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'phone']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
        )
        return user


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Użytkownik zarejestrowany pomyślnie."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
#@permission_classes([IsAuthenticated])
def user_data(request):
    user = request.user
    data = {
        "is_staff": user.is_staff,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
    }
    return Response(data)

@api_view(['GET'])
#@permission_classes([IsAuthenticated])
def user_reservations(request):
    user = request.user
    reservations = Reservation.objects.filter(user=user)
    serialized_reservations = [
        {
            "id": res.id,
            "date": res.start_time.date(),
            "start_time": res.start_time.time(),
            "end_time": res.end_time.time(),
            "court_name": res.court.name,
            "notes": res.notes,
        }
        for res in reservations
    ]
    return Response(serialized_reservations)

@api_view(['PUT'])
#@permission_classes([IsAuthenticated])
def update_user_data(request):
    user = request.user
    data = request.data

    user.first_name = data.get('first_name', user.first_name)
    user.last_name = data.get('last_name', user.last_name)
    user.email = data.get('email', user.email)
    user.phone = data.get('phone', user.phone)

    user.save()

    return Response({
        "message": "Dane użytkownika zaktualizowane pomyślnie.",
        "user": {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
        }
    }, status=status.HTTP_200_OK)

@api_view(['DELETE'])
#@permission_classes([IsAuthenticated])
def delete_reservation(request, reservation_id):
    user = request.user
    reservation = get_object_or_404(Reservation, id=reservation_id, user=user)

    reservation.delete()

    return Response({"message": "Rezerwacja została usunięta."}, status=status.HTTP_200_OK)

@api_view(['POST'])
def send_reservation_email(request):
    data = json.loads(request.body)
    recipient_email = data.get("email")
    reservation_details = data.get("reservation_details")

    if not recipient_email or not reservation_details:
        return JsonResponse({"error": "Nie podano wszystkich wymaganych danych"}, status=400)

    try:
        send_mail(
            'Potwierdzenie rezerwacji',
            f'Twoja rezerwacja została potwierdzona:\n{reservation_details}',
            settings.EMAIL_HOST_USER,
            [recipient_email],
        )
        return JsonResponse({"message": "E-mail potwierdzający wysłany pomyślnie"}, status=200)
    except Exception as e:
        return JsonResponse({"error": f"Błąd podczas wysyłania e-maila: {str(e)}"}, status=500)

@api_view(['GET'])
def court_reservation_details(request):
    court_id = request.query_params.get('court_id')
    start_time = request.query_params.get('start_time')
    end_time = request.query_params.get('end_time')

    if not all([start_time, end_time]):
        return JsonResponse({"error": "Brak wymaganych parametrów"}, status=400)

    try:
        reservations = Reservation.objects.filter(
            start_time__lt=end_time,
            end_time__gt=start_time
        )

        if court_id != "all":
            reservations = reservations.filter(court_id=court_id)

        reservation_list = []
        for reservation in reservations:
            reservation_list.append({
                "id": reservation.id,
                "user_email": reservation.user.email if reservation.user else None,
                "start_time": reservation.start_time,
                "end_time": reservation.end_time,
                "court_id": reservation.court.id,
                "notes": reservation.notes,
                "user_phone": reservation.user.phone,
            })

        return JsonResponse(reservation_list, safe=False, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

class CourtViewSet(viewsets.ModelViewSet):
    queryset = Court.objects.all()
    serializer_class = CourtSerializer

class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
