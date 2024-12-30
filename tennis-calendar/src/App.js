import React from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import Header from "./components/Header";
import UserPanel from "./components/UserPanel";
import Calendar from './components/Calendar';
import './App.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Header />
                <Routes>
                    <Route path="/" element={<Calendar />} />
                    <Route path="/user-panel" element={<UserPanel />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
