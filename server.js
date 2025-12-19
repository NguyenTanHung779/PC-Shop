// server.js
// Requirements: npm install express mysql2 cors bcryptjs jsonwebtoken dotenv nodemailer
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

// OTP Storage (in-memory, expires after 10 minutes)
const otpStore = new Map(); // Format: { email: { otp, expires, purpose, userId } }

// Google OAuth config (set these in your .env)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/auth/google/callback`;

// ZaloPay config (set these in your .env)
const ZALOPAY_APP_ID = process.env.ZALOPAY_APP_ID || '';
const ZALOPAY_KEY1 = process.env.ZALOPAY_KEY1 || '';
const ZALOPAY_KEY2 = process.env.ZALOPAY_KEY2 || '';
const ZALOPAY_SANDBOX = process.env.ZALOPAY_SANDBOX === 'true';

const app = express();

// ---------- CORS CONFIGURATION ----------
// Restrict CORS to specific origins only (not wildcard *)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log suspicious CORS attempts
      console.warn(`⚠️ CORS blocked: ${origin}`);
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
  maxAge: 3600 // Pre-flight cache for 1 hour
}));

app.use(express.json());

// ---------- SECURITY HEADERS ----------
// Content Security Policy - prevents XSS, clickjacking, etc.
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdn.example.com; " +
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data: https://cdn.jsdelivr.net; " +
    "connect-src 'self' http://localhost:5000 http://localhost:3000; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
  );
  
  // Other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff'); // Prevent MIME type sniffing
  res.setHeader('X-Frame-Options', 'DENY'); // Prevent clickjacking
  res.setHeader('X-XSS-Protection', '1; mode=block'); // Enable XSS filter
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains'); // HSTS
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); // Control referrer info
  
  next();
});

// ---------- CONFIG ----------
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_a_strong_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const DB_MAX = 9999999999999999999999.99; // Maximum for DECIMAL(25,2) - supports high VND prices

// ---------- DATABASE ----------
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'pcshop_db',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  connectTimeout: 10000
});

db.connect(err => {
  if (err) {
    console.error('❌ DB CONNECTION ERROR:', err);
    process.exit(1);
  }
  console.log('✅ Connected to DB');
});

// ---------- EMAIL TRANSPORTER ----------
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  }
});

// Verify email configuration
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  emailTransporter.verify((error, success) => {
    if (error) {
      console.warn('⚠️  Email not configured properly:', error.message);
      console.log('📧 OTP emails will be logged to console instead');
    } else {
      console.log('✅ Email service ready');
    }
  });
} else {
  console.log('📧 Email not configured. OTP will be logged to console.');
  console.log('   To enable email: Set EMAIL_USER and EMAIL_PASS in .env file');
}

// ---------- HELPERS ----------
function signToken(user) {
  // only include minimal user info in token
  return jwt.sign({
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    role: user.role
  }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function handleDbError(res, err) {
  console.error('DB ERROR:', err);
  return res.status(500).json({ error: 'Database error' });
}

// OTP Helper Functions
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

function storeOTP(email, otp, purpose, userId = null) {
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(email.toLowerCase(), { otp, expires, purpose, userId });
  
  // Auto-cleanup after expiration
  setTimeout(() => {
    otpStore.delete(email.toLowerCase());
  }, 10 * 60 * 1000);
}

function verifyOTP(email, otp, purpose) {
  const stored = otpStore.get(email.toLowerCase());
  
  if (!stored) {
    return { valid: false, error: 'OTP expired or not found' };
  }
  
  if (Date.now() > stored.expires) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, error: 'OTP expired' };
  }
  
  if (stored.otp !== otp) {
    return { valid: false, error: 'Invalid OTP' };
  }
  
  if (stored.purpose !== purpose) {
    return { valid: false, error: 'OTP purpose mismatch' };
  }
  
  return { valid: true, userId: stored.userId };
}

async function sendOTPEmail(email, otp, purpose) {
  const purposeText = {
    'registration': 'Email Verification',
    'login': 'Login Verification',
    'password_reset': 'Password Reset',
    'admin_verification': 'Admin Action Verification',
    'password_change': 'Password Change Verification',
    'email_change_old': 'Email Change Verification',
    'email_change_new': 'Email Change Verification'
  };
  
  const mailOptions = {
    from: `"FirePC Gaming" <${process.env.EMAIL_USER || 'noreply@firepc.com'}>`,
    to: email,
    subject: `${purposeText[purpose] || 'Verification'} - Your OTP Code`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #d32f2f;">🔥 FirePC Gaming</h2>
        <h3>${purposeText[purpose] || 'Verification'}</h3>
        <p>Your verification code is:</p>
        <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #666;">This code will expire in <strong>10 minutes</strong>.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `
  };
  
  // If email is configured, send email. Otherwise log to console
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      await emailTransporter.sendMail(mailOptions);
      console.log(`📧 OTP sent to ${email} for ${purpose}`);
      return true;
    } catch (err) {
      console.error('❌ Email send error:', err);
      console.log(`📧 OTP for ${email}: ${otp} (logged due to email error)`);
      return false;
    }
  } else {
    // Development mode: log OTP to console
    console.log('\n' + '='.repeat(50));
    console.log(`📧 OTP Email (Development Mode)`);
    console.log(`   To: ${email}`);
    console.log(`   Purpose: ${purpose}`);
    console.log(`   OTP: ${otp}`);
    console.log(`   Expires in: 10 minutes`);
    console.log('='.repeat(50) + '\n');
    return true;
  }
}

// ---------- MIDDLEWARE ----------
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });
    req.user = decoded; // { user_id, username, email, role }
    next();
  });
}

function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
}

// ---------- PUBLIC ROUTES ----------

