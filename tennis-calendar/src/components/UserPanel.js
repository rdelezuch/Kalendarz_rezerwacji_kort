import React, { useEffect, useState } from "react";
import axios from "axios";

const UserPanel = () => {
  const [userData, setUserData] = useState(null);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    // Pobierz dane użytkownika
    axios
      .get("http://127.0.0.1:8000/api/user-data/", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      })
      .then((response) => setUserData(response.data))
      .catch((error) => console.error("Błąd pobierania danych użytkownika:", error));

    // Pobierz rezerwacje użytkownika
    axios
      .get("http://127.0.0.1:8000/api/user-reservations/", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      })
      .then((response) => setReservations(response.data))
      .catch((error) => console.error("Błąd pobierania rezerwacji:", error));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Panel Użytkownika</h2>
      {userData ? (
        <div>
          <h3>Dane Użytkownika</h3>
          <p><strong>Email:</strong> {userData.email}</p>
          <p><strong>Imię:</strong> {userData.first_name}</p>
          <p><strong>Nazwisko:</strong> {userData.last_name}</p>
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
