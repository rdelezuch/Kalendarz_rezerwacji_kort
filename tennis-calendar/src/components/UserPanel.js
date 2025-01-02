import React, { useEffect, useState } from "react";
import axios from "axios";

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

  // Funkcja walidacji
  const validateField = (name, value) => {
    let error = "";
    if (name === "first_name" || name === "last_name") {
      const namePattern = /^[A-Za-zÀ-ÿ\s-]+$/;
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
    <div style={{ padding: "20px" }}>
      <h2>Panel Użytkownika</h2>
      {userData ? (
        <div>
          <h3>Dane Użytkownika</h3>
          {!isEditing ? (
            <>
              <p><strong>Imię:</strong> {userData.first_name}</p>
              <p><strong>Nazwisko:</strong> {userData.last_name}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Telefon:</strong> {userData.phone}</p>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                }}
              >
                Edytuj dane
              </button>
            </>
          ) : (
            <>
              <label>
                Imię:
                <input
                  type="text"
                  name="first_name"
                  value={editFormData.first_name}
                  onChange={handleInputChange}
                  style={{ margin: "5px 0", display: "block" }}
                  required
                />
                {errors.first_name && <span style={{ color: "red" }}>{errors.first_name}</span>}
              </label><br/>
              <label>
                Nazwisko:
                <input
                  type="text"
                  name="last_name"
                  value={editFormData.last_name}
                  onChange={handleInputChange}
                  style={{ margin: "5px 0", display: "block" }}
                  required
                />
                {errors.last_name && <span style={{ color: "red" }}>{errors.last_name}</span>}
              </label><br/>
              <label>
                Email:
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleInputChange}
                  style={{ margin: "5px 0", display: "block" }}
                  required
                />
                {errors.email && <span style={{ color: "red" }}>{errors.email}</span>}
              </label><br/>
              <label>
                Telefon:
                <input
                  type="tel"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleInputChange}
                  required
                  style={{ margin: "5px 0", display: "block" }}
                />
                {errors.phone && <span style={{ color: "red" }}>{errors.phone}</span>}
              </label><br/>
              <button
                onClick={handleSaveChanges}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  marginRight: "10px",
                }}
              >
                Zapisz zmiany
              </button>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#dc3545",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                }}
              >
                Anuluj
              </button>
            </>
          )}
        </div>
      ) : (
        <p>Ładowanie danych użytkownika...</p>
      )}
      <h3>Twoje Rezerwacje</h3>
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setShowFutureReservations(true)}
          style={{
            marginRight: "10px",
            padding: "8px 12px",
            backgroundColor: showFutureReservations ? "#007bff" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
          }}
        >
          Nadchodzące
        </button>
        <button
          onClick={() => setShowFutureReservations(false)}
          style={{
            padding: "8px 12px",
            backgroundColor: !showFutureReservations ? "#007bff" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
          }}
        >
          Przeszłe
        </button>
      </div>
      {showFutureReservations ? (
        <ul>
          {futureReservations.length > 0 ? (
            futureReservations.map((reservation) => (
              <li key={reservation.id}>
                <strong>
                  {new Date(reservation.date).toLocaleDateString("pl-PL")}{" "}
                  {String(parseInt(reservation.start_time.slice(0, 2)) + 1).padStart(2, "0")}:
                  {reservation.start_time.slice(3, 5)}-
                  {String(parseInt(reservation.end_time.slice(0, 2)) + 1).padStart(2, "0")}:
                  {reservation.end_time.slice(3, 5)}
                </strong>{" "}
                | Kort: {reservation.court_name}
                <div>
                  <strong>Notatki:</strong>{" "}
                  {editingNote === reservation.id ? (
                    <>
                      <textarea
                        value={editedNote}
                        onChange={(e) => setEditedNote(e.target.value)}
                        maxLength="150"
                        style={{ width: "100%", height: "50px" }}
                      />
                      <button
                        onClick={() => saveNote(reservation.id)}
                        style={{
                          margin: "5px",
                          padding: "8px 12px",
                          backgroundColor: "#28a745",
                          color: "#fff",
                          border: "none",
                          borderRadius: "5px",
                        }}
                      >
                        Zapisz
                      </button>
                      <button
                        onClick={() => setEditingNote(null)}
                        style={{
                          margin: "5px",
                          padding: "8px 12px",
                          backgroundColor: "#dc3545",
                          color: "#fff",
                          border: "none",
                          borderRadius: "5px",
                        }}
                      >
                        Anuluj
                      </button>
                    </>
                  ) : (
                    <>
                      {reservation.notes || "Brak notatek"}
                      <button
                        onClick={() => {
                          setEditingNote(reservation.id);
                          setEditedNote(reservation.notes || "");
                        }}
                        style={{
                          marginLeft: "10px",
                          padding: "5px 10px",
                          backgroundColor: "#007bff",
                          color: "#fff",
                          border: "none",
                          borderRadius: "5px",
                        }}
                      >
                        Edytuj
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteReservation(reservation.id)}
                  style={{
                    marginTop: "5px",
                    padding: "5px 10px",
                    backgroundColor: "#dc3545",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                  }}
                >
                  Usuń
                </button>
              </li>
            ))
          ) : (
            <p>Brak nadchodzących rezerwacji.</p>
          )}
        </ul>
      ) : (
        <ul>
          {pastReservations.length > 0 ? (
            pastReservations.map((reservation) => (
              <li key={reservation.id}>
                <strong>
                  {new Date(reservation.date).toLocaleDateString("pl-PL")}{" "}
                  {String(parseInt(reservation.start_time.slice(0, 2)) + 1).padStart(2, "0")}:
                  {reservation.start_time.slice(3, 5)}-
                  {String(parseInt(reservation.end_time.slice(0, 2)) + 1).padStart(2, "0")}:
                  {reservation.end_time.slice(3, 5)}
                </strong>{" "}
                | Kort: {reservation.court_name}
              </li>
            ))
          ) : (
            <p>Brak przeszłych rezerwacji.</p>
          )}
        </ul>
      )}
    </div>
  );
};

export default UserPanel;
