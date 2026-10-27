const $ = (id) => document.getElementById(id);
const today = new Date();
const localDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
$("attendance-date").value = localDate;
$("month").value = localDate.slice(0, 7);
let students = [];
let latestSummary = [];

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}
function setMessage(id, text) { $(id).textContent = text; }

async function loadAttendance() {
  const rows = await api(`/api/attendance?date=${$("attendance-date").value}`);
  const byStudent = new Map();
  for (const row of rows) {
    if (!byStudent.has(row.student_id)) byStudent.set(row.student_id, { ...row, periods: {} });
    if (row.period) byStudent.get(row.student_id).periods[row.period] = row.status;
  }
  const tbody = $("attendance-table").querySelector("tbody");
  tbody.replaceChildren();
  for (const student of byStudent.values()) {
    const tr = document.createElement("tr");
    tr.dataset.studentId = student.student_id;
    tr.innerHTML = `<td>${escapeHtml(student.roll_no)}</td><td>${escapeHtml(student.name)}</td><td>${escapeHtml(student.department)}</td>`;
    for (let period = 1; period <= 7; period++) {
      const td = document.createElement("td");
      const select = document.createElement("select");
      select.dataset.period = period;
      select.innerHTML = `<option value="">--</option><option value="Present">Present</option><option value="Absent">Absent</option>`;
      select.value = student.periods[period] || "";
      td.appendChild(select); tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  students = [...byStudent.values()];
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
$("student-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/students", { method: "POST", body: JSON.stringify({
      roll_no: $("roll").value, name: $("name").value, department: $("department").value
    })});
    $("student-form").reset();
    setMessage("student-message", "Student added successfully.");
    await loadAttendance();
  } catch (err) { setMessage("student-message", err.message); }
});
$("attendance-date").addEventListener("change", () => loadAttendance().catch(err => setMessage("attendance-message", err.message)));
$("mark-all-present").addEventListener("click", () => document.querySelectorAll("#attendance-table select").forEach(s => s.value = "Present"));
$("mark-all-absent").addEventListener("click", () => document.querySelectorAll("#attendance-table select").forEach(s => s.value = "Absent"));
$("save-attendance").addEventListener("click", async () => {
  try {
    const date = $("attendance-date").value;
    const requests = [];
    for (const row of document.querySelectorAll("#attendance-table tbody tr")) {
      for (const select of row.querySelectorAll("select")) {
        if (!select.value) continue;
        requests.push(api("/api/attendance", { method: "POST", body: JSON.stringify({
          student_id: Number(row.dataset.studentId), attendance_date: date,
          period: Number(select.dataset.period), status: select.value
        })}));
      }
    }
    await Promise.all(requests);
    setMessage("attendance-message", "Attendance saved successfully.");
    await loadSummary();
  } catch (err) { setMessage("attendance-message", err.message); }
});
async function loadSummary() {
  latestSummary = await api(`/api/monthly-summary?month=${$("month").value}`);
  const tbody = $("summary-table").querySelector("tbody");
  tbody.replaceChildren();
  latestSummary.forEach(r => {
    const tr = document.createElement("tr");
    [r.roll_no, r.name, r.attended, r.absent, r.working_periods, `${r.percentage}%`].forEach(v => {
      const td = document.createElement("td"); td.textContent = v ?? ""; tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}
$("load-summary").addEventListener("click", () => loadSummary().catch(err => setMessage("attendance-message", err.message)));
$("export-csv").addEventListener("click", async () => {
  try {
    await loadSummary();
    const lines = [["Roll No","Name","Attended","Absent","Working Periods","Attendance %"],
      ...latestSummary.map(r => [r.roll_no, r.name, r.attended, r.absent, r.working_periods, r.percentage])];
    const csv = lines.map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.download = `attendance-${$("month").value}.csv`;
    link.click(); URL.revokeObjectURL(link.href);
  } catch (err) { setMessage("attendance-message", err.message); }
});
loadAttendance().catch(err => setMessage("attendance-message", err.message));
