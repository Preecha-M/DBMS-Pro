require('dotenv').config();
const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// แก้ไขตรงนี้ครับ
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // หรือแยกเป็น user, host, password ตามที่ตั้งไว้ใน .env
  ssl: {
    rejectUnauthorized: false // สำหรับ Render และบริการ Cloud ส่วนใหญ่ ต้องใส่ค่านี้เพื่อให้เชื่อมต่อได้จากเครื่อง Local
  }
});

// ตรวจสอบการเชื่อมต่อใหม่
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Successfully connected to Render PostgreSQL (SSL)!');
  release();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});