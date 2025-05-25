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
                    // Health check for the deployed application
                    echo 'Starting application health checks...'

                    // Option 1: Simple curl health check (adjust URL/port as needed)
                    sh '''
                echo "Waiting 15 seconds for app to start..."
                sleep 15
                curl -s http://localhost:3000/health || echo "Health check failed"
            '''

                    // Option 2: Container metrics monitoring (using built-in Docker stats)
                    sh '''
                echo "Container metrics:"
                docker stats ${env.CONTAINER_NAME} --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

                echo "Container logs (last 10 lines):"
                docker logs ${env.CONTAINER_NAME} --tail 10
            '''

                // Option 3: Prometheus endpoint check (if you have /metrics endpoint)
                // sh 'curl -s http://localhost:3000/metrics | head -n 5'
                }
            }
        }
    }
}
