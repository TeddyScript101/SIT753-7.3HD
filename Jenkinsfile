pipeline {
    agent any

    environment {
        NODE_ENV = 'staging'
        MONGO_URI = 'mongodb://localhost:27017/dummy'
        JWT_SECRET = 'default_secret'
    }

    stages {
        stage('Build') {
            steps {
                echo 'Start Building'
                sh 'npm install'
                archiveArtifacts artifacts: 'package.json,package-lock.json,dist/**'
            }
        }

        stage('Test') {
            steps {
                echo 'Running Mocha tests'
                script {
                    sh 'npm test'
                }
            }

            post {
                always {
                    echo 'Test stage cleanup'
                }
            }
        }
    }
}
