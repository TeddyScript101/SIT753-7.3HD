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

    post {
        always {
            sh 'docker-compose -f docker-compose.staging.yml down || true'
        }
    }
}
