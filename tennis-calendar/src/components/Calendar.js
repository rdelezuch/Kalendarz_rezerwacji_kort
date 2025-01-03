import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from "@fullcalendar/interaction";
import axios from 'axios';
import './Calendar.css';
import '../App.css';
import Modal from "react-modal";
import AuthModal from './AuthModal';
import { useAuth } from './AuthContext';

const Calendar = () => {
    const [events, setEvents] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        date: "",
        court: "",
        startTime: "",
        endTime: "",
        notes: "",
    });
    const [allCourts, setAllCourts] = useState([]);
    const [availableCourts, setAvailableCourts] = useState([]);
    const [selectedCourt, setSelectedCourt] = useState("all");
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isStaff, setIsStaff] = useState(false);
    const [adminModalIsOpen, setAdminModalIsOpen] = useState(false);
    const [calendarView] = useState(window.innerWidth <= 768 ? "timeGridDay" : "timeGridWeek");
    const [calendarViewRatio] = useState(window.innerWidth <= 768 ? "1" : "2.5");
    const [calendarViewButtonLeft] = useState(window.innerWidth <= 768 ? "" : "prev,today,next dayGridMonth,timeGridWeek,timeGridDay");
    const [calendarViewButtonRight] = useState(window.innerWidth <= 768 ? "allCourts,court1,court2,court3 prev,today,next" : "allCourts,court1,court2,court3");
    const { openAuthModal, isAuthenticated } = useAuth();

    // Funkcja do pobierania wydarzeń
    const fetchEvents = (selectedCourt) => {
        axios.get("http://127.0.0.1:8000/api/weekly_slots/", {
            params: selectedCourt !== "all" ? { court: selectedCourt } : {},
        })
        .then(response => {
            const formattedEvents = response.data.map(slot => ({
                title: slot.status === "full" 
                    ? (selectedCourt !== "all" ? "Kort zajęty" : "Wszystkie zajęte") 
                    : (selectedCourt !== "all" ? "Kort dostępny" : "Dostępne korty"),
                start: slot.start,
                end: slot.end,
                classNames: slot.status === "full" ? "event-occupied" : "event-available"
            }));
            setEvents(formattedEvents);
        })
        .catch(error => console.error("Błąd pobierania danych:", error));
    };

    // Pobieranie wydarzeń i sprawdzanie stanu logowania po załadowaniu komponentu
    useEffect(() => {
        fetchAllCourts();
        fetchEvents("all");

        // Domyślne ustawienie aktywnej klasy
        const buttons = document.querySelectorAll('.fc-toolbar .fc-button');
        const allCourtsButton = Array.from(buttons).find((button) => button.textContent === 'Wszystkie Korty');
        if (allCourtsButton) {
            allCourtsButton.classList.add('active-button');
        }

        // Kontrola uprawnień użytkownika
        axios
        .get("http://127.0.0.1:8000/api/user-data/", {
            headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        })
        .then((response) => {
            setIsStaff(response.data.is_staff);
        })
        .catch((error) => console.error("Błąd podczas pobierania danych użytkownika:", error));
    }, []);

    // Obsługa zmiany wybranego kortu
    const handleCourtChange = (selected) => {
        setSelectedCourt(selected);
        fetchEvents(selected);
    
        // Usunięcie klasy aktywnej z wszystkich przycisków
        const buttons = document.querySelectorAll('.fc-toolbar .fc-button');
        buttons.forEach((button) => {
            button.classList.remove('active-button');
        });

        // Dodanie klasy aktywnej do aktualnie wybranego przycisku
        const activeButton = Array.from(buttons).find((button) => 
            button.textContent === (selected === 'all' ? 'Wszystkie Korty' : allCourts.find(court => court.id === selected)?.name)
        );
        if (activeButton) {
            activeButton.classList.add('active-button');
        }
    };
    
    

    // Obsługa kliknięcia na istniejące wydarzenie
    const handleEventClick = (info) => {
    
        const startTime = info.event.startStr
        const endTime = info.event.endStr
    
        setFormData({
            date: startTime.split("T")[0],
            startTime: startTime.split("T")[1].slice(0, 5),
            endTime: endTime.split("T")[1].slice(0, 5),
            court: selectedCourt === "all" ? fetchAvailableCourts(startTime, endTime) : selectedCourt,
            notes: "",
        });
    
        if (isStaff) {
            axios
                .get("http://127.0.0.1:8000/api/court-reservation-details/", {
                    params: {
                        court_id: selectedCourt === "all" ? "all" : selectedCourt,
                        start_time: startTime,
                        end_time: endTime,
                    },
                })
                .then((response) => {
                    setSelectedEvent(response.data);
                    setAdminModalIsOpen(true);
                })
                .catch((error) => {
                    console.error("Błąd podczas pobierania szczegółów rezerwacji:", error);
                    alert("Nie udało się pobrać szczegółów rezerwacji.");
                });
        } else {
            // Obsługa zwykłego użytkownika
            if (!isAuthenticated) {
                openAuthModal();
                return;
            }
    
            if (info.event.title === "Kort zajęty" || info.event.title === "Wszystkie zajęte") {
                alert("Wybrany termin jest zajęty.");
            } else if (info.event.title === "Dostępne korty" || info.event.title === "Kort dostępny") {
                setModalIsOpen(true);
            }
        }
    };
    

    // Pobieranie listy wszystkich kortów
    const fetchAllCourts = () => {
        axios.get("http://127.0.0.1:8000/api/get-all-courts/")
            .then(response => {
                setAllCourts(response.data);
            })
            .catch(error => console.error("Błąd podczas pobierania wszystkich kortów:", error));
    };

    // Pobieranie dostępnych kortów dla przedziałów czasowych
    const fetchAvailableCourts = (startTime, endTime) => {
        axios.get("http://127.0.0.1:8000/api/get_available_courts/", {
            params: {
                start_time: startTime,
                end_time: endTime,
            },
        })
        .then(response => {
            setAvailableCourts(response.data.available_courts);
        })
        .catch(error => console.error("Błąd podczas pobierania dostępnych kortów:", error));
    };

    // Zamykanie modala rezerwacji
    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedEvent(null);
    };

    // Obsługa formularza rezerwacji
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleDeleteReservation = (reservationId) => {
        if (window.confirm("Czy na pewno chcesz usunąć tę rezerwację?")) {
            axios
                .delete(`http://127.0.0.1:8000/api/delete-reservation/${reservationId}/`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
                })
                .then((response) => {
                    alert("Rezerwacja została usunięta.");
                    setAdminModalIsOpen(false);
                    fetchEvents(selectedCourt);
                })
                .catch((error) => {
                    console.error("Błąd podczas usuwania rezerwacji:", error);
                    alert("Nie udało się usunąć rezerwacji.");
                });
        }
    };    

    const handleSubmit = (e) => {
        e.preventDefault();

        const formattedStartTime = new Date(`${formData.date}T${formData.startTime}`);
        const durationHours = parseInt(formData.duration);
        const formattedEndTime = new Date(formattedStartTime.getTime() + durationHours * 60 * 60 * 1000);

        const dataToSend = {
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            court: formData.court,
            notes: formData.notes,
        };

        axios
            .post("http://127.0.0.1:8000/api/check_availability/", {
                start_time: formattedStartTime,
                end_time: formattedEndTime,
                court: formData.court,
            })
            .then((response) => {
                if (response.data.available) {
                    axios
                        .post("http://127.0.0.1:8000/api/reservations/", dataToSend, {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                            },
                        })
                        .then(() => {
                            alert("Rezerwacja potwierdzona!");
                            const reservationDetails = `
                                Data: ${formData.date}
                                Godzina: ${formData.startTime} - ${formData.endTime}
                                Kort: ${formData.court}
                                Notatki: ${formData.notes || "Brak"}
                            `;
                            axios
                                .post("http://127.0.0.1:8000/api/send-reservation-email/", {
                                    email: localStorage.getItem("user_email"),
                                    reservation_details: reservationDetails,
                                })
                                .then(() => {
                                    alert("E-mail z potwierdzeniem został wysłany!");
                                })
                                .catch((error) => {
                                    console.error("Błąd podczas wysyłania e-maila:", error);
                                    alert("Wystąpił błąd podczas wysyłania potwierdzenia e-mail.");
                                });

                            setModalIsOpen(false);
                            fetchEvents(selectedCourt);
                        })
                        .catch((error) => {
                            console.error("Błąd podczas tworzenia rezerwacji:", error);
                            alert("Błąd podczas tworzenia rezerwacji.");
                        });
                } else {
                    alert("Termin już zajęty!");
                }
            })
            .catch((error) => {
                console.error("Błąd podczas sprawdzania dostępności:", error);
                alert("Błąd podczas sprawdzania dostępności.");
            });
    };

    return (
        <>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                locale="pl"
                timeZone="Europe/Warsaw"
                initialView={calendarView}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                slotLabelFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                }}
                slotDuration="01:00:00"
                slotLabelInterval="01:00"
                //slotEventOverlap={false}
                //height="auto"
                //contentHeight="auto"
                aspectRatio={calendarViewRatio}
                customButtons={{
                    allCourts: {
                      text: 'Wszystkie Korty',
                      click: () => handleCourtChange('all'),
                    },
                    court1: {
                      text: allCourts[0]?.name || 'Kort 1',
                      click: () => handleCourtChange(allCourts[0]?.id),
                    },
                    court2: {
                      text: allCourts[1]?.name || 'Kort 2',
                      click: () => handleCourtChange(allCourts[1]?.id),
                    },
                    court3: {
                        text: allCourts[2]?.name || 'Kort 3',
                        click: () => handleCourtChange(allCourts[2]?.id),
                      },
                }}
                titleFormat={ { year: 'numeric', month: 'long', day: 'numeric' } }
                headerToolbar={{
                left: calendarViewButtonLeft,
                center: 'title',
                right: calendarViewButtonRight,
                }}
                buttonText={{
                    today: 'Dziś',
                    month: 'Miesiąc',
                    week: 'Tydzień',
                    day: 'Dzień'
                }}
                firstDay={1}
                dayCellClassNames={(arg) => {
                    const today = new Date();
                    if (arg.date < today.setHours(0, 0, 0, 0)) {
                        return 'greyed-out-day';
                    }
                    return '';
                }}
                events={events}
                allDaySlot={false}
                selectable={true}
                expandRows={true}
                eventClick={handleEventClick}
                eventClassNames={(arg) => {
                    if (arg.event.title === "Kort zajęty" || arg.event.title === "Wszystkie zajęte") {
                        return ["event-occupied"];
                    } else if (arg.event.title === "Kort dostępny" || arg.event.title === "Dostępne korty") {
                        return ["event-available"];
                    }
                    return [];
                }}
            />

            {/* Modal dla rezerwacji */}
            <Modal isOpen={modalIsOpen} onRequestClose={closeModal} ariaHideApp={false}>
                <div className="reservation-modal-container">
                    <h3 className="reservation-modal-title">Rezerwacja Terminu</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="reservation-modal-field">
                            <label>Data:</label>
                            <span>{formData.date}</span>
                        </div>
                        <div className="reservation-modal-field">
                            <label>Kort:</label>
                            {selectedCourt === 'all' ? (
                                <select
                                    name="court"
                                    value={formData.court}
                                    onChange={handleInputChange}
                                    required
                                    className="reservation-select"
                                >
                                    <option value="">Wybierz kort</option>
                                    {availableCourts.map((court) => (
                                        <option key={court.id} value={court.id}>{court.id}</option>
                                    ))}
                                </select>
                            ) : (
                                <span>{selectedCourt}</span>
                            )}
                        </div>
                        <div className="reservation-modal-field">
                            <label>Godzina Startu:</label>
                            <span>{formData.startTime}</span>
                        </div>
                        <div className="reservation-modal-field">
                            <label>Czas wynajmu:</label>
                            <select
                                name="duration"
                                value={formData.duration}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        duration: e.target.value,
                                    })
                                }
                                required
                                className="reservation-select"
                            >
                                <option value="">Wybierz czas trwania</option>
                                <option value="1">1 godzina</option>
                                <option value="2">2 godziny</option>
                                <option value="3">3 godziny</option>
                            </select>
                        </div>
                        <div className="reservation-modal-field">
                            <label>Notatki (opcjonalne, max 150 znaków):</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                maxLength="150"
                                placeholder="Dodaj notatki do rezerwacji..."
                                className="reservation-textarea"
                            />
                        </div>
                        <div className="reservation-modal-actions">
                            <button type="submit" className="reservation-modal-button confirm">Rezerwuj</button>
                            <button type="button" onClick={closeModal} className="reservation-modal-button cancel">Anuluj</button>
                        </div>
                    </form>
                </div>
            </Modal>
            {/* Modal logowania */}
            <AuthModal />
            {/* Modal Administratora*/}
            <Modal isOpen={adminModalIsOpen} onRequestClose={() => setAdminModalIsOpen(false)} ariaHideApp={false}>
                <h3 className="reservation-details-title">Szczegóły Rezerwacji</h3>
                {selectedEvent && selectedEvent.length > 0 ? (
                    <ul>
                        {selectedEvent
                        .sort((a, b) => a.court_id - b.court_id)
                        .map((reservation, index) => (
                            <li key={reservation.id}>
                                <strong>Kort:</strong> {reservation.court_id} <br />
                                <strong>Godzina:</strong>
                                {new Date(new Date(reservation.start_time).getTime() + 60 * 60 * 1000)
                                    .toISOString()
                                    .split("T")[1]
                                    .slice(0, 5)}{" "}
                                -{" "}
                                {new Date(new Date(reservation.end_time).getTime() + 60 * 60 * 1000)
                                    .toISOString()
                                    .split("T")[1]
                                    .slice(0, 5)}
                                <br />
                                <strong>Użytkownik:</strong> {reservation.user_email || "Brak przypisanego użytkownika"} <br />
                                <strong>Telefon:</strong> {reservation.user_phone} <br />
                                <strong>Notatki:</strong> {reservation.notes || "Brak"} <br />
                                <button
                                    onClick={() => handleDeleteReservation(reservation.id)}
                                    className="delete-reservation-btn"
                                >
                                    Usuń rezerwację
                                </button>
                                {index < selectedEvent.length - 1 && <div className="reservation-divider"></div>}
                            </li>
                        ))}
                </ul>
                ) : (
                    <p>Brak rezerwacji.</p>
                )}
                <div className="new-reservation-button-container">
                    <button
                        onClick={() => {
                            setAdminModalIsOpen(false);
                            setModalIsOpen(true);
                        }}
                        className="add-reservation-admin-btn"
                    >
                        Dodaj nową rezerwację
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default Calendar;