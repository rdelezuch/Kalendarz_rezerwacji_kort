import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext"; // Importuj kontekst

const Header = () => {
    const { isAuthenticated, logout, openAuthModal, setAuthMode } = useAuth(); // Użyj kontekstu

    return (
        <nav style={{ display: "flex", justifyContent: "space-between", padding: "10px", backgroundColor: "#f0f0f0" }}>
            <h1>Rezerwacja Kortów XYZ</h1>
            <div>
                {isAuthenticated ? (
                    <>
                        <Link to="/">
                            <button
                                style={{
                                    margin: "0 10px",
                                    padding: "8px 12px",
                                    backgroundColor: "#007bff",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "5px",
                                }}
                            >
                                Strona Główna
                            </button>
                        </Link>
                        <Link to="/user-panel">
                            <button
                                style={{
                                    margin: "0 10px",
                                    padding: "8px 12px",
                                    backgroundColor: "#007bff",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "5px",
                                }}
                            >
                                Panel Użytkownika
                            </button>
                        </Link>
                        <button
                            onClick={logout}
                            style={{
                                margin: "0 10px",
                                padding: "8px 12px",
                                backgroundColor: "#dc3545",
                                color: "#fff",
                                border: "none",
                                borderRadius: "5px",
                            }}
                        >
                            Wyloguj się
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => openAuthModal("login")}
                            style={{
                                margin: "0 10px",
                                padding: "8px 12px",
                                backgroundColor: "#28a745",
                                color: "#fff",
                                border: "none",
                                borderRadius: "5px",
                            }}
                        >
                            Zaloguj się
                        </button>
                        <button
                            onClick={() => openAuthModal("register")}
                            style={{
                                margin: "0 10px",
                                padding: "8px 12px",
                                backgroundColor: "#17a2b8",
                                color: "#fff",
                                border: "none",
                                borderRadius: "5px",
                            }}
                        >
                            Zarejestruj się
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Header;
