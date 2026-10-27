# Student Attendance Management System Using DevOps Tools

## Features
- Add students (roll number, name, department)
- Mark Present/Absent for seven periods on a selected date
- Save attendance to SQLite; duplicate student/date/period records are updated
- Monthly attended/absent/working-period summary and percentage
- Export monthly summary to CSV
- Dockerfile, Jenkinsfile, Kubernetes manifests, and Selenium smoke test

## Requirements
Install Node.js 20+, Git, and Google Chrome. Docker is required for the container stage. Jenkins and a Kubernetes cluster are optional until those stages.

## Run locally
1. Open a terminal in this folder.
2. Run `npm install`
3. Run `npm start`
4. Open `http://localhost:3000`
5. Add a few students, mark attendance, save, then view a monthly summary.

The SQLite database is created automatically as `attendance.db` in this folder.

## Git and GitHub
```bash
git init
git add .
git commit -m "Initial attendance application"
```
Create an empty GitHub repository, then follow GitHub's displayed instructions to add the remote and push the branch.

## Docker
```bash
docker build -t student-attendance:1.0 .
docker run --name attendance-app -p 3000:3000 -v attendance-data:/data student-attendance:1.0
```
Open `http://localhost:3000`.

## Jenkins
Create a Pipeline job connected to the GitHub repository and use the included `Jenkinsfile`. This simple pipeline uses Unix shell steps (`sh`); on a Windows-only Jenkins agent, adapt these steps to `bat`.

## Kubernetes
Build the image where your local Kubernetes cluster can access it. For Docker Desktop Kubernetes, enable Kubernetes in Docker Desktop, build the image locally, then run:
```bash
kubectl apply -f k8s/deployment.yaml
kubectl get pods
kubectl get services
kubectl port-forward service/attendance-service 3000:3000
```
Then open `http://localhost:3000`. Note: the sample manifest uses `emptyDir`, so database contents do not survive pod replacement. Use a PersistentVolumeClaim for persistent Kubernetes storage.

## Selenium
Install Chrome and ensure the installed Chrome version is compatible with Selenium's driver management. Start the app in one terminal using `npm start`; in another terminal run:
```bash
npm run test:e2e
```
The smoke test adds a TEST001 student. Delete that test record from a fresh test database or change the test roll number if running repeatedly.

## Jenkins pipeline note
The sample pipeline runs syntax validation, not a full unit-test suite. Add database/API tests and configure Jenkins credentials securely before using this in a real deployment.