// Send OTP for registration
app.post('/api/send-otp', async (req, res) => {
  const { email, purpose } = req.body;
  
  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (!purpose || !['registration', 'login', 'password_reset', 'admin_verification', 'password_change', 'email_change_old', 'email_change_new'].includes(purpose)) {
    return res.status(400).json({ error: 'Invalid purpose' });
  }
  
  try {
    // For registration, check if email already exists
    if (purpose === 'registration') {
      const checkSql = 'SELECT user_id FROM users WHERE email = ? LIMIT 1';
      const [existing] = await new Promise((resolve, reject) => {
        db.query(checkSql, [email], (err, results) => {
          if (err) reject(err);
          else resolve([results]);
        });
      });
      
      if (existing && existing.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }
    
    // For login, verify email exists
    if (purpose === 'login') {
      const checkSql = 'SELECT user_id FROM users WHERE email = ? LIMIT 1';
      const [existing] = await new Promise((resolve, reject) => {
        db.query(checkSql, [email], (err, results) => {
          if (err) reject(err);
          else resolve([results]);
        });
      });
      
      if (!existing || existing.length === 0) {
        return res.status(400).json({ error: 'Email not found' });
      }
    }
    
    const otp = generateOTP();
    storeOTP(email, otp, purpose);
    await sendOTPEmail(email, otp, purpose);
    
    res.json({ 
      message: 'OTP sent successfully', 
      email: email,
      expiresIn: 600 // seconds
    });
  } catch (err) {
    console.error('OTP send error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Get user email from username or email (for OTP sending)
app.post('/api/get-user-email', async (req, res) => {
  const { loginId } = req.body;
  
  if (!loginId) {
    return res.status(400).json({ error: 'Login ID is required' });
  }
  
  try {
    const sql = 'SELECT email FROM users WHERE username = ? OR email = ? LIMIT 1';
    db.query(sql, [loginId, loginId], (err, results) => {
      if (err) return handleDbError(res, err);
      
      if (!results || results.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ email: results[0].email });
    });
  } catch (err) {
    console.error('Error fetching email:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify OTP
app.post('/api/verify-otp', (req, res) => {
  const { email, otp, purpose } = req.body;
  
  if (!email || !otp || !purpose) {
    return res.status(400).json({ error: 'Email, OTP, and purpose are required' });
  }
  
  const verification = verifyOTP(email, otp, purpose);
  
  if (!verification.valid) {
    return res.status(400).json({ error: verification.error });
  }
  
  // OTP is valid, delete it after verification
  otpStore.delete(email.toLowerCase());
  
  res.json({ 
    message: 'OTP verified successfully',
    verified: true
  });
});

// Generic Email Endpoint (for password reset emails, etc.)
app.post('/api/send-email', verifyToken, isAdmin, async (req, res) => {
  const { to, subject, html } = req.body;
  
  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'to, subject, and html are required' });
  }
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return res.status(500).json({ error: 'Email service not configured' });
  }
  
  try {
    const mailOptions = {
      from: `"PC Shop" <${process.env.EMAIL_USER || 'noreply@pcshop.com'}>`,
      to: to,
      subject: subject,
      html: html
    };
    
    await emailTransporter.sendMail(mailOptions);
    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send email: ' + err.message });
  }
});

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Database Viewer</title>
        <style>
          body { 
            font-family: Arial; 
            background: #111; 
            color: #eee; 
            padding: 20px; 
          }
          button {
            margin: 5px;
            padding: 10px 15px;
            border: none;
            background: #444;
            color: white;
            cursor: pointer;
            border-radius: 6px;
          }
          button:hover { background: #666; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            border: 1px solid #444;
            padding: 8px;
          }
          th {
            background: #333;
          }
          pre {
            background: #222;
            padding: 15px;
            border-radius: 10px;
            white-space: pre-wrap;
            max-height: 65vh;
            overflow-y: auto;
          }
          img {
            width: 180px;
            display: block;
            margin-bottom: 10px;
          }
        </style>
      </head>

      <body>
        <h1>🛠 Quick Database Viewer</h1>

        <!-- joke image -->
        <img src="https://media.discordapp.net/attachments/839759663552528424/1447581545425797331/G5aotIJXQAASq5O.jpeg?ex=69415f5f&is=69400ddf&hm=e4afd20ac9a064678c1fefb1a763a1fc0ebe002c830f4f27179eaab85800b015&=&format=webp">

        <p>Click a table to view its contents</p>

        <div>
          <button onclick="loadTable('users')">Users</button>
          <button onclick="loadTable('items')">Items</button>
          <button onclick="loadTable('pc_specs')">PC Specs</button>
          <button onclick="loadTable('item_images')">Item Images</button>
          <button onclick="loadTable('categories')">Categories</button>
          <button onclick="loadTable('orders')">Orders</button>
          <button onclick="loadTable('order_items')">Order Items</button>
          <button onclick="loadTable('cart')">Cart</button>
          <button onclick="loadTable('cart_items')">Cart Items</button>
        </div>

        <br>

        <!-- toggle view mode -->
        <button onclick="toggleView()">Switch View Mode</button>

        <!-- shutdown button -->
        <button style="background:#f00;" onclick="shutdown()">Nuke the server (spam 5 times)</button>

        <h2 id="title"></h2>

        <!-- table container -->
        <div id="tableView" style="display:none;"></div>

        <!-- json container -->
        <pre id="jsonView" style="display:block;">Select a table above</pre>

        <!-- audio for shutdown -->
        <audio id="shutdownSound" src="https://files.catbox.moe/1u6bmu.wav"></audio>

        <script>
          let viewMode = "json"; // json or table

          function toggleView() {
            viewMode = viewMode === "json" ? "table" : "json";
            document.getElementById("jsonView").style.display = 
              viewMode === "json" ? "block" : "none";

            document.getElementById("tableView").style.display = 
              viewMode === "table" ? "block" : "none";
          }

          function loadTable(table) {
            document.getElementById("title").innerText = "Loading " + table + "...";

            fetch("/api/view/" + table)
              .then(res => res.json())
              .then(result => {
                const rows = result.data;
                document.getElementById("title").innerText =
                  "Table: " + table + " (" + rows.length + " rows)";

                // JSON view
                document.getElementById("jsonView").textContent =
                  JSON.stringify(rows, null, 2);

                // Table view
                const tableDiv = document.getElementById("tableView");
                if (rows.length === 0) {
                  tableDiv.innerHTML = "<p>No data</p>";
                  return;
                }

                let html = "<table><tr>";
                Object.keys(rows[0]).forEach(col => {
                  html += "<th>" + col + "</th>";
                });
                html += "</tr>";

                rows.forEach(r => {
                  html += "<tr>";
                  Object.values(r).forEach(v => {
                    html += "<td>" + v + "</td>";
                  });
                  html += "</tr>";
                });

                html += "</table>";
                tableDiv.innerHTML = html;
              });
          }

        let shutdownClicks = 0;
        let shutdownTimer = null;

        function shutdown() {
          shutdownClicks++;

          // reset if too slow
          if (!shutdownTimer) {
            shutdownTimer = setTimeout(() => {
              shutdownClicks = 0;
              shutdownTimer = null;
            }, 1000); // 1 second window
          }

          if (shutdownClicks < 5) {
            return;
          }

          // reached 5 clicks in time -> execute shutdown
          clearTimeout(shutdownTimer);
          shutdownTimer = null;
          shutdownClicks = 0;

          document.getElementById("shutdownSound").play();

          setTimeout(() => {
            fetch("/shutdown", { method: "POST" });
            alert("Server nuked. Goodbye.");
          }, 1000);
        }

        </script>
      </body>
    </html>
  `);
});

app.post("/shutdown", (req, res) => {
  res.send("Server shutting down...");
  console.log("⚠ Server shutdown triggered by viewer");
  setTimeout(() => process.exit(0), 500);
});


// Registration (public) - Now requires OTP verification
app.post('/api/register', async (req, res) => {
  const { username, email, password, otp, skipOTP } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  // Verify OTP unless explicitly skipped (for backward compatibility)
  if (!skipOTP) {
    if (!otp) {
      return res.status(400).json({ error: 'OTP verification required', requireOTP: true });
    }
    
    const verification = verifyOTP(email, otp, 'registration');
    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }
    
    // Delete OTP after successful verification
    otpStore.delete(email.toLowerCase());
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`;
    db.query(sql, [username, email, hashed], (err, result) => {
      if (err) {
        // duplicate email handling
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Email already registered' });
        }
        return handleDbError(res, err);
      }
      return res.json({ message: 'Registered successfully', user_id: result.insertId });
    });
  } catch (err) {
    console.error('Hash error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Login (public) -> returns token + user
app.post('/api/login', (req, res) => {
  const { loginId, password } = req.body;
  if (!loginId || !password) return res.status(400).json({ error: 'Missing credentials' });

  const sql = `SELECT user_id, username, email, password_hash, role, created_at FROM users WHERE username = ? OR email = ? LIMIT 1`;
  db.query(sql, [loginId, loginId], async (err, results) => {
    if (err) return handleDbError(res, err);
    if (!results || results.length === 0) return res.status(400).json({ error: 'Account not found' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Incorrect password' });

    const token = signToken(user);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  });
});

// Get user profile by token
app.get('/api/profile', verifyToken, (req, res) => {
  const userId = req.user.user_id;
  const sql = `SELECT user_id, username, email, role, created_at FROM users WHERE user_id = ? LIMIT 1`;
  db.query(sql, [userId], (err, results) => {
    if (err) return handleDbError(res, err);
    if (!results || results.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = results[0];
    return res.json({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    });
  });
});

// Get all orders for logged-in user (with items)
app.get('/api/user/orders', verifyToken, (req, res) => {
  const userId = req.user.user_id;
  const { status, sortBy = 'date' } = req.query; // Filter by status, sort by date or amount

  let sql = `
    SELECT o.order_id, o.user_id, o.total_amount, o.order_date, o.status,
           o.shipping_name, o.shipping_address, o.shipping_city, o.shipping_province, o.shipping_postal, o.shipping_phone, o.payment_method
    FROM orders o
    WHERE o.user_id = ?
  `;
  let params = [userId];

  // Apply status filter if provided
  if (status && status !== 'all') {
    sql += ` AND o.status = ?`;
    params.push(status);
  }

  // Apply sorting
  if (sortBy === 'amount') {
    sql += ` ORDER BY o.total_amount DESC`;
  } else {
    sql += ` ORDER BY o.order_date DESC`;
  }

  db.query(sql, params, (err, orders) => {
    if (err) return handleDbError(res, err);

    if (!orders || orders.length === 0) {
      return res.json({ orders: [], count: 0 });
    }

    // Fetch items for each order
    let completedOrders = 0;
    const ordersWithItems = orders.map(order => ({
      ...order,
      items: []
    }));

    orders.forEach((order, index) => {
      const itemSql = `
        SELECT oi.order_item_id, oi.item_id, oi.quantity, oi.price_each, i.name AS item_name, i.image_url
        FROM order_items oi
        LEFT JOIN items i ON oi.item_id = i.item_id
        WHERE oi.order_id = ?
      `;

      db.query(itemSql, [order.order_id], (err2, items) => {
        if (err2) {
          console.error('Error fetching order items:', err2);
          ordersWithItems[index].items = [];
        } else {
          ordersWithItems[index].items = items;
        }

        completedOrders++;
        if (completedOrders === orders.length) {
          res.json({
            orders: ordersWithItems,
            count: ordersWithItems.length
          });
        }
      });
    });
  });
});

// Verify if user is admin
app.get('/api/verify-admin', verifyToken, (req, res) => {
  const userId = req.user.user_id;
  const sql = `SELECT role FROM users WHERE user_id = ? LIMIT 1`;
  db.query(sql, [userId], (err, results) => {
    if (err) return handleDbError(res, err);
    if (!results || results.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = results[0];
    return res.json({
      isAdmin: user.role === 'admin'
    });
  });
});

// Change password with OTP verification
app.post('/api/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword, otp } = req.body;
  const userId = req.user.user_id;
  const userEmail = req.user.email;

  if (!currentPassword || !newPassword || !otp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  try {
    // Verify OTP first
    const verification = verifyOTP(userEmail, otp, 'password_change');
    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }

    // Get user's current password hash
    const userSql = 'SELECT password_hash FROM users WHERE user_id = ? LIMIT 1';
    db.query(userSql, [userId], async (err, results) => {
      if (err) return handleDbError(res, err);
      if (!results || results.length === 0) return res.status(404).json({ error: 'User not found' });

      const user = results[0];

      // Verify current password
      const match = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const updateSql = 'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?';
      db.query(updateSql, [hashedPassword, userId], (err) => {
        if (err) return handleDbError(res, err);

        // Delete OTP after successful verification
        otpStore.delete(userEmail.toLowerCase());

        res.json({ message: 'Password changed successfully' });
      });
    });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change email with OTP verification
app.post('/api/change-email', verifyToken, async (req, res) => {
  const { newEmail, oldEmailOtp, newEmailOtp } = req.body;
  const userId = req.user.user_id;
  const userEmail = req.user.email;

  if (!newEmail || !oldEmailOtp || !newEmailOtp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (newEmail === userEmail) {
    return res.status(400).json({ error: 'New email must be different from current email' });
  }

  try {
    // Verify OTP from old email first
    const oldEmailVerification = verifyOTP(userEmail, oldEmailOtp, 'email_change_old');
    if (!oldEmailVerification.valid) {
      return res.status(400).json({ error: 'Invalid OTP for old email: ' + oldEmailVerification.error });
    }

    // Verify OTP from new email
    const newEmailVerification = verifyOTP(newEmail, newEmailOtp, 'email_change_new');
    if (!newEmailVerification.valid) {
      return res.status(400).json({ error: 'Invalid OTP for new email: ' + newEmailVerification.error });
    }

    // Check if new email is already registered
    const checkSql = 'SELECT user_id FROM users WHERE email = ? AND user_id != ? LIMIT 1';
    db.query(checkSql, [newEmail, userId], (err, results) => {
      if (err) return handleDbError(res, err);
      
      if (results && results.length > 0) {
        return res.status(400).json({ error: 'Email is already registered' });
      }

      // Update email
      const updateSql = 'UPDATE users SET email = ?, updated_at = NOW() WHERE user_id = ?';
      db.query(updateSql, [newEmail, userId], (err) => {
        if (err) return handleDbError(res, err);

        // Delete OTPs after successful verification
        otpStore.delete(userEmail.toLowerCase());
        otpStore.delete(newEmail.toLowerCase());

        res.json({ message: 'Email changed successfully', newEmail: newEmail });
      });
    });
  } catch (err) {
    console.error('Email change error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Temporary storage for pending Momo payments (in-memory, clears after 30 minutes)
const pendingMomoPayments = new Map();
const MOMO_PAYMENT_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Cleanup old pending payments periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of pendingMomoPayments.entries()) {
    if (now - value.timestamp > MOMO_PAYMENT_TIMEOUT) {
      pendingMomoPayments.delete(key);
      console.log(`🗑️ Cleaned up expired Momo payment: ${key}`);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Momo Payment API
const crypto = require('crypto');
app.post('/api/payment/momo', async (req, res) => {
  try {
    const { amount, description = 'PC Shop Order', items = [], orderId = null, orderData = null } = req.body;
    if (!amount) {
      return res.status(400).json({ error: 'Missing amount' });
    }

    // Momo configuration
    const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO';
    const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || '';
    const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || '';
    const MOMO_SANDBOX = process.env.MOMO_SANDBOX === 'true';

    // Generate unique request/order ID
    const requestId = MOMO_PARTNER_CODE + new Date().getTime();
    const finalOrderId = orderId || requestId;

    // **IMPORTANT: Store order data temporarily so we can create it after payment**
    if (orderData) {
      pendingMomoPayments.set(finalOrderId, {
        orderData: orderData,
        timestamp: Date.now()
      });
      console.log(`📦 Stored pending order data for Momo payment: ${finalOrderId}`);
    }

    // URLs
    const redirectUrl = process.env.MOMO_REDIRECT_URI || 'http://localhost:3000/account/profile.html';
    const ipnUrl = process.env.MOMO_IPN_URL || 'http://localhost:5000/api/payment/momo/callback';

    // Request type (captureWallet = payment wallet, paymentLinkQRCode = QR code)
    const requestType = 'captureWallet';
    const extraData = '';
    const lang = 'en';

    // Prepare raw signature string (order matters!)
    // Note: orderInfo should NOT be URL encoded in the signature
    const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${finalOrderId}&orderInfo=${description}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    // Create HMAC SHA256 signature
    const signature = crypto
      .createHmac('sha256', MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest('hex');

    // Prepare request payload
    const requestBody = {
      partnerCode: MOMO_PARTNER_CODE,
      accessKey: MOMO_ACCESS_KEY,
      requestId,
      amount,
      orderId: finalOrderId,
      orderInfo: description,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang
    };

    // Momo API endpoint
    const apiUrl = MOMO_SANDBOX
      ? 'https://test-payment.momo.vn/v2/gateway/api/create'
      : 'https://payment.momo.vn/v2/gateway/api/create';

    console.log('DEBUG: Momo request to', apiUrl);

    const momoRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const result = await momoRes.json();

    console.log('DEBUG: Momo response:', result);

    // Check if Momo returned success
    if (result.resultCode !== 0) {
      return res.status(500).json({ 
        error: 'Momo payment error',
        resultCode: result.resultCode,
        message: result.message,
        detail: result
      });
    }

    // Return payment URL and token to frontend
    res.json({
      payUrl: result.payUrl,
      qrCodeUrl: result.qrCodeUrl || null,
      token: result.token,
      orderId: finalOrderId,
      requestId
    });

  } catch (err) {
    console.error('Momo API error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Momo IPN Callback (Webhook)
app.post('/api/payment/momo/callback', async (req, res) => {
  try {
    const { orderId, resultCode, message, amount, transId, responseTime } = req.body;

    console.log('Momo IPN callback received:', { orderId, resultCode, message });

    // resultCode 0 = success
    if (resultCode === 0) {
      console.log(`✅ Momo payment successful for order ${orderId}`);
      
      // **NEW: Check if we have pending order data for this payment**
      if (pendingMomoPayments.has(orderId)) {
        const pendingPayment = pendingMomoPayments.get(orderId);
        const orderData = pendingPayment.orderData;
        
        console.log(`📝 Creating order for Momo payment: ${orderId}`);
        
        // Find or create user by email
        const selectUserSql = `SELECT user_id FROM users WHERE email = ? LIMIT 1`;
        db.query(selectUserSql, [orderData.email], async (err, userResults) => {
          if (err) {
            console.error('DB query error:', err);
            pendingMomoPayments.delete(orderId);
            return;
          }

          let userId;
          let userCreationDone = false;

          if (userResults && userResults.length > 0) {
            userId = userResults[0].user_id;
            createOrder();
          } else {
            // Create a new guest user
            const insertUserSql = `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`;
            const username = orderData.email.split('@')[0] + '_' + Date.now();
            
            db.query(insertUserSql, [username, orderData.email, '', 'user'], (err2, userInsertRes) => {
              if (err2) {
                console.error('User creation error:', err2);
                pendingMomoPayments.delete(orderId);
                return;
              }
              userId = userInsertRes.insertId;
              createOrder();
            });
          }

          function createOrder() {
            // Normalize total amount
            let totalAmount = Number.parseFloat(orderData.total || orderData.total_raw || 0);
            
            let normalized = totalAmount;
            if (normalized > DB_MAX) {
              const scales = [1000, 10000, 100000];
              for (const s of scales) {
                const scaled = totalAmount / s;
                if (scaled <= DB_MAX) {
                  normalized = scaled;
                  break;
                }
              }
              if (normalized > DB_MAX) {
                console.error('Total amount too large:', totalAmount);
                pendingMomoPayments.delete(orderId);
                return;
              }
            }
            totalAmount = Number(normalized.toFixed(2));

            // Create order with paid status (since Momo payment succeeded)
            const orderStatus = 'paid';

            const insertOrderSql = `
              INSERT INTO orders
                (user_id, total_amount, order_date, status,
                 shipping_name, shipping_address, shipping_city, shipping_province, shipping_postal, shipping_phone, payment_method)
              VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const orderParams = [
              userId,
              totalAmount,
              orderStatus,
              orderData.shipping_name || `${orderData.firstName || ''} ${orderData.lastName || ''}`.trim(),
              orderData.shipping_address || [orderData.address1, orderData.address2].filter(Boolean).join(' '),
              orderData.shipping_city || orderData.city || null,
              orderData.shipping_province || orderData.province || null,
              orderData.shipping_postal || orderData.postalCode || null,
              orderData.shipping_phone || orderData.phone || null,
              'momo' // Payment method is always Momo for this callback
            ];

            console.log('Momo callback: Inserting order', { userId, totalAmount, orderStatus });

            db.query(insertOrderSql, orderParams, (err3, orderInsertRes) => {
              if (err3) {
                console.error('Order creation error in Momo callback:', err3);
                pendingMomoPayments.delete(orderId);
                return;
              }

              const createdOrderId = orderInsertRes.insertId;

              // Insert order items
              if (!orderData.items || orderData.items.length === 0) {
                console.log('✅ Order created from Momo payment (no items):', createdOrderId);
                pendingMomoPayments.delete(orderId);
                return;
              }

              let itemsInserted = 0;
              orderData.items.forEach(item => {
                const insertItemSql = `
                  INSERT INTO order_items (order_id, item_id, quantity, price_each)
                  VALUES (?, ?, ?, ?)
                `;
                
                db.query(insertItemSql, [createdOrderId, item.id || item.item_id || 0, item.quantity || 1, item.price || 0], (err4) => {
                  itemsInserted++;

                  if (itemsInserted === orderData.items.length) {
                    console.log('✅ Order created from Momo payment (with items):', createdOrderId);
                    pendingMomoPayments.delete(orderId);
                  }
                });
              });
            });
          }
        });
      } else {
        // If no pending order data, just mark as paid (for backward compatibility)
        console.log('⚠️  No pending order data for Momo payment, updating existing order:', orderId);
        const updateSql = `UPDATE orders SET status = 'paid' WHERE order_id = ? OR CAST(order_id AS CHAR) = ?`;
        db.query(updateSql, [orderId, orderId], (err) => {
          if (err) console.error('DB update error:', err);
        });
      }
    } else {
      console.log(`❌ Momo payment failed for order ${orderId}: ${message}`);
      // Remove the pending order data if payment failed
      pendingMomoPayments.delete(orderId);
    }

    // Always respond with 200 to Momo
    res.json({ resultCode: 0, message: 'Webhook received' });

  } catch (err) {
    console.error('Momo callback error:', err);
    res.status(500).json({ error: 'Callback processing error' });
  }
});

// ZaloPay QR Payment API
app.post('/api/payment/zalopay', async (req, res) => {
  try {
    const { amount, description, items, embed_data = {}, app_user = "guest" } = req.body;
    if (!amount || !description) {
      return res.status(400).json({ error: 'Missing amount or description' });
    }

    // Generate unique app_trans_id: yymmdd_xxxx
    const date = new Date();
    const yymmdd = date.toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const app_trans_id = `${yymmdd}_${rand}`;
    const app_time = Date.now();
    const itemStr = JSON.stringify(items || []);
    const embedStr = JSON.stringify(embed_data);

    // Data for MAC
    const data = [
      ZALOPAY_APP_ID,
      app_trans_id,
      app_user,
      amount,
      app_time,
      embedStr,
      itemStr
    ].join('|');
    const mac = crypto.createHmac('sha256', ZALOPAY_KEY1).update(data).digest('hex');

    // Prepare payload
    const payload = {
      app_id: ZALOPAY_APP_ID,
      app_trans_id,
      app_user,
      app_time,
      amount,
      item: itemStr,
      embed_data: embedStr,
      description,
      bank_code: '',
      mac
    };

    const apiUrl = ZALOPAY_SANDBOX
      ? 'https://sb-openapi.zalopay.vn/v2/create'
      : 'https://openapi.zalopay.vn/v2/create';

    const zalopayRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await zalopayRes.json();
    if (result.return_code !== 1) {
      return res.status(500).json({ error: 'ZaloPay error', detail: result });
    }
    // result.order_url (for redirect), result.qr_code (base64), result.zp_trans_token
    res.json({
      order_url: result.order_url,
      zp_trans_token: result.zp_trans_token,
      app_trans_id
    });
  } catch (err) {
    console.error('ZaloPay API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- GOOGLE OAUTH (popup-friendly) ----------
// Initiates Google OAuth2 flow. Browser may open this in a popup by adding ?popup=true
app.get('/auth/google', (req, res) => {
  const popup = req.query.popup ? 'true' : 'false';
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  });
  // preserve popup flag through the flow
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` + (popup === 'true' ? '&state=popup' : '');
  res.redirect(url);
});

// Callback endpoint Google will redirect to
app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state || '';
  const isPopup = state === 'popup' || req.query.popup === 'true';

  if (!code) return res.status(400).send('Missing code from Google');

  try {
    // Exchange code for tokens
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResp.json();
    if (tokenData.error) {
      console.error('Google token error', tokenData);
      return res.status(400).send('Failed to exchange code for token');
    }

    const access_token = tokenData.access_token;

    // Fetch user info from Google
    const userInfoResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const profile = await userInfoResp.json();

    // profile contains: sub (google id), email, email_verified, name, picture
    const email = profile.email;
    const username = profile.name || (email ? email.split('@')[0] : `google_${profile.sub}`);

    // Find or create user in local DB (admin role must be assigned manually in DB)
    const selectSql = `SELECT user_id, username, email, role, created_at FROM users WHERE email = ? LIMIT 1`;
    db.query(selectSql, [email], (err, results) => {
      if (err) return handleDbError(res, err);

      const continueWithUser = (user) => {
        const token = signToken(user);
        if (isPopup) {
          // Post message to opener and close popup
          const payload = JSON.stringify({ token, role: user.role, user });
          return res.send(`
            <html><body>
              <script>
                try {
                  window.opener.postMessage(${payload}, '*');
                } catch (e) {
                  console.error(e);
                }
                window.close();
              </script>
              <p>Authentication complete. You can close this window.</p>
            </body></html>
          `);
        }

        // Fallback: redirect to root with token as query (not recommended for production)
        return res.redirect(`/?token=${encodeURIComponent(token)}`);
      };

      if (results && results.length > 0) {
        const user = results[0];
        continueWithUser(user);
      } else {
        // Create a new user (password_hash left null)
        const insertSql = `INSERT INTO users (username, email, role) VALUES (?, ?, ?)`;
        db.query(insertSql, [username, email, 'user'], (err2, insertRes) => {
          if (err2) return handleDbError(res, err2);
          const newUser = {
            user_id: insertRes.insertId,
            username,
            email,
            role: 'user',
            created_at: new Date()
          };
          continueWithUser(newUser);
        });
      }
    });
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.status(500).send('OAuth error');
  }
});

// ---------- PROTECTED ADMIN API ----------
// All admin routes use verifyToken + isAdmin middleware.
// You can loosen GET endpoints if you want public reads.

// -- USERS CRUD (admin only) --
app.get('/api/users', verifyToken, isAdmin, (req, res) => {
  const sql = `SELECT user_id, username, email, role, created_at, updated_at FROM users ORDER BY created_at DESC`;
  db.query(sql, (err, results) => {
    if (err) return handleDbError(res, err);
    res.json(results);
  });
});

app.get('/api/users/:id', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const sql = `SELECT user_id, username, email, role, created_at, updated_at FROM users WHERE user_id = ?`;
  db.query(sql, [id], (err, results) => {
    if (err) return handleDbError(res, err);
    if (!results.length) return res.status(404).json({ error: 'User not found' });
    res.json(results[0]);
  });
});

app.post('/api/users', verifyToken, isAdmin, async (req, res) => {
  const { username, email, password, role = 'user' } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`;
    db.query(sql, [username, email, hashed, role], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email or username already exists' });
        return handleDbError(res, err);
      }
      res.json({ message: 'User created', user_id: result.insertId });
    });
  } catch (err) {
    console.error('Hash error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/users/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, email, password, role } = req.body;

  // Build fields dynamically
  const fields = [];
  const values = [];
  if (username) { fields.push('username = ?'); values.push(username); }
  if (email) { fields.push('email = ?'); values.push(email); }
  if (typeof role !== 'undefined') { fields.push('role = ?'); values.push(role); }

  const doUpdate = () => {
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
    values.push(id);
    db.query(sql, values, (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email or username already exists' });
        return handleDbError(res, err);
      }
      res.json({ message: 'User updated' });
    });
  };

  if (password) {
    try {
      const hashed = await bcrypt.hash(password, 10);
      fields.push('password_hash = ?');
      values.push(hashed);
      doUpdate();
    } catch (err) {
      console.error('Hash error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  } else {
    doUpdate();
  }
});

app.delete('/api/users/:id', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM users WHERE user_id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) return handleDbError(res, err);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  });
});

// -- ITEMS CRUD (admin only) --
app.get('/api/items', verifyToken, isAdmin, (req, res) => {
  // join categories to provide category_name for dashboard
  const sql = `
    SELECT i.*, c.name AS category_name
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.category_id
    ORDER BY i.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return handleDbError(res, err);
    res.json(results);
  });
});

app.get('/api/items/:id', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const sql = `SELECT i.*, c.name AS category_name FROM items i LEFT JOIN categories c ON i.category_id = c.category_id WHERE i.item_id = ?`;
  db.query(sql, [id], (err, results) => {
    if (err) return handleDbError(res, err);
    if (!results.length) return res.status(404).json({ error: 'Item not found' });
    const item = results[0];
    res.json(item);
  });
});

// Public endpoint to list all items (no auth)
app.get('/api/public/items', (req, res) => {
  const sql = `
    SELECT i.*, c.name AS category_name
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.category_id
    ORDER BY i.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return handleDbError(res, err);
    res.json(results);
  });
});

// Public endpoint to fetch a single item with images and specs (no auth)
app.get('/api/public/items/:id', (req, res) => {
  const { id } = req.params;

  const sql = `SELECT item_id, name, description, price, stock, category_id, image_url, created_at, updated_at FROM items WHERE item_id = ? LIMIT 1`;
  db.query(sql, [id], (err, items) => {
    if (err) {
      console.error('Error fetching item:', err);
      return handleDbError(res, err);
    }
    if (!items || items.length === 0) return res.status(404).json({ error: 'Item not found' });

    const item = items[0];

    // fetch images (if table exists)
    const imagesSql = `SELECT url, alt_text FROM item_images WHERE item_id = ? ORDER BY sort_order`;
    db.query(imagesSql, [id], (imgErr, images) => {
      if (imgErr) {
        // If table doesn't exist or other error, continue without images
        if (imgErr.code !== 'ER_NO_SUCH_TABLE') return handleDbError(res, imgErr);
        images = [];
      }

      // fetch specs via junction table
      const specsSql = `
        SELECT ps.section, ps.spec_key, ps.spec_value, ps.display_order 
        FROM pc_specs ps
        INNER JOIN item_specs isp ON ps.spec_id = isp.spec_id
        WHERE isp.item_id = ?
        ORDER BY ps.section, ps.display_order
      `;
      db.query(specsSql, [id], (specErr, specRows) => {
        if (specErr) {
          // If table missing, return item with empty specs
          if (specErr.code === 'ER_NO_SUCH_TABLE') {
            item.images = (images || []).map(i => i.url);
            item.specs = {};
            return res.json({ item });
          }
          return handleDbError(res, specErr);
        }

        // Group specs by section
        const specs = {};
        for (const r of specRows || []) {
          const sec = r.section || 'General';
          specs[sec] = specs[sec] || [];
          specs[sec].push({ key: r.spec_key, value: r.spec_value });
        }

        item.images = (images || []).map(i => i.url);
        item.specs = specs;
        res.json({ item });
      });
    });
  });
});

app.post('/api/items', verifyToken, isAdmin, (req, res) => {
  const { name, description = '', price = 0, stock = 0, category_id = null, image_url = null, specs = [], images = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });

  const sql = `INSERT INTO items (name, description, price, stock, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(sql, [name, description, price, stock, category_id, image_url], (err, result) => {
    if (err) return handleDbError(res, err);
    
    const itemId = result.insertId;
    
    // Insert specs if provided
    if (specs && specs.length > 0) {
      // Process each spec - either use existing spec_id or create new spec
      let specsProcessed = 0;
      const junctionValues = [];

      specs.forEach((spec) => {
        if (spec.spec_id) {
          // Use existing spec
          junctionValues.push([itemId, spec.spec_id]);
          specsProcessed++;
          if (specsProcessed === specs.length) insertJunction();
        } else {
          // Create new spec (check if already exists first)
          const checkSql = `SELECT spec_id FROM pc_specs WHERE section <=> ? AND spec_key = ? AND spec_value = ? LIMIT 1`;
          db.query(checkSql, [spec.section || 'General', spec.key, spec.value], (checkErr, existing) => {
            if (existing && existing.length > 0) {
              // Spec already exists, use it
              junctionValues.push([itemId, existing[0].spec_id]);
              specsProcessed++;
              if (specsProcessed === specs.length) insertJunction();
            } else {
              // Create new spec
              const insertSpecSql = `INSERT INTO pc_specs (section, spec_key, spec_value, display_order) VALUES (?, ?, ?, ?)`;
              db.query(insertSpecSql, [spec.section || 'General', spec.key, spec.value, spec.display_order || 0], (insertErr, insertRes) => {
                if (insertErr) console.error('Error inserting spec:', insertErr);
                else junctionValues.push([itemId, insertRes.insertId]);
                specsProcessed++;
                if (specsProcessed === specs.length) insertJunction();
              });
            }
          });
        }
      });

      function insertJunction() {
        if (junctionValues.length > 0) {
          const junctionSql = `INSERT INTO item_specs (item_id, spec_id) VALUES ?`;
          db.query(junctionSql, [junctionValues], (juncErr) => {
            if (juncErr) console.error('Error linking specs:', juncErr);
          });
        }
      }
    }
    
    // Insert images if provided
    if (images && images.length > 0) {
      const imagesValues = images.map((img, idx) => [itemId, img.url, img.alt_text || '', img.sort_order || idx]);
      const imagesSql = `INSERT INTO item_images (item_id, url, alt_text, sort_order) VALUES ?`;
      db.query(imagesSql, [imagesValues], (imgErr) => {
        if (imgErr) console.error('Error inserting images:', imgErr);
      });
    }
    
    res.json({ message: 'Item added', item_id: itemId });
  });
});

app.put('/api/items/:id', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, category_id, image_url } = req.body;

  const fields = [];
  const values = [];
  if (typeof name !== 'undefined') { fields.push('name = ?'); values.push(name); }
  if (typeof description !== 'undefined') { fields.push('description = ?'); values.push(description); }
  if (typeof price !== 'undefined') { fields.push('price = ?'); values.push(price); }
  if (typeof stock !== 'undefined') { fields.push('stock = ?'); values.push(stock); }
  if (typeof category_id !== 'undefined') { fields.push('category_id = ?'); values.push(category_id); }
  if (typeof image_url !== 'undefined') { fields.push('image_url = ?'); values.push(image_url); }

  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

  const sql = `UPDATE items SET ${fields.join(', ')} WHERE item_id = ?`;
  values.push(id);
  db.query(sql, values, (err, result) => {
    if (err) return handleDbError(res, err);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item updated' });
  });
});

app.delete('/api/items/:id', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  
  // Delete related records in this order to respect foreign key constraints
  // Step 1: Delete from order_items (references items)
  db.query('DELETE FROM order_items WHERE item_id = ?', [id], (err1) => {
    if (err1) return handleDbError(res, err1);
    
    // Step 2: Delete from cart_items (references items)
    db.query('DELETE FROM cart_items WHERE item_id = ?', [id], (err2) => {
      if (err2) return handleDbError(res, err2);
      
      // Step 3: Delete from item_images (has ON DELETE CASCADE, but delete explicitly for clarity)
      db.query('DELETE FROM item_images WHERE item_id = ?', [id], (err3) => {
        if (err3) return handleDbError(res, err3);
        
        // Step 4: Delete from item_specs (has ON DELETE CASCADE, but delete explicitly for clarity)
        db.query('DELETE FROM item_specs WHERE item_id = ?', [id], (err4) => {
          if (err4) return handleDbError(res, err4);
          
          // Step 5: Finally delete the product itself
          db.query('DELETE FROM items WHERE item_id = ?', [id], (err5, result) => {
            if (err5) return handleDbError(res, err5);
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });
            res.json({ message: 'Item and all related records deleted successfully' });
          });
        });
      });
    });
  });
});

// -- PC SPECS ENDPOINTS (admin only) --
app.post('/api/items/:id/specs', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { specs } = req.body;
  if (!specs || !Array.isArray(specs) || specs.length === 0) {
    return res.status(400).json({ error: 'Missing specs array' });
  }

  // Process each spec - use existing or create new
  let specsProcessed = 0;
  const junctionValues = [];

  specs.forEach((spec) => {
    if (spec.spec_id) {
      // Use existing spec
      junctionValues.push([id, spec.spec_id]);
      specsProcessed++;
      if (specsProcessed === specs.length) insertJunction();
    } else {
      // Check if spec already exists
      const checkSql = `SELECT spec_id FROM pc_specs WHERE section <=> ? AND spec_key = ? AND spec_value = ? LIMIT 1`;
      db.query(checkSql, [spec.section || 'General', spec.key, spec.value], (checkErr, existing) => {
        if (existing && existing.length > 0) {
          junctionValues.push([id, existing[0].spec_id]);
          specsProcessed++;
          if (specsProcessed === specs.length) insertJunction();
        } else {
          // Create new spec
          const insertSpecSql = `INSERT INTO pc_specs (section, spec_key, spec_value, display_order) VALUES (?, ?, ?, ?)`;
          db.query(insertSpecSql, [spec.section || 'General', spec.key, spec.value, spec.display_order || 0], (insertErr, insertRes) => {
            if (insertErr) console.error('Error inserting spec:', insertErr);
            else junctionValues.push([id, insertRes.insertId]);
            specsProcessed++;
            if (specsProcessed === specs.length) insertJunction();
          });
        }
      });
    }
  });

  function insertJunction() {
    if (junctionValues.length === 0) return res.json({ message: 'No specs to add' });
    const junctionSql = `INSERT IGNORE INTO item_specs (item_id, spec_id) VALUES ?`;
    db.query(junctionSql, [junctionValues], (juncErr, result) => {
      if (juncErr) return handleDbError(res, juncErr);
      res.json({ message: 'Specs added', count: result.affectedRows });
    });
  }
});

app.delete('/api/items/:id/specs', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM item_specs WHERE item_id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) return handleDbError(res, err);
    res.json({ message: 'Spec links deleted', count: result.affectedRows });
  });
});

// -- CREATE NEW PC SPEC (admin only) --
app.post('/api/pcspecs', verifyToken, isAdmin, (req, res) => {
  const { section, key, value, display_order } = req.body;
  
  if (!section || !key || !value) {
    return res.status(400).json({ error: 'Missing required fields: section, key, value' });
  }

  const sql = `INSERT INTO pc_specs (section, spec_key, spec_value, display_order) VALUES (?, ?, ?, ?)`;
  db.query(sql, [section, key, value, display_order || 0], (err, result) => {
    if (err) return handleDbError(res, err);
    res.json({ message: 'PC spec created successfully', spec_id: result.insertId });
  });
});

// -- UPDATE PC SPEC (admin only) --
app.put('/api/pcspecs/:id', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { section, key, value, display_order } = req.body;
  
  if (!section || !key || !value) {
    return res.status(400).json({ error: 'Missing required fields: section, key, value' });
  }

  const sql = `UPDATE pc_specs SET section = ?, spec_key = ?, spec_value = ?, display_order = ? WHERE spec_id = ?`;
  db.query(sql, [section, key, value, display_order || 0, id], (err, result) => {
    if (err) return handleDbError(res, err);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'PC spec not found' });
    res.json({ message: 'PC spec updated successfully' });
  });
});

// -- DELETE INDIVIDUAL PC SPEC (admin only) --
app.delete('/api/pcspecs/:id', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  // This will cascade delete from item_specs due to foreign key
  const sql = `DELETE FROM pc_specs WHERE spec_id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) return handleDbError(res, err);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'PC spec not found' });
    res.json({ message: 'PC spec deleted successfully' });
  });
});

// -- ITEM IMAGES ENDPOINTS (admin only) --
app.post('/api/items/:id/images', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { images } = req.body;
  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'Missing images array' });
  }

  const imagesValues = images.map((img, idx) => [id, img.url, img.alt_text || '', img.sort_order || idx]);
  const sql = `INSERT INTO item_images (item_id, url, alt_text, sort_order) VALUES ?`;
  
  db.query(sql, [imagesValues], (err, result) => {
    if (err) return handleDbError(res, err);
    res.json({ message: 'Images added', count: result.affectedRows });
  });
});

app.delete('/api/items/:id/images/:imageId', verifyToken, isAdmin, (req, res) => {
  const { id, imageId } = req.params;
  const sql = `DELETE FROM item_images WHERE image_id = ? AND item_id = ?`;
  db.query(sql, [imageId, id], (err, result) => {
    if (err) return handleDbError(res, err);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Image not found' });
    res.json({ message: 'Image deleted' });
  });
});

// Delete all images for a product
app.delete('/api/items/:id/images', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM item_images WHERE item_id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) return handleDbError(res, err);
    res.json({ message: 'All images deleted', count: result.affectedRows });
  });
});

// -- CATEGORIES CRUD (admin only) --
app.get('/api/categories', verifyToken, isAdmin, (req, res) => {
  const sql = `SELECT * FROM categories ORDER BY name`;
  db.query(sql, (err, results) => {
    if (err) return handleDbError(res, err);
    res.json(results);
  });
});

app.get('/api/categories/:id', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM categories WHERE category_id = ?`;
  db.query(sql, [id], (err, results) => {
    if (err) return handleDbError(res, err);
    if (!results.length) return res.status(404).json({ error: 'Category not found' });
    res.json(results[0]);
  });
});

app.post('/api/categories', verifyToken, isAdmin, (req, res) => {
  const { name, description = '' } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });

  const sql = `INSERT INTO categories (name, description) VALUES (?, ?)`;
  db.query(sql, [name, description], (err, result) => {
    if (err) return handleDbError(res, err);
    res.json({ message: 'Category created', category_id: result.insertId });
  });
});

app.put('/api/categories/:id', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const fields = [];
  const values = [];
  if (typeof name !== 'undefined') { fields.push('name = ?'); values.push(name); }
  if (typeof description !== 'undefined') { fields.push('description = ?'); values.push(description); }
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

  const sql = `UPDATE categories SET ${fields.join(', ')} WHERE category_id = ?`;
  values.push(id);
  db.query(sql, values, (err, result) => {
    if (err) return handleDbError(res, err);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category updated' });
  });
});

app.delete('/api/categories/:id', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM categories WHERE category_id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) return handleDbError(res, err);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  });
});

// -- ORDERS (admin only) --
app.get('/api/orders', verifyToken, isAdmin, (req, res) => {
  // Return basic order info + username + email + item_count
  const sql = `
    SELECT o.order_id, o.user_id, o.total_amount, o.order_date, o.status,
           u.username, u.email,
           (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS item_count
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    ORDER BY o.order_date DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return handleDbError(res, err);
    res.json(results);
  });
});

app.get('/api/orders/:id', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const sqlOrder = `
    SELECT o.order_id, o.user_id, o.total_amount, o.order_date, o.status,
           o.shipping_name, o.shipping_address, o.shipping_city, o.shipping_province, o.shipping_postal, o.shipping_phone, o.payment_method,
           u.username, u.email
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    WHERE o.order_id = ?
  `;
  const sqlItems = `
    SELECT oi.order_item_id, oi.item_id, oi.quantity, oi.price_each, i.name AS item_name
    FROM order_items oi
    JOIN items i ON oi.item_id = i.item_id
    WHERE oi.order_id = ?
  `;

  db.query(sqlOrder, [id], (err, orderResults) => {
    if (err) return handleDbError(res, err);
    if (!orderResults.length) return res.status(404).json({ error: 'Order not found' });

    db.query(sqlItems, [id], (err2, items) => {
      if (err2) return handleDbError(res, err2);
      const order = orderResults[0];
      res.json(order);
    });
  });
});

app.put('/api/orders/:id', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Missing status' });

  const sql = `UPDATE orders SET status = ? WHERE order_id = ?`;
  db.query(sql, [status, id], (err, result) => {
    if (err) return handleDbError(res, err);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order updated' });
  });
});

// -- DELETE ORDER (admin only) --
app.delete('/api/orders/:id', verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;

  // Delete order items first (foreign key constraint)
  const deleteSql = `DELETE FROM order_items WHERE order_id = ?`;
  db.query(deleteSql, [id], (err1) => {
    if (err1) return handleDbError(res, err1);

    // Then delete the order
    const deleteOrderSql = `DELETE FROM orders WHERE order_id = ?`;
    db.query(deleteOrderSql, [id], (err2, result) => {
      if (err2) return handleDbError(res, err2);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({ message: 'Order deleted successfully', order_id: id });
    });
  });
});

// -- DELETE MULTIPLE ORDERS (admin only) --
app.post('/api/orders/delete-batch', verifyToken, isAdmin, (req, res) => {
  const { orderIds } = req.body;

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({ error: 'Missing orderIds array' });
  }

  // Create placeholders for SQL IN clause
  const placeholders = orderIds.map(() => '?').join(',');

  // Delete order items first
  const deleteItemsSql = `DELETE FROM order_items WHERE order_id IN (${placeholders})`;
  db.query(deleteItemsSql, orderIds, (err1) => {
    if (err1) return handleDbError(res, err1);

    // Then delete the orders
    const deleteOrdersSql = `DELETE FROM orders WHERE order_id IN (${placeholders})`;
    db.query(deleteOrdersSql, orderIds, (err2, result) => {
      if (err2) return handleDbError(res, err2);

      res.json({ 
        message: `${result.affectedRows} order(s) deleted successfully`,
        deleted_count: result.affectedRows,
        order_ids: orderIds
      });
    });
  });
});

// -- CREATE ORDER (public) --
app.post('/api/orders/create', async (req, res) => {
  try {
    const {
      email,
      user_id, // **NEW: Accept user_id from authenticated users**
      firstName,
      lastName,
      address1,
      address2,
      city,
      province,
      postalCode,
      phone,
      country,
      payment,
      shipping_name,
      shipping_address,
      shipping_city,
      shipping_province,
      shipping_postal,
      shipping_phone,
      payment_method,
      items,
      total,
      total_raw,
      currency
    } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !items || items.length === 0 || total === undefined) {
      return res.status(400).json({ error: 'Missing required fields: email, firstName, lastName, items, total' });
    }

    // Determine numeric total to store
    let totalAmount = Number.parseFloat(total);
    if (Number.isNaN(totalAmount)) {
      totalAmount = Number.parseFloat(total_raw) || 0;
    }

    // **Store total as-is (database can handle big numbers now)**
    let normalized = totalAmount;
    
    console.log('DEBUG: Order total processing', {
      incoming_total: total,
      incoming_total_raw: total_raw,
      incoming_currency: currency,
      normalized: normalized,
      will_store: normalized,
      user_id_provided: user_id
    });

    // If still out of range after dividing by 100, try more scales
    if (normalized > DB_MAX) {
      console.warn('ORDER: total too large even after /100, trying further scaling', { normalized });
      const scales = [1000, 10000, 100000];
      for (const s of scales) {
        const scaled = totalAmount / s;
        if (scaled <= DB_MAX) {
          console.warn(`ORDER: scaled by ${s}, final total: ${scaled}`);
          normalized = scaled;
          break;
        }
      }

      // If still out of range, reject
      if (normalized > DB_MAX) {
        console.error('ORDER REJECTED: total too large after all scaling attempts', { totalAmount, normalized });
        return res.status(400).json({ error: 'Order total exceeds maximum allowed amount' });
      }
    }

    // Ensure exactly 2 decimal places
    totalAmount = Number(normalized.toFixed(2));

    // **NEW: If user_id is provided (authenticated user), use it directly**
    if (user_id) {
      console.log('✅ Using authenticated user_id:', user_id);
      insertOrder(user_id);
    } else {
      // Find or create user by email (guest checkout)
      const selectUserSql = `SELECT user_id FROM users WHERE email = ? LIMIT 1`;
      db.query(selectUserSql, [email], async (err, userResults) => {
        if (err) return handleDbError(res, err);

        let userId;

        if (userResults && userResults.length > 0) {
          userId = userResults[0].user_id;
          insertOrder(userId);
        } else {
          // Create a new guest user
          const insertUserSql = `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`;
          const username = email.split('@')[0] + '_' + Date.now();
          
          db.query(insertUserSql, [username, email, '', 'user'], (err2, userInsertRes) => {
            if (err2) return handleDbError(res, err2);
            userId = userInsertRes.insertId;
            insertOrder(userId);
          });
        }
      });
    }

    function insertOrder(userId) {
      // Create order
      const orderStatus = 'pending';

      // Insert order with shipping fields
      const insertOrderSql = `
        INSERT INTO orders
          (user_id, total_amount, order_date, status,
           shipping_name, shipping_address, shipping_city, shipping_province, shipping_postal, shipping_phone, payment_method)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const orderParams = [
        userId,
        totalAmount,
        orderStatus,
        shipping_name || `${firstName || ''} ${lastName || ''}`.trim(),
        shipping_address || [address1, address2].filter(Boolean).join(' '),
        shipping_city || city || null,
        shipping_province || province || null,
        shipping_postal || postalCode || null,
        shipping_phone || phone || null,
        payment_method || payment || null
      ];

      console.log('DEBUG: Inserting order with params:', {
        userId,
        totalAmount,
        orderStatus,
        shipping_name: orderParams[3],
        payment_method: orderParams[10]
      });

      db.query(insertOrderSql, orderParams, (err3, orderInsertRes) => {
        if (err3) return handleDbError(res, err3);

        const orderId = orderInsertRes.insertId;

        // Insert order items
        if (!items || items.length === 0) {
          return res.json({
            message: 'Order created successfully',
            order_id: orderId,
            status: orderStatus
          });
        }

        let itemsInserted = 0;
        items.forEach(item => {
          const insertItemSql = `
            INSERT INTO order_items (order_id, item_id, quantity, price_each)
            VALUES (?, ?, ?, ?)
          `;
          
          db.query(insertItemSql, [orderId, item.id || item.item_id || 0, item.quantity || 1, item.price || 0], (err4) => {
            itemsInserted++;

            if (itemsInserted === items.length) {
              // All items inserted
              console.log('ORDER CREATED successfully', {
                order_id: orderId,
                user_id: userId,
                total_amount: totalAmount,
                status: orderStatus
              });
              return res.json({
                message: 'Order created successfully',
                order_id: orderId,
                status: orderStatus,
                total_amount: totalAmount
              });
            }
          });
        });
      });
    }
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

const allowedTables = [
  "users",
  "items",
  "pc_specs",
  "item_images",
  "categories",
  "orders",
  "order_items",
  "cart",
  "cart_items",
  "audit_logs"
];

app.get('/api/view/:table', (req, res) => {
  const table = req.params.table;

  // Strict validation: alphanumeric and underscore only
  if (!/^[a-z_]+$/.test(table) || !allowedTables.includes(table)) {
    return res.status(400).json({ error: "No permission to view this table" });
  }

  // Use backticks for identifier escaping (prevents SQL injection)
  const sql = `SELECT * FROM \`${table}\``;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({
      table,
      count: results.length,
      data: results
    });
  });
});

