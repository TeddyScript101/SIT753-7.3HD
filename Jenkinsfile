pipeline {
    agent any

    environment {
        NODE_ENV = 'staging'
    }

    stages {
        stage('Build') {
            steps {
                echo 'Start Building'
                sh 'npm install'
                archiveArtifacts artifacts: 'package.json,package-lock.json,dist/**'
            }
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

    post {
        always {
            sh 'docker-compose -f docker-compose.staging.yml down || true'
        }
    }
}
