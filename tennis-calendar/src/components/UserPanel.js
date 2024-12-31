import React, { useEffect, useState } from "react";
import axios from "axios";

const UserPanel = () => {
  const [userData, setUserData] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [editingNote, setEditingNote] = useState(null); // Rezerwacja do edycji notatki
  const [editedNote, setEditedNote] = useState(""); // Przechowuje treść notatki

  useEffect(() => {
    // Pobierz dane użytkownika
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

    // Pobierz rezerwacje użytkownika
    fetchReservations();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSaveChanges = () => {
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
      .then((response) => setReservations(response.data))
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
        setEditingNote(null); // Zakończ edycję
        fetchReservations(); // Odśwież dane
      })
      .catch((error) => {
        console.error("Błąd podczas aktualizacji notatki:", error);
        alert("Nie udało się zaktualizować notatki.");
      });
  };

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
              </label>
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
              </label>
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
              </label>
              <label>
                Telefon:
                <input
                  type="tel"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleInputChange}
                  pattern="^(\+48)?\d{9}$"
                  title="Numer telefonu musi być w formacie: '+48123456789' lub '123456789'."
                  required
                  style={{ margin: "5px 0", display: "block" }}
                />
              </label>
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
      {reservations.length > 0 ? (
        <ul>
          {reservations.map((reservation) => (
            <li key={reservation.id}>
              <strong>{reservation.date} {reservation.start_time}-{reservation.end_time}</strong> | Kort: {reservation.court_name}
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
                    {reservation.notes}
                    <button
                      onClick={() => {
                        setEditingNote(reservation.id);
                        setEditedNote(reservation.notes);
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
          ))}
        </ul>
      ) : (
        <p>Brak rezerwacji.</p>
      )}
    </div>
  );
};

export default UserPanel;
