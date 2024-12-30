import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from "@fullcalendar/interaction";
import axios from 'axios';
import './Calendar.css';
import Modal from "react-modal";
import AuthModal from './AuthModal';

// Styl modala
const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      zIndex: 1050,
      position: "fixed",
      background: "#fff",
      border: "1px solid #ccc",
      borderRadius: "8px",
      padding: "20px",
    },
    overlay: {
      zIndex: 1040,
      backgroundColor: "rgba(0, 0, 0, 0.5)", // Przyciemnia tło
    }
};
  
const Calendar = () => {
    const [events, setEvents] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        date: "",
        court: "",
        startTime: "",
        endTime: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        agreement: false,
    });
    const [availableCourts, setAvailableCourts] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [authModalIsOpen, setAuthModalIsOpen] = useState(false);

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

    const [user, setUser] = useState(null); // Przechowuje dane zalogowanego użytkownika
    const [loginModalOpen, setLoginModalOpen] = useState(false); // Kontrola modala logowania

    // Funkcja do sprawdzania, czy użytkownik jest zalogowany
    const checkUserLoggedIn = () => {
        axios.get('http://127.0.0.1:8000/api/auth/user/')
            .then(response => {
                setUser(response.data); // Ustaw dane użytkownika, jeśli jest zalogowany
            })
            .catch(() => {
                setUser(null); // Brak zalogowanego użytkownika
            });
    };

    // Pobieranie wydarzeń po załadowaniu komponentu
    useEffect(() => {
        fetchEvents();
        //checkUserLoggedIn();
    }, []);

    // Obsługa kliknięcia na istniejące wydarzenie
    const handleEventClick = (info) => {
        if (!localStorage.getItem("access_token")) {
            setAuthModalIsOpen(true);
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
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                agreement: false,
            });
    
            setSelectedEvent(null);
            setModalIsOpen(true);
        }
    };    

    // Pobieranie dostepnych kortów
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

    // Zamykanie modala
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
    
        // Dane do wysłania
        const dataToSend = {
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            court: formData.court,
            first_name: formData.firstName,
            last_name: formData.lastName,
            user_email: formData.email,
            phone: formData.phone,
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
                    // Wysłanie rezerwacji
                    axios
                        .post("http://127.0.0.1:8000/api/reservations/", dataToSend, {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem("access_token")}`, // Dodanie tokena użytkownika
                            },
                        })
                        .then(() => {
                            alert("Rezerwacja potwierdzona!");
                            setModalIsOpen(false);
                            fetchEvents(); // Odśwież wydarzenia
                        })
                        .catch((error) =>
                            console.error("Błąd podczas tworzenia rezerwacji:", error)
                        );
                } else {
                    alert("Termin już zajęty!");
                }
            })
            .catch((error) =>
                console.error("Błąd podczas sprawdzania dostępności:", error)
            );
    };    
    
    const handleLogin = (e) => {
        e.preventDefault();
    
        const loginData = {
            email: formData.email,
            password: formData.password,
        };
    
        axios.post('http://127.0.0.1:8000/api/auth/login/', loginData)
            .then(response => {
                setUser(response.data); // Ustaw dane użytkownika
                setLoginModalOpen(false); // Zamknij modal logowania
            })
            .catch(() => alert("Błędne dane logowania."));
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

            {/* Formularz modala */}
            <Modal isOpen={modalIsOpen} onRequestClose={closeModal} style={customStyles} ariaHideApp={false}>
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
                            <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} required />
                        </label><br />
                        <label>
                            Godzina Końca:
                            <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} required />
                        </label><br />
                        <h3>Dane Klienta</h3>
                        <label>Imię: <input type="text" name="firstName" onChange={handleInputChange} required /></label><br />
                        <label>Nazwisko: <input type="text" name="lastName" onChange={handleInputChange} required /></label><br />
                        <label>Email: <input type="email" name="email" onChange={handleInputChange} required /></label><br />
                        <label>Telefon: <input type="tel" name="phone" onChange={handleInputChange} required /></label><br />
                        <label>
                            <input type="checkbox" name="agreement" checked={formData.agreement} onChange={handleInputChange} required />
                            Akceptuję regulamin i RODO
                        </label><br />
                        <button type="submit">Rezerwuj</button>
                        <button type="button" onClick={closeModal}>Anuluj</button>
                    </form>
                )}
            </Modal>
            {/* Modal logowania */}
            <Modal isOpen={loginModalOpen} onRequestClose={() => setLoginModalOpen(false)} style={customStyles} ariaHideApp={false}>
                <h3>Zaloguj się</h3>
                <form onSubmit={handleLogin}>
                    <label>Email: <input type="email" name="email" onChange={handleInputChange} required /></label><br />
                    <label>Hasło: <input type="password" name="password" onChange={handleInputChange} required /></label><br />
                    <button type="submit">Zaloguj</button>
                    <button type="button" onClick={() => setLoginModalOpen(false)}>Anuluj</button>
                </form>
            </Modal>
            <AuthModal
                isOpen={authModalIsOpen}
                onClose={() => setAuthModalIsOpen(false)}
                style={customStyles}
            />
        </>
    );
};

export default Calendar;
