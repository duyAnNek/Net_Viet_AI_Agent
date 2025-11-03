// server/index.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');

// WebSocket
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5050;

const origins = (process.env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: origins.length ? origins : true,
  credentials: true
}));
app.use(express.json());

console.log('[SMTP] user:', process.env.SMTP_USER || '(empty)');
console.log('[SMTP] pass len:', (process.env.SMTP_PASS || '').length);

const now = () => Date.now();
const normalizeEmail = (e) => (e || '').toLowerCase().trim();
const genCode6 = () => Math.floor(100000 + Math.random() * 900000).toString();
const isStrongPassword = (s) =>
  typeof s === 'string' &&
  s.length >= 6 &&
  /[A-Za-z]/.test(s) &&
  /\d/.test(s);

// ==== MOCK DATA SEED (in-memory) ====
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const firstNames = ['Alice','Bob','Carol','David','Eva','Frank','Grace','Hank','Ivy','Jack','Kane','Lily','Mike','Nina','Oscar','Paul','Quinn','Rose','Sam','Tina'];
const lastNames  = ['Nguyen','Tran','Le','Pham','Hoang','Phan','Vu','Vo','Dang','Bui','Do','Ho','Ngo'];
const roles      = ['Engineer','Designer','PM','QA','HR','Support','Data','Ops'];
const depts      = ['Engineering','Design','Product','Quality','HR','Support','Data','Operations'];

const productNames = [
  'Laptop','Mouse','Keyboard','Monitor 24"','USB-C Hub','Headset','Webcam','SSD 1TB','RAM 16GB','Power Adapter',
  'Docking Station','Tablet','Phone Stand','Microphone','HDMI Cable'
];

function seedEmployees(n = 15) {
  const arr = [];
  for (let i = 1; i <= n; i++) {
    const name = `${pick(firstNames)} ${pick(lastNames)}`;
    arr.push({ id: i, name, role: pick(roles), department: pick(depts) });
  }
  return arr;
}
function seedProducts(n = 20) {
  const arr = [];
  for (let i = 1; i <= n; i++) {
    const name = pick(productNames) + (Math.random() < 0.25 ? ' Pro' : '');
    arr.push({ id: i, name, price: rand(10, 1500), quantity: rand(0, 100) });
  }
  return arr;
}

let employees = seedEmployees(15);
let products = seedProducts(20);

const demoPassHash = bcrypt.hashSync('demo123', 10);
let users = [
  { id: 1, email: 'demo@company.com', passHash: demoPassHash, name: 'Demo User' }
];

const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.length) {
      users = arr;
      console.log('[USERS] Loaded from file:', users.length);
    } else {
      console.log('[USERS] File empty or invalid, using default');
    }
  } catch (e) {
    console.log('[USERS] No users.json, using default demo user');
  }
}
function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log('[USERS] Saved:', users.length);
  } catch (e) {
    console.error('[USERS] save error:', e?.message || e);
  }
}
loadUsers();

const OTP_TTL_MS = 5 * 60 * 1000;      
const RESEND_COOLDOWN_MS = 30 * 1000; 

const emailOtpStore = new Map();

const signupTickets = new Map();

const resetOtpStore = new Map();
const passwordResetTickets = new Map();


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587), 
  secure: Number(process.env.SMTP_PORT || 587) === 465,
  auth: (process.env.SMTP_USER && process.env.SMTP_PASS)
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
  logger: true,
  debug: true,
});
transporter.verify((err) => {
  if (err) console.error('SMTP verify failed:', err.message || err);
  else console.log('SMTP server is ready to send emails.');
});

app.get('/api/ping', (_req, res) => res.json({ ok: true }));


app.post('/api/test-email', async (req, res) => {
  const { to = process.env.SMTP_USER } = req.body || {};
  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject: 'SMTP Gmail test',
      text: 'Hello from Nodemailer via Gmail SMTP.',
    });
    res.json({ ok: true, messageId: info.messageId });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || e });
  }
});

app.get('/api/debug/users', (req, res) => {
  res.json(users.map(u => ({
    id: u.id, email: u.email, name: u.name, passHashLen: (u.passHash || '').length
  })));
});

// Debug: reseed data
app.post('/api/debug/seed', (req, res) => {
  const nEmp = Number(req.body?.employees || 15);
  const nProd = Number(req.body?.products || 20);
  employees = seedEmployees(nEmp);
  products = seedProducts(nProd);
  res.json({ ok: true, employees: employees.length, products: products.length });
});

