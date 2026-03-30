const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT || 8787);
const ROOT = path.resolve(__dirname, '..');
const allowedOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (allowedOrigins.length) {
  app.use(
    cors({
      origin: function (origin, cb) {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS: ' + origin));
      },
    })
  );
} else {
  app.use(cors());
}
app.use(express.json());

app.get('/api/health', function (_req, res) {
  res.json({ ok: true, service: 'nye-clock-backend' });
});

app.get('/api/cloud-config', function (_req, res) {
  const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
  const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || '').trim();
  const oauthRedirect = String(process.env.OAUTH_REDIRECT || '').trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(503).json({
      error: 'cloud_not_configured',
      message: 'SUPABASE_URL or SUPABASE_ANON_KEY is missing on server',
    });
  }

  res.json({
    supabaseUrl,
    supabaseAnonKey,
    oauthRedirect: oauthRedirect || undefined,
  });
});

app.get('/', function (_req, res) {
  const indexPath = path.join(ROOT, 'tw_.html');
  if (!fs.existsSync(indexPath)) {
    return res.status(404).send('tw_.html not found');
  }
  res.sendFile(indexPath);
});

app.get('/manifest.json', function (_req, res) {
  const p = path.join(ROOT, 'manifest.json');
  if (!fs.existsSync(p)) return res.status(404).json({ error: 'manifest_missing' });
  res.sendFile(p);
});

app.use(express.static(ROOT));

app.listen(PORT, function () {
  console.log('[nye-backend] running at http://localhost:' + PORT);
});
