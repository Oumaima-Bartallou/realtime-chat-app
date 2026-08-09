const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes'); // 1️⃣ استيراد مسار الرسائل
const { socketAuth } = require('./middleware/socketAuth');
const Message = require('./models/Message'); // 2️⃣ استيراد نموذج الرسالة

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes); // 3️⃣ تفعيل نقطة نهاية سجل الرسائل

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
  },
});

io.use(socketAuth);

io.on('connection', (socket) => {
  console.log(`⚡ User authenticated & connected: ${socket.user.username} (${socket.id})`);

  // استقبال وإعادة توجيه الرسالة مع حفظها في قاعدة البيانات
  socket.on('send_message', async (data) => {
    try {
      const messageText = data.message || data.text;
      if (!messageText || !messageText.trim()) return;

      // حفظ الرسالة في قاعدة البيانات
      const newMessage = await Message.create({
        sender: socket.user._id,
        senderUsername: socket.user.username,
        text: messageText,
      });

      // بث الرسالة لجميع العُملاء المتصلين
      io.emit('receive_message', {
        _id: newMessage._id,
        senderUsername: newMessage.senderUsername,
        text: newMessage.text,
        createdAt: newMessage.createdAt,
      });
    } catch (error) {
      console.error('❌ Error saving message:', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.user.username}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Professional Server running on port: ${PORT}`);
});