// -- AUDIT LOGS ENDPOINTS --
// Get all audit logs (admin only)
app.get('/api/audit-logs', verifyToken, isAdmin, (req, res) => {
  const sql = `SELECT * FROM audit_logs ORDER BY time_stamp DESC`;
  db.query(sql, (err, results) => {
    if (err) return handleDbError(res, err);
    res.json({ data: results, count: results.length });
  });
});

// -- AUDIT LOGS ENDPOINTS --
// Get all audit logs (admin only)
app.get('/api/audit-logs', verifyToken, isAdmin, (req, res) => {
  const sql = `SELECT * FROM audit_logs ORDER BY time_stamp DESC`;
  db.query(sql, (err, results) => {
    if (err) return handleDbError(res, err);
    res.json({ data: results, count: results.length });
  });
});

// Create audit log entry (admin only)
app.post('/api/audit-logs', verifyToken, isAdmin, (req, res) => {
  const { user, change_made, category, change_in } = req.body;
  
  if (!user || !change_made || !category || !change_in) {
    return res.status(400).json({ error: 'Missing required fields: user, change_made, category, change_in' });
  }

  const sql = `INSERT INTO audit_logs (user, change_made, category, change_in) VALUES (?, ?, ?, ?)`;
  db.query(sql, [user, change_made, category, change_in], (err, result) => {
    if (err) return handleDbError(res, err);
    res.json({ message: 'Audit log created successfully', log_id: result.insertId });
  });
});

