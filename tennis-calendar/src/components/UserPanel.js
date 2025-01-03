import React, { useEffect, useState } from "react";
import axios from "axios";
import "./UserPanel.css";

const UserPanel = () => {
  const [userData, setUserData] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [showFutureReservations, setShowFutureReservations] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [editingNote, setEditingNote] = useState(null);
  const [editedNote, setEditedNote] = useState("");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/user-data/", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      })
      .then((response) => {
        setUserData(response.data);
        setEditFormData({
          first_name: response.data.first_name,
          last_name: response.data.last_name,
          email: response.data.email,
          phone: response.data.phone,
        });
      })
      .catch((error) => console.error("Błąd pobierania danych użytkownika:", error));

    fetchReservations();
  }, []);

  const validateField = (name, value) => {
    let error = "";
    if (name === "first_name" || name === "last_name") {
      const namePattern = /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż\s-]+$/;
      if (!namePattern.test(value) && value !== "") {
        error = "Pole może zawierać tylko litery, spacje i myślniki.";
      }
    }
    if (name === "email") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value) && value !== "") {
        error = "Podaj poprawny adres e-mail.";
      }
    }
    if (name === "phone") {
      const phonePattern = /^(\+48)?\d{9}$/;
      if (!phonePattern.test(value) && value !== "") {
        error = "Podaj poprawny numer telefonu w formacie '+48XXXXXXXXX' lub 'XXXXXXXXX'.";
      }
    }
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: validateField(name, value),
    }));
  };

  const handleSaveChanges = () => {
    const validationErrors = {};
    Object.keys(editFormData).forEach((key) => {
      validationErrors[key] = validateField(key, editFormData[key]);
    });
    setErrors(validationErrors);

    const hasErrors = Object.values(validationErrors).some((error) => error !== "");
    if (hasErrors) {
      alert("Popraw błędy w formularzu przed zapisaniem.");
      return;
    }

    axios
      .put("http://127.0.0.1:8000/api/update-user-data/", editFormData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      })
      .then((response) => {
        alert(response.data.message);
        setUserData(response.data.user);
        setIsEditing(false);
      })
      .catch((error) => {
        console.error("Błąd podczas aktualizacji danych:", error);
        alert("Wystąpił błąd podczas aktualizacji danych.");
      });
  };

  const fetchReservations = () => {
    axios
      .get("http://127.0.0.1:8000/api/user-reservations/", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      })
      .then((response) => {
        const sortedReservations = response.data.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.start_time}`);
          const dateB = new Date(`${b.date}T${b.start_time}`);
          return dateA - dateB;
        });
        setReservations(sortedReservations);
      })
      .catch((error) => console.error("Błąd pobierania rezerwacji:", error));
  };

  const handleDeleteReservation = (reservationId) => {
    if (window.confirm("Czy na pewno chcesz usunąć tę rezerwację?")) {
      axios
        .delete(`http://127.0.0.1:8000/api/delete-reservation/${reservationId}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        })
        .then((response) => {
          alert(response.data.message);
          fetchReservations();
        })
        .catch((error) => {
          console.error("Błąd podczas usuwania rezerwacji:", error);
          alert("Wystąpił błąd podczas usuwania rezerwacji.");
        });
    }
  };

  const saveNote = (reservationId) => {
    axios
      .patch(
        `http://127.0.0.1:8000/api/reservations/${reservationId}/`,
        { notes: editedNote },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        }
      )
      .then(() => {
        alert("Notatka zaktualizowana!");
        setEditingNote(null);
        fetchReservations();
      })
      .catch((error) => {
        console.error("Błąd podczas aktualizacji notatki:", error);
        alert("Nie udało się zaktualizować notatki.");
      });
  };

  const currentDateTime = new Date();

  const futureReservations = reservations.filter((reservation) => {
    const reservationStartTime = new Date(`${reservation.date}T${reservation.start_time}`);
    return reservationStartTime > currentDateTime;
  });

  const pastReservations = reservations.filter((reservation) => {
    const reservationStartTime = new Date(`${reservation.date}T${reservation.start_time}`);
    return reservationStartTime <= currentDateTime;
  });

  return (
    <div className="user-panel-container">
        <h2 className="user-panel-title">Panel Użytkownika</h2>
        <div className="user-panel-card">
            <div className="user-data-section">
                <h3>Dane Użytkownika</h3>
                {userData ? (
                    !isEditing ? (
                        <>
                            <p><strong>Imię:</strong> {userData.first_name}</p>
                            <p><strong>Nazwisko:</strong> {userData.last_name}</p>
                            <p><strong>Email:</strong> {userData.email}</p>
                            <p><strong>Telefon:</strong> {userData.phone}</p>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="user-panel-button edit"
                            >
                                Edytuj dane
                            </button>
                        </>
                    ) : (
                        <>
                            <label className="user-panel-label">
                                Imię:
                                <input
                                    type="text"
                                    name="first_name"
                                    value={editFormData.first_name}
                                    onChange={handleInputChange}
                                    className={`user-panel-input ${errors.first_name ? 'error' : ''}`}
                                    required
                                /><br/>
                                {errors.first_name && <span className="validation-error">{errors.first_name}</span>}
                            </label>
                            <label className="user-panel-label">
                                Nazwisko:
                                <input
                                    type="text"
                                    name="last_name"
                                    value={editFormData.last_name}
                                    onChange={handleInputChange}
                                    className={`user-panel-input ${errors.last_name ? 'error' : ''}`}
                                    required
                                /><br/>
                                {errors.last_name && <span className="validation-error">{errors.last_name}</span>}
                            </label>
                            <label className="user-panel-label">
                                Email:
                                <input
                                    type="email"
                                    name="email"
                                    value={editFormData.email}
                                    onChange={handleInputChange}
                                    className={`user-panel-input ${errors.email ? 'error' : ''}`}
                                    required
                                /><br/>
                                {errors.email && <span className="validation-error">{errors.email}</span>}
                            </label>
                            <label className="user-panel-label">
                                Telefon:
                                <input
                                    type="tel"
                                    name="phone"
                                    value={editFormData.phone}
                                    onChange={handleInputChange}
                                    className={`user-panel-input ${errors.phone ? 'error' : ''}`}
                                    required
                                /><br/>
                                {errors.phone && <span className="validation-error">{errors.phone}</span>}
                            </label>
                            <div className="button-group">
                              <button
                                  onClick={handleSaveChanges}
                                  className="user-panel-button save"
                              >
                                  Zapisz zmiany
                              </button>
                              <button
                                  onClick={() => {
                                      setEditFormData({
                                          first_name: userData.first_name,
                                          last_name: userData.last_name,
                                          email: userData.email,
                                          phone: userData.phone,
                                      });
                                      setErrors({});
                                      setIsEditing(false);
                                  }}
                                  className="user-panel-button cancel"
                              >
                                  Anuluj
                              </button>
                            </div>
                            
                        </>
                    )
                ) : (
                    <p>Ładowanie danych użytkownika...</p>
                )}
            </div>

            <div className="reservations-section">
                <h3>Twoje Rezerwacje</h3>
                <div className="reservations-toggle-buttons">
                    <button
                        onClick={() => setShowFutureReservations(true)}
                        className={`user-panel-button toggle ${showFutureReservations ? 'active' : ''}`}
                    >
                        Nadchodzące
                    </button>
                    <button
                        onClick={() => setShowFutureReservations(false)}
                        className={`user-panel-button toggle ${!showFutureReservations ? 'active' : ''}`}
                    >
                        Przeszłe
                    </button>
                </div>
                <ul className="reservations-list">
                    {showFutureReservations
                        ? futureReservations.length > 0
                            ? futureReservations.map((reservation) => (
                                <li key={reservation.id}>
                                    <strong>
                                        {new Date(reservation.date).toLocaleDateString("pl-PL")}{" "}
                                        {String(parseInt(reservation.start_time.slice(0, 2)) + 1).padStart(2, "0")}:
                                        {reservation.start_time.slice(3, 5)}-
                                        {String(parseInt(reservation.end_time.slice(0, 2)) + 1).padStart(2, "0")}:
                                        {reservation.end_time.slice(3, 5)}
                                    </strong>{" "}
                                    | {reservation.court_name}
                                    <div className="reservations-notes">
                                        <strong>Notatki:</strong>{" "}
                                        {editingNote === reservation.id ? (
                                            <>
                                                <textarea
                                                    value={editedNote}
                                                    onChange={(e) => setEditedNote(e.target.value)}
                                                    maxLength="150"
                                                />
                                                <div className="button-group">
                                                  <button
                                                      onClick={() => saveNote(reservation.id)}
                                                      className="user-panel-button save"
                                                  >
                                                      Zapisz
                                                  </button>
                                                  <button
                                                      onClick={() => setEditingNote(null)}
                                                      className="user-panel-button cancel"
                                                  >
                                                      Anuluj
                                                  </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {reservation.notes || "Brak notatek"}
                                                
                                            </>
                                        )}
                                    </div>
                                    <div className="button-group">
                                      <button
                                          onClick={() => handleDeleteReservation(reservation.id)}
                                          className="user-panel-button cancel"
                                      >
                                          Usuń Rezerwację
                                      </button>
                                      <button
                                          onClick={() => {
                                              setEditingNote(reservation.id);
                                              setEditedNote(reservation.notes || "");
                                          }}
                                          className="user-panel-button edit"
                                      >
                                          Edytuj notatkę
                                      </button>
                                    </div>
                                </li>
                            ))
                            : <p className="no-reservations">Brak nadchodzących rezerwacji.</p>
                        : pastReservations.length > 0
                            ? pastReservations.map((reservation) => (
                                <li key={reservation.id}>
                                    <strong>
                                        {new Date(reservation.date).toLocaleDateString("pl-PL")}{" "}
                                        {String(parseInt(reservation.start_time.slice(0, 2)) + 1).padStart(2, "0")}:
                                        {reservation.start_time.slice(3, 5)}-
                                        {String(parseInt(reservation.end_time.slice(0, 2)) + 1).padStart(2, "0")}:
                                        {reservation.end_time.slice(3, 5)}
                                    </strong>{" "}
                                    | {reservation.court_name}
                                </li>
                            ))
                            : <p className="no-reservations">Brak przeszłych rezerwacji.</p>
                    }
                </ul>
            </div>
        </div>
    </div>
  );
};

export default UserPanel;