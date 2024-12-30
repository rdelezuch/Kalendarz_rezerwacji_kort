import React, { useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';

const AuthModal = ({ isOpen, onClose, style }) => {
    const [isLogin, setIsLogin] = useState(true); // Przełącznik między logowaniem a rejestracją
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isLogin) {
            // Logowanie
            axios.post("http://127.0.0.1:8000/api/token/", {
                email: formData.email,
                password: formData.password,
            })
            .then(response => {
                localStorage.setItem("access_token", response.data.access);
                localStorage.setItem("refresh_token", response.data.refresh);
                alert("Zalogowano pomyślnie!");
                onClose();
            })
            .catch(error => {
                console.error("Błąd logowania:", error);
                alert("Błędne dane logowania!");
            });
        } else {
            // Rejestracja
            if (formData.password !== formData.confirmPassword) {
                alert("Hasła muszą być takie same!");
                return;
            }
            axios.post("http://127.0.0.1:8000/api/register/", {
                email: formData.email,
                password: formData.password,
            })
            .then(response => {
                alert("Rejestracja pomyślna! Możesz się teraz zalogować.");
                setIsLogin(true); // Przełączenie na logowanie
            })
            .catch(error => {
                console.error("Błąd rejestracji:", error);
                alert("Wystąpił błąd podczas rejestracji.");
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onRequestClose={onClose} style={style} ariaHideApp={false}>
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
            <button onClick={onClose}>Anuluj</button>
        </Modal>
    );
};

export default AuthModal;