// ---------- CART MANAGEMENT ENDPOINTS ----------

// Get or create cart for user (requires auth)
app.get('/api/cart', verifyToken, (req, res) => {
  const userId = req.user.user_id;
  const sql = `SELECT cart_id FROM cart WHERE user_id = ? LIMIT 1`;
  
  db.query(sql, [userId], (err, results) => {
    if (err) return handleDbError(res, err);
    
    if (results.length > 0) {
      return res.json({ cart_id: results[0].cart_id });
    }
    
    // Create new cart if doesn't exist
    const insertSql = `INSERT INTO cart (user_id, created_at) VALUES (?, NOW())`;
    db.query(insertSql, [userId], (err, result) => {
      if (err) return handleDbError(res, err);
      res.json({ cart_id: result.insertId });
    });
  });
});

// Get cart items with full details (requires auth)
app.get('/api/cart/:cartId/items', verifyToken, (req, res) => {
  const { cartId } = req.params;
  const userId = req.user.user_id;
  
  // Verify cart belongs to user
  const verifySql = `SELECT cart_id FROM cart WHERE cart_id = ? AND user_id = ? LIMIT 1`;
  db.query(verifySql, [cartId, userId], (err, verifyResults) => {
    if (err) return handleDbError(res, err);
    if (verifyResults.length === 0) {
      return res.status(403).json({ error: 'Cart not found or unauthorized' });
    }
    
    // Get cart items with full item details
    const sql = `
      SELECT ci.cart_item_id, ci.item_id, ci.quantity, 
             i.name, i.price, i.image_url, i.description
      FROM cart_items ci
      JOIN items i ON ci.item_id = i.item_id
      WHERE ci.cart_id = ?
      ORDER BY ci.cart_item_id DESC
    `;
    
    db.query(sql, [cartId], (err, results) => {
      if (err) return handleDbError(res, err);
      res.json({ items: results, count: results.length });
    });
  });
});

