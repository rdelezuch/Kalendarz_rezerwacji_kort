import React, { useState } from "react";
import Modal from "react-modal";
import axios from "axios";
import { useAuth } from "./AuthContext"; // Importuj kontekst

const AuthModal = () => {
    const [isLogin, setIsLogin] = useState(true); // Przełącznik logowanie/rejestracja
    const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
    const { isAuthModalOpen, closeAuthModal, login } = useAuth(); // Pobierz funkcje i stany z kontekstu

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
                })
                .then(() => {
                    alert("Rejestracja pomyślna! Możesz się teraz zalogować.");
                    setIsLogin(true); // Przełącz na logowanie
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
                <label>
                    Email:
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                    />
                </label>
                <label>
                    Hasło:
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                    />
                </label>
                {!isLogin && (
                    <label>
                        Potwierdź hasło:
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                        />
                    </label>
                )}
                <button type="submit">{isLogin ? "Zaloguj się" : "Zarejestruj się"}</button>
            </form>
            <button onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Nie masz konta? Zarejestruj się" : "Masz już konto? Zaloguj się"}
            </button>
            <button onClick={closeAuthModal}>Anuluj</button>
        </Modal>
    );
};

export default AuthModal;
