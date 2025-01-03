import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./Header.css";

const Header = () => {
    const { isAuthenticated, logout, openAuthModal } = useAuth();
    const navigate = useNavigate();

    return (
        <nav>
            <h1>Rezerwacja Kortów XYZ</h1>
            <div>
                {isAuthenticated ? (
                    <>
                        <Link to="/">
                            <button>Strona Główna</button>
                        </Link>
                        <Link to="/user-panel">
                            <button>Panel Użytkownika</button>
                        </Link>
                        <button onClick={() => logout(navigate)}>
                            Wyloguj się
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={() => openAuthModal("login")}>
                            Zaloguj się
                        </button>
                        <button
                            type="button"
                            onClick={() => openAuthModal("register")}>
                            Zarejestruj się
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Header;
