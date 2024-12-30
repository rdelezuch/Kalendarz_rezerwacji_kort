import axios from 'axios';
import { useState } from 'react';

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/accounts/register/', formData);
      alert(response.data.message);
    } catch (error) {
      alert('Rejestracja nie powiodła się.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="first_name" onChange={handleChange} placeholder="Imię" />
      <input name="last_name" onChange={handleChange} placeholder="Nazwisko" />
      <input name="email" onChange={handleChange} placeholder="Email" />
      <input name="password" type="password" onChange={handleChange} placeholder="Hasło" />
      <button type="submit">Zarejestruj</button>
    </form>
  );
};

export default Register;