// Kiểm tra trùng tên đăng nhập / email (để UI gõ tới đâu check tới đó)
app.post('/api/auth/check-availability', (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const nameRaw = (req.body.name || '').trim();

    const emailTaken = email ? !!users.find(u => u.email.toLowerCase() === email) : false;
    const nameTaken  = nameRaw ? !!users.find(u => (u.name || '').toLowerCase() === nameRaw.toLowerCase()) : false;

    res.json({ emailTaken, nameTaken });
  } catch (e) {
    console.error(e);
    res.status(500).json({ emailTaken: false, nameTaken: false });
  }
});

// 1) Gửi mã OTP (đăng ký)
app.post('/api/auth/email/start', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const nameRaw = (req.body.name || '').trim();

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }
    if (!nameRaw) {
      return res.status(400).json({ message: 'Thiếu tên đăng nhập' });
    }

    const exists = !!users.find(u => u.email.toLowerCase() === email);
    if (exists) {
      return res.json({ ok: false, exists: true });
    }

    const nameTaken = !!users.find(u => (u.name || '').toLowerCase() === nameRaw.toLowerCase());
    if (nameTaken) {
      return res.json({ ok: false, nameTaken: true });
    }

    const prev = emailOtpStore.get(email);
    if (prev && prev.lastSentAt && now() - prev.lastSentAt < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - (now() - prev.lastSentAt)) / 1000);
      return res.status(429).json({ message: `Vui lòng thử lại sau ${wait}s` });
    }

    const code = genCode6();
    const otpHash = await bcrypt.hash(code, 10);
    emailOtpStore.set(email, {
      otpHash,
      expiresAt: now() + OTP_TTL_MS,
      lastSentAt: now(),
      attemptsLeft: 5,
    });

    const mail = {
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Mã xác thực đăng ký (OTP)',
      text: `Mã OTP của bạn là ${code}. Hết hạn sau 5 phút.`,
      html: `<p>Mã OTP của bạn là <b style="font-size:16px;">${code}</b>.</p><p>Mã hết hạn sau 5 phút.</p>`,
    };

    try {
      const info = await transporter.sendMail(mail);
      console.log('Sent OTP to', email, 'messageId:', info.messageId);
    } catch (e) {
      console.error('sendMail error:', e?.message || e);
      console.log('[DEV] OTP for', email, 'is', code);
    }

    res.json({ ok: true, exists: false, nameTaken: false });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Không thể gửi mã' });
  }
});

// 2) Xác thực mã OTP (đăng ký)
app.post('/api/auth/email/verify', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = (req.body.code || '').trim();

    const entry = emailOtpStore.get(email);
    if (!entry) return res.status(400).json({ message: 'Mã không tồn tại. Vui lòng gửi lại.' });
    if (now() > entry.expiresAt) {
      emailOtpStore.delete(email);
      return res.status(400).json({ message: 'Mã đã hết hạn. Vui lòng gửi lại.' });
    }
    if (entry.attemptsLeft <= 0) {
      emailOtpStore.delete(email);
      return res.status(400).json({ message: 'Nhập sai quá số lần cho phép.' });
    }

    const ok = await bcrypt.compare(code, entry.otpHash);
    if (!ok) {
      entry.attemptsLeft -= 1;
      emailOtpStore.set(email, entry);
      return res.status(400).json({ message: 'Mã không đúng. Vui lòng kiểm tra lại.' });
    }

    emailOtpStore.delete(email);

    const user = users.find(u => u.email.toLowerCase() === email);
    if (user) {
      return res.json({ needSignup: false });
    }

    const ticket = 't_' + crypto.randomUUID();
    signupTickets.set(ticket, { email, expiresAt: now() + 10 * 60 * 1000 });
    res.json({ needSignup: true, ticket });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Xác thực thất bại' });
  }
});

// 3) Hoàn tất signup (đăng ký)
app.post('/api/auth/email/complete-signup', async (req, res) => {
  try {
    const { ticket, name, password } = req.body || {};
    if (!ticket) return res.status(400).json({ message: 'Thiếu ticket' });
    if (!name || !password) return res.status(400).json({ message: 'Thiếu thông tin' });

    // Ràng buộc mật khẩu: 6+ ký tự, có chữ và số
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: 'Mật khẩu phải tối thiểu 6 ký tự và gồm cả chữ lẫn số' });
    }

    const record = signupTickets.get(ticket);
    if (!record) return res.status(400).json({ message: 'Ticket không hợp lệ hoặc đã hết hạn' });
    if (now() > record.expiresAt) {
      signupTickets.delete(ticket);
      return res.status(400).json({ message: 'Ticket đã hết hạn' });
    }

    const email = normalizeEmail(record.email);
    if (users.find(u => u.email.toLowerCase() === email)) {
      signupTickets.delete(ticket);
      return res.status(409).json({ message: 'Email đã tồn tại' });
    }

    const nameRaw = (name || '').trim();
    if (users.find(u => (u.name || '').toLowerCase() === nameRaw.toLowerCase())) {
      return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    const passHash = await bcrypt.hash(password, 10);
    const newUser = { id: users.length + 1, email, passHash, name: nameRaw || 'User' };
    users.push(newUser);
    signupTickets.delete(ticket);
    saveUsers();

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Không thể tạo tài khoản' });
  }
});

