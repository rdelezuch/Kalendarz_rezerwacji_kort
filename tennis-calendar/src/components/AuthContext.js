import React, { createContext, useState, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("access_token"));
    const [isAuthModalOpen, setAuthModalOpen] = useState(false);

    const login = () => {
        setIsAuthenticated(true);
        setAuthModalOpen(false); // Zamknięcie modala po zalogowaniu
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setIsAuthenticated(false);
    };

    const openAuthModal = () => setAuthModalOpen(true);
    const closeAuthModal = () => setAuthModalOpen(false);

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                login,
                logout,
                isAuthModalOpen,
                openAuthModal,
                closeAuthModal,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};