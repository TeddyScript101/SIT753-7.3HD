pipeline {
    agent any

    tools {
        git 'Default'
    }

    environment {
        NODE_ENV = 'staging'
        MONGO_URI = 'mongodb://host.docker.internal:27017/dummy'
        JWT_SECRET = 'default_secret'
        IMAGE_NAME = 'teddyhiny/sit753-staging'
        CONTAINER_NAME = 'sit753-container'
    }

    stages {
        stage('Build') {
            steps {
                script {
                    // Get the git commit hash to use as version tag
                    def version = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()

                    withCredentials([usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh """
                            echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
                            docker build -t ${env.IMAGE_NAME}:${version} .
                            docker push ${env.IMAGE_NAME}:${version}
                        """
                    }
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

        stage('Security') {
            steps {
                echo 'Running security scan'
                script {
                    sh 'npm audit --force'
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
