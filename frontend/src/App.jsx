import { useState, useEffect } from 'react';
import io from 'socket.io-client';

function App() {
  const [token, setToken] = useState(localStorage.getItem('userToken') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('userInfo')) || null);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState([]);

  // تسجيل الدخول / إنشاء حساب
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Authentication failed');

      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userInfo', JSON.stringify({ _id: data._id, username: data.username }));

      setToken(data.token);
      setUser({ _id: data._id, username: data.username });
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // جلب أرشيف الرسائل من REST API
  const fetchMessageHistory = async (authToken) => {
    try {
      const res = await fetch('http://localhost:5000/api/messages', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessageList(data);
      }
    } catch (err) {
      console.error('Error fetching message history:', err);
    }
  };

  // إدارة اتصال Socket واسترجاع الأرشيف
  useEffect(() => {
    if (!token) return;

    fetchMessageHistory(token);

    const newSocket = io('http://localhost:5000', {
      auth: { token },
    });

    newSocket.on('receive_message', (data) => {
      setMessageList((prevList) => [...prevList, data]);
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [token]);

  // إرسال رسالة جديدة
  const sendMessage = () => {
    if (message.trim() !== '' && socket) {
      socket.emit('send_message', { text: message });
      setMessage('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userInfo');
    setToken('');
    setUser(null);
    if (socket) socket.disconnect();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: 'auto' }}>
      {!token || !user ? (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <h3>{isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</h3>
          {authError && <p style={{ color: 'red' }}>{authError}</p>}

          <form onSubmit={handleAuthSubmit}>
            {!isLogin && (
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="اسم المستخدم"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
            )}
            <div style={{ marginBottom: '10px' }}>
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="password"
                placeholder="كلمة المرور"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <button type="submit" style={{ width: '100%', padding: '10px', cursor: 'pointer' }}>
              {isLogin ? 'دخول' : 'إنشاء حساب'}
            </button>
          </form>

          <p
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: '#007bff', cursor: 'pointer', marginTop: '10px', fontSize: '14px' }}
          >
            {isLogin ? 'ليس لديك حساب؟ أنشئ حساباً جديداً' : 'لديك حساب بالفعل؟ سجل الدخول'}
          </p>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>غرفة المحادثة العامة (المستخدم: {user.username})</h3>
            <button onClick={handleLogout} style={{ padding: '5px 10px', cursor: 'pointer' }}>تسجيل الخروج</button>
          </div>

          <div style={{ border: '1px solid #ccc', height: '350px', overflowY: 'scroll', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
            {messageList.map((msg, index) => (
              <div key={msg._id || index} style={{ marginBottom: '10px' }}>
                <strong>{msg.senderUsername || msg.sender}</strong>: {msg.text || msg.message}
                <br />
                <small style={{ color: '#888', fontSize: '10px' }}>
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                </small>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '5px' }}>
            <input
              type="text"
              value={message}
              placeholder="اكتب رسالتك هنا..."
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              style={{ flex: 1, padding: '8px' }}
            />
            <button onClick={sendMessage} style={{ padding: '8px 15px', cursor: 'pointer' }}>إرسال</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
