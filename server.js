const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const db = new sqlite3.Database(process.env.DB_PATH || path.join(__dirname, "attendance.db"));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roll_no TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department TEXT NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    attendance_date TEXT NOT NULL,
    period INTEGER NOT NULL CHECK(period BETWEEN 1 AND 7),
    status TEXT NOT NULL CHECK(status IN ('Present','Absent')),
    UNIQUE(student_id, attendance_date, period),
    FOREIGN KEY(student_id) REFERENCES students(id)
  )`);
});

app.get("/api/students", (req, res) => {
  db.all("SELECT * FROM students ORDER BY roll_no", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/students", (req, res) => {
  const { roll_no, name, department } = req.body;
  if (!roll_no || !name || !department) {
    return res.status(400).json({ error: "Roll number, name, and department are required." });
  }
  db.run(
    "INSERT INTO students (roll_no, name, department) VALUES (?, ?, ?)",
    [roll_no.trim(), name.trim(), department.trim()],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.status(201).json({ id: this.lastID, roll_no, name, department });
    }
  );
});

app.get("/api/attendance", (req, res) => {
  const date = req.query.date;
  if (!date) return res.status(400).json({ error: "A date query parameter is required." });
  db.all(
    `SELECT s.id AS student_id, s.roll_no, s.name, s.department,
      a.period, a.status
     FROM students s
     LEFT JOIN attendance a ON a.student_id = s.id AND a.attendance_date = ?
     ORDER BY s.roll_no, a.period`,
    [date],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post("/api/attendance", (req, res) => {
  const { student_id, attendance_date, period, status } = req.body;
  if (!student_id || !attendance_date || !Number.isInteger(period) ||
      period < 1 || period > 7 || !["Present", "Absent"].includes(status)) {
    return res.status(400).json({ error: "Provide student_id, date, period (1-7), and Present/Absent status." });
  }
  db.run(
    `INSERT INTO attendance (student_id, attendance_date, period, status)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(student_id, attendance_date, period)
     DO UPDATE SET status = excluded.status`,
    [student_id, attendance_date, period, status],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "Attendance saved." });
    }
  );
});

app.get("/api/monthly-summary", (req, res) => {
  const month = req.query.month; // YYYY-MM
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "Month must be in YYYY-MM format." });
  }
  db.all(
    `SELECT s.id, s.roll_no, s.name,
      SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS attended,
      SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent,
      COUNT(a.id) AS working_periods
     FROM students s
     LEFT JOIN attendance a ON a.student_id = s.id
       AND substr(a.attendance_date, 1, 7) = ?
     GROUP BY s.id
     ORDER BY s.roll_no`,
    [month],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map(r => ({
        ...r,
        percentage: r.working_periods ? Number((r.attended * 100 / r.working_periods).toFixed(2)) : 0
      })));
    }
  );
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`Attendance app running at http://localhost:${PORT}`));