// Add item to cart (requires auth)
app.post('/api/cart/:cartId/add', verifyToken, (req, res) => {
  const { cartId } = req.params;
  const { item_id, quantity = 1 } = req.body;
  const userId = req.user.user_id;
  
  if (!item_id) {
    return res.status(400).json({ error: 'item_id is required' });
  }
  
  // Verify cart belongs to user
  const verifySql = `SELECT cart_id FROM cart WHERE cart_id = ? AND user_id = ? LIMIT 1`;
  db.query(verifySql, [cartId, userId], (err, verifyResults) => {
    if (err) return handleDbError(res, err);
    if (verifyResults.length === 0) {
      return res.status(403).json({ error: 'Cart not found or unauthorized' });
    }
    
    // Check if item already in cart
    const checkSql = `SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = ? AND item_id = ? LIMIT 1`;
    db.query(checkSql, [cartId, item_id], (err, checkResults) => {
      if (err) return handleDbError(res, err);
      
      if (checkResults.length > 0) {
        // Update quantity
        const newQty = checkResults[0].quantity + quantity;
        const updateSql = `UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?`;
        db.query(updateSql, [newQty, checkResults[0].cart_item_id], (err, result) => {
          if (err) return handleDbError(res, err);
          res.json({ message: 'Cart item quantity updated', cart_item_id: checkResults[0].cart_item_id, quantity: newQty });
        });
      } else {
        // Insert new cart item
        const insertSql = `INSERT INTO cart_items (cart_id, item_id, quantity) VALUES (?, ?, ?)`;
        db.query(insertSql, [cartId, item_id, quantity], (err, result) => {
          if (err) return handleDbError(res, err);
          res.json({ message: 'Item added to cart', cart_item_id: result.insertId });
        });
      }
    });
  });
});

