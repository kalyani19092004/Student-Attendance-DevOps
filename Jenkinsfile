pipeline {
  agent any
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Install dependencies') {
      steps { sh 'npm install' }
    }
    stage('Validation') {
      steps {
        sh 'node --check server.js'
        sh 'node --check public/app.js'
      }
    }
  }
  post {
    success { echo 'Build and JavaScript validation completed successfully.' }
    failure { echo 'Pipeline failed. Review the console output.' }
  }
}
