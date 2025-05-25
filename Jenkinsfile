pipeline {
    agent any

    environment {
        NODE_ENV = 'staging'
        MONGO_URI = 'mongodb://host.docker.internal:27017/dummy'
        JWT_SECRET = 'default_secret'
        IMAGE_NAME = 'sit753-staging'
        CONTAINER_NAME = 'sit753-container'
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
        stage('Security') {
            steps {
                echo 'Running security scan'
                script {
                    sh 'npm audit'
                }
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying to staging environment...'

                script {
                    sh '''
                        docker compose down || true
                        docker compose build
                        docker compose up -d
                    '''
                }
                }
            }
        }
    }
}