// ======= QUÊN MẬT KHẨU (RESET) =======

// 1) Gửi OTP reset
app.post('/api/auth/password/start', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email || !email.includes('@')) return res.json({ ok: true }); // tránh lộ email

    const user = users.find(u => u.email.toLowerCase() === email);
    if (user) {
      const prev = resetOtpStore.get(email);
      if (prev && prev.lastSentAt && now() - prev.lastSentAt < RESEND_COOLDOWN_MS) {
        const wait = Math.ceil((RESEND_COOLDOWN_MS - (now() - prev.lastSentAt)) / 1000);
        return res.status(429).json({ message: `Vui lòng thử lại sau ${wait}s` });
      }

      const code = genCode6();
      const otpHash = await bcrypt.hash(code, 10);
      resetOtpStore.set(email, {
        otpHash,
        expiresAt: now() + OTP_TTL_MS,
        lastSentAt: now(),
        attemptsLeft: 5,
      });

      const mail = {
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Mã đặt lại mật khẩu (OTP)',
        text: `Mã OTP đặt lại mật khẩu của bạn là ${code}. Hết hạn sau 5 phút.`,
        html: `<p>Mã OTP đặt lại mật khẩu của bạn là <b style="font-size:16px;">${code}</b>.</p><p>Mã hết hạn sau 5 phút.</p>`,
      };
      try {
        const info = await transporter.sendMail(mail);
        console.log('Sent RESET OTP to', email, 'messageId:', info.messageId);
      } catch (e) {
        console.error('sendMail reset error:', e?.message || e);
        console.log('[DEV] RESET OTP for', email, 'is', code);
      }
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Không thể gửi mã' });
  }
});

// 2) Xác thực OTP reset
app.post('/api/auth/password/verify', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = (req.body.code || '').trim();

    const entry = resetOtpStore.get(email);
    if (!entry) return res.status(400).json({ message: 'Mã không tồn tại. Vui lòng gửi lại.' });
    if (now() > entry.expiresAt) {
      resetOtpStore.delete(email);
      return res.status(400).json({ message: 'Mã đã hết hạn. Vui lòng gửi lại.' });
    }
    if (entry.attemptsLeft <= 0) {
      resetOtpStore.delete(email);
      return res.status(400).json({ message: 'Nhập sai quá số lần cho phép.' });
    }

    const ok = await bcrypt.compare(code, entry.otpHash);
    if (!ok) {
      entry.attemptsLeft -= 1;
      resetOtpStore.set(email, entry);
      return res.status(400).json({ message: 'Mã không đúng. Vui lòng kiểm tra lại.' });
    }

    resetOtpStore.delete(email);

    const user = users.find(u => u.email.toLowerCase() === email);
    if (!user) return res.json({ ok: true }); // không lộ

    const ticket = 'pr_' + crypto.randomUUID();
    passwordResetTickets.set(ticket, { email, expiresAt: now() + 10 * 60 * 1000 });
    res.json({ ok: true, ticket });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Xác thực thất bại' });
  }
});

// 3) Hoàn tất reset
app.post('/api/auth/password/complete', async (req, res) => {
  try {
    const { ticket, newPassword } = req.body || {};
    if (!ticket || !newPassword) return res.status(400).json({ message: 'Thiếu thông tin' });

    // Ràng buộc mật khẩu: 6+ ký tự, có chữ và số
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ message: 'Mật khẩu phải tối thiểu 6 ký tự và gồm cả chữ lẫn số' });
    }

    const record = passwordResetTickets.get(ticket);
    if (!record) return res.status(400).json({ message: 'Ticket không hợp lệ hoặc đã hết hạn' });
    if (now() > record.expiresAt) {
      passwordResetTickets.delete(ticket);
      return res.status(400).json({ message: 'Ticket đã hết hạn' });
    }

    const email = normalizeEmail(record.email);
    const user = users.find(u => u.email.toLowerCase() === email);
    if (!user) {
      passwordResetTickets.delete(ticket);
      return res.json({ ok: true });
    }

    user.passHash = await bcrypt.hash(newPassword, 10);
    passwordResetTickets.delete(ticket);
    saveUsers();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Không thể đặt lại mật khẩu' });
  }
});

