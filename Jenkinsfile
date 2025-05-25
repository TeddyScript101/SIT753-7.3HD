pipeline {
    agent any

    tools {
        git 'System-Git'
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
                    env.VERSION = version  // Save for later stages

                    withCredentials([usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh """
                            echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
                            docker build -t ${env.IMAGE_NAME}:${version} .
                        """
                    }
                }
            }
        }

        stage('Security Scan') {
            steps {
                script {
                    echo "Running Trivy scan on ${env.IMAGE_NAME}:${env.VERSION}"
                    sh "trivy image --exit-code 0 --severity CRITICAL,HIGH ${env.IMAGE_NAME}:${env.VERSION}"

                    sh 'npm audit --json > npm-audit.json || true'

                    archiveArtifacts artifacts: '*-report.json'
                }
            }
        }

        stage('Test') {
            steps {
                echo 'Running Mocha Unit tests and Integration tests...'
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

                stage('SonarQube Analysis') {
            steps {
                withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
                    sh 'npm run sonar'
                }
            }
                }

        stage('Push to Docker Hub') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh """
                            echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
                            docker push ${env.IMAGE_NAME}:${env.VERSION}
                        """
                    }
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
        stage('Monitoring') {
            steps {
                script {
                    echo 'Starting container health checks...'

                    // Get the actual container name from docker-compose
                    def containerName = sh(
                script: 'docker-compose ps -q app',
                returnStdout: true
            ).trim()

                    // 1. Check if container is running
                    sh """
                echo "Checking container status..."
                docker inspect -f '{{.State.Running}}' ${containerName} || echo "Container not running"
            """

                    // 2. Check container health via exec
                    sh """
                echo "Checking application health..."
                docker exec ${containerName} curl -s http://localhost:3000/health || \
                echo "Health check failed - check container logs below"

                echo "Container logs (last 20 lines):"
                docker logs --tail 20 ${containerName}

                echo "Resource usage:"
                docker stats ${containerName} --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
            """
                }
            }
        }
    }
}
