import { useState } from 'react';

const Auth = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // حفظ التوكن ومعلومات اليوزر فـ localStorage
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userInfo', JSON.stringify({ _id: data._id, username: data.username }));

      onLoginSuccess(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '350px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div style={{ marginBottom: '10px' }}>
            <label>Username: </label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required style={{ width: '100%' }} />
          </div>
        )}
        <div style={{ marginBottom: '10px' }}>
          <label>Email: </label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password: </label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required style={{ width: '100%' }} />
        </div>

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}>
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>

      <p style={{ marginTop: '15px', cursor: 'pointer', color: '#007bff' }} onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
      </p>
    </div>
  );
};

export default Auth;