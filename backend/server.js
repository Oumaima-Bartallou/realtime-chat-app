const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// إنشاء سيرفر HTTP بربطه مع Express
const server = http.createServer(app);

// إعداد Socket.io وتحديد السماح للـ Frontend بالاتصال
const io = new Server(server, {
  cors: {
    origin: "*", // يتيح الاتصال من أي واجهة (سنغيرها لاحقاً إذا لزم الأمر)
    methods: ["GET", "POST"]
  }
});

// الاستماع لاتصالات المستخدمين
io.on('connection', (socket) => {
  console.log(`مستخدم جديد اتصل: ${socket.id}`);

  // استقبال الرسائل وإعادتها للجميع
  socket.on('send_message', (data) => {
    io.emit('receive_message', data);
  });

  // عند انقطاع اتصال المستخدم
  socket.on('disconnect', () => {
    console.log(`انقطع اتصال المستخدم: ${socket.id}`);
  });
});

// تشغيل السيرفر على البورت 3001
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`server good :${PORT}`);
});