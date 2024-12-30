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
import { useAuth } from './AuthContext'; // Import kontekstu autoryzacji

const Calendar = () => {
    const [events, setEvents] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        date: "",
        court: "",
        startTime: "",
        endTime: "",
    });
    const [availableCourts, setAvailableCourts] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const { isAuthModalOpen, openAuthModal, isAuthenticated } = useAuth(); // Pobierz metody i stany z kontekstu

    // Funkcja do pobierania wydarzeń
    const fetchEvents = () => {
        axios.get('http://127.0.0.1:8000/api/weekly_slots/')
            .then(response => {
                const formattedEvents = response.data.map(slot => ({
                    title: slot.status === "full" ? "Wszystkie zajęte" : "Dostępne korty",
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
        fetchEvents();
    }, []);

    // Obsługa kliknięcia na istniejące wydarzenie
    const handleEventClick = (info) => {
        if (!isAuthenticated) {
            openAuthModal(); // Otwórz modal logowania z kontekstu
            return;
        }

        if (info.event.title === "Wszystkie zajęte") {
            setSelectedEvent({
                title: info.event.title,
                start: info.event.startStr,
                end: info.event.endStr,
            });
            setModalIsOpen(true);
        } else if (info.event.title === "Dostępne korty") {
            const startTime = info.event.startStr;
            const endTime = info.event.endStr;

            fetchAvailableCourts(startTime, endTime);

            setFormData({
                date: info.event.startStr.split("T")[0],
                startTime: info.event.startStr.split("T")[1].slice(0, 5),
                endTime: info.event.endStr.split("T")[1].slice(0, 5),
                court: "",
            });

            setSelectedEvent(null);
            setModalIsOpen(true);
        }
    };

    // Pobieranie dostępnych kortów
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
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formattedStartTime = new Date(`${formData.date}T${formData.startTime}`);
        const formattedEndTime = new Date(`${formData.date}T${formData.endTime}`);

        const dataToSend = {
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            court: formData.court,
        };

        console.log("Wysyłane dane:", dataToSend);

        // Sprawdzenie dostępności terminu
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
                            setModalIsOpen(false);
                            fetchEvents();
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
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
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
                    return arg.event.title === "Wszystkie zajęte"
                        ? ['event-occupied']
                        : ['event-available'];
                }}
            />

            {/* Modal dla rezerwacji */}
            <Modal isOpen={modalIsOpen} onRequestClose={closeModal} ariaHideApp={false}>
                {selectedEvent ? (
                    <div>
                        <h2>Szczegóły Rezerwacji</h2>
                        <p><strong>Tytuł:</strong> {selectedEvent.title}</p>
                        <p><strong>Początek:</strong> {selectedEvent.start}</p>
                        <p><strong>Koniec:</strong> {selectedEvent.end}</p>
                        <button onClick={closeModal}>Zamknij</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <h3>Rezerwacja Terminu</h3>
                        <label>Data: {formData.date}</label><br />
                        <label>
                            Kort:
                            <select name="court" value={formData.court} onChange={handleInputChange} required>
                                <option value="">Wybierz kort</option>
                                {availableCourts.map(court => (
                                    <option key={court.id} value={court.id}>{court.name}</option>
                                ))}
                            </select>
                        </label><br />
                        <label>
                            Godzina Startu:
                            <input
                                type="time"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleInputChange}
                                required
                            />
                        </label><br />
                        <label>
                            Godzina Końca:
                            <input
                                type="time"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleInputChange}
                                required
                            />
                        </label><br />
                        <button type="submit">Rezerwuj</button>
                        <button type="button" onClick={closeModal}>Anuluj</button>
                    </form>
                )}
            </Modal>
            {/* Modal logowania */}
            <AuthModal />
        </>
    );
};

export default Calendar;