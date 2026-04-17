const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Message = require('./models/Message');
const ws = require('ws');
const fs = require('fs');

dotenv.config();

// ---------------- DB ----------------
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// ---------------- CONFIG ----------------
const jwtSecret = process.env.JWT_SECRET || "secret123";
const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();

app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(express.json());
app.use(cookieParser());

// ---------------- CORS ----------------
app.use(cors({
  credentials: true,
  origin: function(origin, callback) {
    if (!origin || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

// ---------------- HELPER ----------------
async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (!token) return reject('no token');

    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) return reject(err);
      resolve(userData);
    });
  });
}

// ---------------- ROUTES ----------------

app.get('/', (req,res) => {
  res.send("Backend is running 🚀");
});

app.get('/test', (req,res) => {
  res.json('test ok');
});

app.get('/messages/:userId', async (req,res) => {
  try {
    const {userId} = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;

    const messages = await Message.find({
      sender: {$in:[userId,ourUserId]},
      recipient: {$in:[userId,ourUserId]},
    }).sort({createdAt: 1});

    res.json(messages);
  } catch (err) {
    res.status(401).json('unauthorized');
  }
});

app.get('/people', async (req,res) => {
  const users = await User.find({}, {'_id':1,username:1});
  res.json(users);
});

app.get('/profile', (req,res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json('no token');

  jwt.verify(token, jwtSecret, {}, (err, userData) => {
    if (err) return res.status(401).json('invalid token');
    res.json(userData);
  });
});

// ---------------- AUTH ----------------

// LOGIN
app.post('/login', async (req,res) => {
  const {username, password} = req.body;

  const foundUser = await User.findOne({username});
  if (!foundUser) return res.status(404).json('user not found');

  const passOk = bcrypt.compareSync(password, foundUser.password);
  if (!passOk) return res.status(401).json('wrong password');

  jwt.sign({userId:foundUser._id, username}, jwtSecret, {}, (err, token) => {
    if (err) return res.status(500).json('token error');

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    }).json({ id: foundUser._id });
  });
});

// REGISTER
app.post('/register', async (req,res) => {
  const {username,password} = req.body;

  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);

    const createdUser = await User.create({
      username,
      password: hashedPassword,
    });

    jwt.sign({userId:createdUser._id, username}, jwtSecret, {}, (err, token) => {
      if (err) return res.status(500).json('token error');

      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      }).status(201).json({ id: createdUser._id });
    });

  } catch(err) {
    res.status(500).json('error');
  }
});

// LOGOUT
app.post('/logout', (req,res) => {
  res.cookie('token', '', {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
  }).json('ok');
});

// ---------------- SERVER ----------------

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

// ---------------- WEBSOCKET ----------------

const wss = new ws.WebSocketServer({ server });

wss.on('connection', (connection, req) => {

  function notifyAboutOnlinePeople() {
    [...wss.clients].forEach(client => {
      client.send(JSON.stringify({
        online: [...wss.clients].map(c => ({
          userId: c.userId,
          username: c.username
        })),
      }));
    });
  }

  connection.isAlive = true;

  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyAboutOnlinePeople();
    }, 1000);
  }, 5000);

  connection.on('pong', () => {
    clearTimeout(connection.deathTimer);
  });

  // READ COOKIE
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
    if (tokenCookie) {
      const token = tokenCookie.split('=')[1];

      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (!err) {
          connection.userId = userData.userId;
          connection.username = userData.username;
        }
      });
    }
  }

  connection.on('message', async (message) => {
    const {recipient, text, file} = JSON.parse(message.toString());

    let filename = null;

    if (file) {
      const ext = file.name.split('.').pop();
      filename = Date.now() + '.' + ext;

      const path = __dirname + '/uploads/' + filename;
      const buffer = Buffer.from(file.data.split(',')[1], 'base64');

      fs.writeFile(path, buffer, () => {});
    }

    if (recipient && (text || file)) {

      // 🔥 DEBUG LOG
      console.log("SENDING MESSAGE:", {
        sender: connection.userId,
        recipient
      });

      const messageDoc = await Message.create({
        sender: connection.userId,
        recipient,
        text,
        file: filename,
      });

      // 🔥 FIX: SEND TO BOTH USERS
      [...wss.clients]
        .filter(c => c.userId === recipient || c.userId === connection.userId)
        .forEach(c => c.send(JSON.stringify({
          text,
          sender: connection.userId,
          recipient,
          file: file ? filename : null,
          _id: messageDoc._id,
        })));
    }
  });

  notifyAboutOnlinePeople();
});