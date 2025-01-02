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


    const { isAuthModalOpen, openAuthModal, isAuthenticated } = useAuth();

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

        // Domyślne kolorowanie przycisków FullCalendar
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
        setSelectedCourt(selected); // Ustaw nowy wybrany kort
        fetchEvents(selected); // Pobierz wydarzenia dla wybranego kortu
    
        // Zmiana stylu aktywnego przycisku
        const buttons = document.querySelectorAll('.fc-toolbar .fc-button');
        buttons.forEach((button) => {
            button.classList.remove('active-button');
        });
    
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
                    setAdminModalIsOpen(true); // Otwórz modal administratora
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
            {/* Rozwijana lista z wyborem kortu */}
            {/* <div style={{ marginBottom: "20px" }}>
                <label htmlFor="court-select">Wybierz kort:</label>
                <select
                    id="court-select"
                    value={selectedCourt}
                    onChange={handleCourtChange}
                    style={{ marginLeft: "10px", padding: "8px", borderRadius: "5px" }}
                >
                    <option value="all">Wszystkie korty</option>
                    {allCourts.map((court) => (
                        <option key={court.id} value={court.id}>
                            {court.name}
                        </option>
                    ))}
                </select>
            </div> */}

            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                locale="pl"
                timeZone="Europe/Warsaw"
                initialView="timeGridWeek"
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                slotLabelFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                }}
                slotDuration="01:00:00"
                slotLabelInterval="01:00"
                height="auto"
                aspectRatio={1.5}
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
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'allCourts,court1,court2,court3 dayGridMonth,timeGridWeek,timeGridDay',
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
                <form onSubmit={handleSubmit}>
                    <h3>Rezerwacja Terminu</h3>
                    <label>Data: {formData.date}</label><br />
                    <label>
                        Kort:
                        {selectedCourt === 'all'
                        ? (<select name="court" value={formData.court} onChange={handleInputChange} required>
                            <option value="">Wybierz kort</option>
                            {availableCourts.map(court => (
                                <option key={court.id} value={court.id}>{court.id}</option>
                            ))}
                        </select>)
                        : (<label> {selectedCourt}</label>)}
                    </label><br />
                    <label>
                        Godzina Startu: {formData.startTime}
                    </label><br />
                    <label>
                        Czas wynajmu:
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
                        >
                            <option value="">Wybierz czas trwania</option>
                            <option value="1">1 godzina</option>
                            <option value="2">2 godziny</option>
                            <option value="3">3 godziny</option>
                        </select>
                    </label><br />
                    <label>
                        Notatki (opcjonalne, max 150 znaków):
                        <br /><textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            maxLength="150"
                            placeholder="Dodaj notatki do rezerwacji..."
                        />
                    </label><br />
                    <button type="submit">Rezerwuj</button>
                    <button type="button" onClick={closeModal}>Anuluj</button>
                </form>
            </Modal>
            {/* Modal logowania */}
            <AuthModal />
            {/* Modal Administratora*/}
            <Modal isOpen={adminModalIsOpen} onRequestClose={() => setAdminModalIsOpen(false)} ariaHideApp={false}>
                <h3>Szczegóły Rezerwacji</h3>
                {selectedEvent && selectedEvent.length > 0 ? (
                    <ul>
                        {selectedEvent
                        .sort((a, b) => a.court_id - b.court_id)
                        .map((reservation) => (
                            <li key={reservation.id}>
                                <strong>Kort:</strong> {reservation.court_id} <br />
                                <strong>Godzina: </strong>
                                {new Date(new Date(reservation.start_time).getTime() + 60 * 60 * 1000)
                                    .toISOString()
                                    .split("T")[1]
                                    .slice(0, 5)} 
                                - 
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
                                    style={{
                                        padding: "5px 10px",
                                        backgroundColor: "#dc3545",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "5px",
                                        marginTop: "10px",
                                    }}
                                >
                                    Usuń rezerwację
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Brak rezerwacji.</p>
                )}
                <button
                    onClick={() => {
                        setAdminModalIsOpen(false);
                        setModalIsOpen(true);
                    }}
                    style={{ padding: "10px", backgroundColor: "#007bff", color: "#fff" }}
                >
                    Dodaj nową rezerwację
                </button>
            </Modal>
        </>
    );
};

export default Calendar;