// LOGIN (bcrypt + JWT)
async function handleLogin(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ code: 'MISSING_FIELDS', message: 'Thiếu email hoặc mật khẩu' });
  }

  // Ép ràng buộc mật khẩu khi đăng nhập
  if (!isStrongPassword(password)) {
    return res.status(400).json({ code: 'WEAK_PASSWORD', message: 'Mật khẩu phải tối thiểu 6 ký tự và gồm cả chữ lẫn số' });
  }

  const e = normalizeEmail(email);
  const u = users.find(x => x.email.toLowerCase() === e);

  // Log để debug
  console.log('[LOGIN]', { email: e, found: !!u });

  if (!u) {
    return res.status(404).json({ code: 'USER_NOT_FOUND', message: 'Chưa có tài khoản' });
  }

  const ok = await bcrypt.compare(password || '', u.passHash || '');
  if (!ok) {
    return res.status(401).json({ code: 'INVALID_PASSWORD', message: 'Đăng nhập không thành công. Mật khẩu không hợp lệ' });
  }

  const token = jwt.sign(
    { sub: u.id, email: u.email },
    process.env.JWT_SECRET || 'dev',
    { expiresIn: '2h' }
  );
  return res.json({ user: { id: u.id, email: u.email, name: u.name }, token });
}

app.post('/api/auth/login', handleLogin);
app.post('/api/login', handleLogin); // tương thích cũ

// ======= Chat rule-based (dùng chung cho REST và WebSocket) =======
function replyFromMessage(message) {
  if (!message) return 'Vui lòng nhập tin nhắn';
  const q = String(message).toLowerCase().trim();
  let reply = 'Mình chưa hiểu. Bạn có thể hỏi: "Có bao nhiêu nhân viên?", "Liệt kê 5 sản phẩm", "Tổng giá trị inventory?"';

  if (q.includes('nhân viên') || q.includes('employee')) {
    const count = employees.length;
    reply = `Hiện có ${count} nhân viên.`;
    const m = q.match(/liệt kê\s*(\d+)?/);
    if (m) {
      const n = Math.min(Number(m[1] || 5), employees.length);
      reply = `Danh sách ${n} nhân viên đầu tiên: ${employees.slice(0, n).map(e => e.name).join(', ')}.`;
    }
    const dept = depts.find(d => q.includes(d.toLowerCase()));
    if (dept) {
      const list = employees.filter(e => e.department === dept);
      reply = `Phòng ${dept} có ${list.length} nhân viên. Ví dụ: ${list.slice(0,5).map(e=>e.name).join(', ')}.`;
    }
  } else if (q.includes('sản phẩm') || q.includes('product')) {
    const count = products.length;
    reply = `Có ${count} sản phẩm trong kho.`;
    const m = q.match(/liệt kê\s*(\d+)?/);
    if (m) {
      const n = Math.min(Number(m[1] || 5), products.length);
      reply = `Danh sách ${n} sản phẩm: ${products.slice(0, n).map(p => p.name).join(', ')}.`;
    }
    const find = q.match(/tìm\s+(.+)/);
    if (find) {
      const kw = find[1].trim();
      const found = products.filter(p => p.name.toLowerCase().includes(kw)).slice(0, 5);
      reply = found.length ? `Tìm thấy: ${found.map(p=>`${p.name} (x${p.quantity})`).join(', ')}` : `Không thấy sản phẩm chứa từ "${kw}".`;
    }
  } else if (q.includes('tổng giá trị') || q.includes('inventory') || q.includes('tổng kho')) {
    const total = products.reduce((s, p) => s + p.price * p.quantity, 0);
    reply = `Tổng giá trị tồn kho hiện tại: ${total}.`;
  }

  return reply;
}

// REST chat
app.post('/api/chat', (req, res) => {
  const { message } = req.body || {};
  const reply = replyFromMessage(message);
  res.json({ reply });
});

// ======= WebSocket (Socket.IO) =======
const HOST = process.env.HOST || '0.0.0.0';
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: origins.length ? origins : true, credentials: true },
  path: '/socket.io'
});

io.on('connection', (socket) => {
  console.log('[WS] connected:', socket.id);

  socket.on('ping', (t, ack) => { ack && ack({ pong: Date.now(), t }); });

  socket.on('chat:send', (payload = {}, ack) => {
    try {
      const { message } = payload;
      const reply = replyFromMessage(message);
      socket.emit('chat:reply', { reply });
      ack && ack({ ok: true, reply });
    } catch (err) {
      console.error('[WS chat:send] error:', err);
      ack && ack({ error: 'SERVER_ERROR' });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[WS] disconnected:', socket.id, reason);
  });
});

// Endpoint check nhanh WS
app.get('/api/ws-status', (_req, res) => {
  res.json({ clients: io.of('/').sockets.size || 0 });
});

server.listen(PORT, HOST, () => {
  console.log(`API + WS listening on http://${HOST}:${PORT} (path /socket.io)`);
});