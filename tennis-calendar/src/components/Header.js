import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
    return (
        <nav style={{ display: "flex", justifyContent: "space-between", padding: "10px", backgroundColor: "#f0f0f0" }}>
            <h1>Rezerwacja Kortów</h1>
            <div>
                {/* Link do strony głównej */}
                <Link to="/">
                    <button style={{ margin: "0 10px", padding: "8px 12px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px" }}>
                        Strona Główna
                    </button>
                </Link>
                {/* Link do panelu użytkownika */}
                <Link to="/user-panel">
                    <button style={{ margin: "0 10px", padding: "8px 12px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px" }}>
                        Panel Użytkownika
                    </button>
                </Link>
            </div>
        </nav>
    );
};

export default Header;
