import axios from 'axios';
import { useState } from 'react';

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/accounts/login/', credentials);
      alert(response.data.message);
      localStorage.setItem('user_id', response.data.user_id);
    } catch (error) {
      alert('Logowanie nie powiodło się.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" onChange={handleChange} placeholder="Email" />
      <input name="password" type="password" onChange={handleChange} placeholder="Hasło" />
      <button type="submit">Zaloguj</button>
    </form>
  );
};

export default Login;