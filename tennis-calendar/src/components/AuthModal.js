import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import axios from "axios";
import { useAuth } from "./AuthContext";

const AuthModal = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        phone: "",
    });
    const { isAuthModalOpen, closeAuthModal, login, authMode } = useAuth(); // Pobierz funkcje i stany z kontekstu
    const isLogin = authMode === "login"; // Tryb logowania/rejestracji zależny od authMode

    useEffect(() => {
        // Wyczyść dane formularza przy otwarciu modala
        setFormData({
            email: "",
            password: "",
            confirmPassword: "",
            firstName: "",
            lastName: "",
            phone: "",
        });
    }, [authMode, isAuthModalOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isLogin) {
            // Logowanie
            axios
                .post("http://127.0.0.1:8000/api/token/", {
                    email: formData.email,
                    password: formData.password,
                })
                .then((response) => {
                    localStorage.setItem("access_token", response.data.access);
                    localStorage.setItem("refresh_token", response.data.refresh);
                    login(); // Zaktualizuj stan logowania w kontekście
                    alert("Zalogowano pomyślnie!");
                    closeAuthModal(); // Zamknij modal
                })
                .catch((error) => {
                    console.error("Błąd logowania:", error);
                    alert("Błędne dane logowania!");
                });
        } else {
            // Rejestracja
            if (formData.password !== formData.confirmPassword) {
                alert("Hasła muszą być takie same!");
                return;
            }
            axios
                .post("http://127.0.0.1:8000/api/register/", {
                    email: formData.email,
                    password: formData.password,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    phone: formData.phone,
                })
                .then(() => {
                    alert("Rejestracja pomyślna! Możesz się teraz zalogować.");
                    closeAuthModal(); // Zamknij modal
                })
                .catch((error) => {
                    console.error("Błąd rejestracji:", error);
                    alert("Wystąpił błąd podczas rejestracji.");
                });
        }
    };

    return (
        <Modal
            isOpen={isAuthModalOpen} // Związane z kontekstem
            onRequestClose={closeAuthModal}
            ariaHideApp={false}
        >
            <h2>{isLogin ? "Logowanie" : "Rejestracja"}</h2>
            <form onSubmit={handleSubmit}>
                {!isLogin && (
                    <>
                        <label>
                            Imię:
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                required
                            />
                        </label><br/>
                        <label>
                            Nazwisko:
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                required
                            />
                        </label><br/>
                        <label>
                            Telefon:
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                pattern="^(\+48)?\d{9}$" // Wzorzec dla polskich numerów
                                title="Numer telefonu musi być w formacie: '123456789' lub '+48123456789'"
                                required
                            />
                        </label><br/>
                    </>
                )}
                <label>
                    Email:
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                    />
                </label><br/>
                <label>
                    Hasło:
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                    />
                </label><br/>
                {!isLogin && (
                    <>
                        <label>
                            Potwierdź hasło:
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                required
                            />
                        </label><br/>
                        <label>
                            <input
                                type="checkbox"
                                name="agreement"
                                checked={formData.agreement}
                                onChange={handleInputChange}
                                required
                            />
                            Akceptuję regulamin oraz zgodę na RODO
                        </label>
                    </>
                )}
                <br/><button type="submit">{isLogin ? "Zaloguj się" : "Zarejestruj się"}</button>
            </form>
            <button onClick={closeAuthModal}>Anuluj</button>
        </Modal>
    );
};

export default AuthModal;
