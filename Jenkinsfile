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
                script {
                    def version = sh(script: 'git describe --tags --always', returnStdout: true).trim()
                    sh "docker build -t ${IMAGE_NAME}:${version} ."
                    sh "docker push ${IMAGE_NAME}:${version}"
                }
                archiveArtifacts artifacts: '**/dist/*'
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
                echo 'Deploying with Docker Compose...'
                script {
                    sh '''
                        docker-compose down --remove-orphans || true
                        docker-compose build
                        docker-compose up -d
                    '''
                }
            }
        }
    }
}
