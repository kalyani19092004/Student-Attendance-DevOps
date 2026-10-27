
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                bat 'node --version'
                bat 'npm.cmd --version'
                bat 'npm.cmd install'
            }
        }

        stage('Validation') {
            steps {
                bat 'node --check server.js'
                bat 'node --check public/app.js'
                echo 'JavaScript validation completed successfully.'
            }
        }
    }

    post {
        success {
            echo 'Build completed successfully!'
        }
        failure {
            echo 'Build failed. Check the Console Output.'
        }
    }
}