// Update cart item quantity (requires auth)
app.put('/api/cart/:cartId/items/:cartItemId', verifyToken, (req, res) => {
  const { cartId, cartItemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.user_id;
  
  if (typeof quantity === 'undefined' || quantity < 0) {
    return res.status(400).json({ error: 'quantity must be >= 0' });
  }
  
  // Verify cart belongs to user
  const verifySql = `SELECT cart_id FROM cart WHERE cart_id = ? AND user_id = ? LIMIT 1`;
  db.query(verifySql, [cartId, userId], (err, verifyResults) => {
    if (err) return handleDbError(res, err);
    if (verifyResults.length === 0) {
      return res.status(403).json({ error: 'Cart not found or unauthorized' });
    }
    
    if (quantity === 0) {
      // Delete item if quantity is 0
      const deleteSql = `DELETE FROM cart_items WHERE cart_item_id = ? AND cart_id = ?`;
      db.query(deleteSql, [cartItemId, cartId], (err, result) => {
        if (err) return handleDbError(res, err);
        res.json({ message: 'Cart item removed' });
      });
    } else {
      // Update quantity
      const updateSql = `UPDATE cart_items SET quantity = ? WHERE cart_item_id = ? AND cart_id = ?`;
      db.query(updateSql, [quantity, cartItemId, cartId], (err, result) => {
        if (err) return handleDbError(res, err);
        res.json({ message: 'Cart item updated', quantity });
      });
    }
  });
});

// Remove item from cart (requires auth)
app.delete('/api/cart/:cartId/items/:cartItemId', verifyToken, (req, res) => {
  const { cartId, cartItemId } = req.params;
  const userId = req.user.user_id;
  
  // Verify cart belongs to user
  const verifySql = `SELECT cart_id FROM cart WHERE cart_id = ? AND user_id = ? LIMIT 1`;
  db.query(verifySql, [cartId, userId], (err, verifyResults) => {
    if (err) return handleDbError(res, err);
    if (verifyResults.length === 0) {
      return res.status(403).json({ error: 'Cart not found or unauthorized' });
    }
    
    const deleteSql = `DELETE FROM cart_items WHERE cart_item_id = ? AND cart_id = ?`;
    db.query(deleteSql, [cartItemId, cartId], (err, result) => {
      if (err) return handleDbError(res, err);
      res.json({ message: 'Cart item removed' });
    });
  });
});

// Clear entire cart (requires auth)
app.delete('/api/cart/:cartId', verifyToken, (req, res) => {
  const { cartId } = req.params;
  const userId = req.user.user_id;
  
  // Verify cart belongs to user
  const verifySql = `SELECT cart_id FROM cart WHERE cart_id = ? AND user_id = ? LIMIT 1`;
  db.query(verifySql, [cartId, userId], (err, verifyResults) => {
    if (err) return handleDbError(res, err);
    if (verifyResults.length === 0) {
      return res.status(403).json({ error: 'Cart not found or unauthorized' });
    }
    
    const deleteSql = `DELETE FROM cart_items WHERE cart_id = ?`;
    db.query(deleteSql, [cartId], (err, result) => {
      if (err) return handleDbError(res, err);
      res.json({ message: 'Cart cleared', items_removed: result.affectedRows });
    });
  });
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
