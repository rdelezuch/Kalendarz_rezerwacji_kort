import React from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import UserPanel from "./components/UserPanel";
import Calendar from './components/Calendar';
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <Header />
                <Routes>
                    <Route path="/" element={<Calendar />} />
                    <Route path="/user-panel" element={<UserPanel />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
