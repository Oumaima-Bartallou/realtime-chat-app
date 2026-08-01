import { useState, useEffect } from 'react';
import io from 'socket.io-client';

// الربط مع السيرفر ديال الـ Backend (Port 3001)
const socket = io.connect('http://localhost:3001');

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const [isJoined, setIsJoined] = useState(false);

  // الاستماع للرسائل القادمة من السيرفر
  useEffect(() => {
    socket.on('receive_message', (data) => {
      setMessageList((list) => [...list, data]);
    });

    return () => socket.off('receive_message');
  }, []);

  // دالة إرسال الرسالة
  const sendMessage = async () => {
    if (message.trim() !== '') {
      const messageData = {
        author: username,
        message: message,
        time: new Date(Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      await socket.emit('send_message', messageData);
      setMessage('');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {!isJoined ? (
        // واجهة الدخول
        <div>
          <h3>مرحباً بك فـ الشات!</h3>
          <input
            type="text"
            placeholder="اكتب اسمك هنا..."
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={() => username && setIsJoined(true)}>دخول</button>
        </div>
      ) : (
        // واجهة المحادثة
        <div>
          <h2>غرفة المحادثة (أهلاً {username})</h2>
          
          <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'scroll', padding: '10px', marginBottom: '10px' }}>
            {messageList.map((msg, index) => (
              <div key={index} style={{ marginBottom: '10px' }}>
                <strong>{msg.author}</strong> <small>({msg.time})</small>: {msg.message}
              </div>
            ))}
          </div>

          <input
            type="text"
            value={message}
            placeholder="اكتب رسالتك..."
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage}>إرسال</button>
        </div>
      )}
    </div>
  );
}

export default App;
