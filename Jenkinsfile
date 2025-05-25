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
                script {
                    try {
                        // Option 1: Use pre-installed Trivy (recommended)
                        sh '''
                    # Verify Trivy exists
                    if ! command -v trivy &> /dev/null; then
                        echo "Trivy not found, falling back to OWASP"
                        exit 1
                    fi

                    # Run Trivy scan
                    trivy image --format json --output trivy-report.json --severity HIGH,CRITICAL ${IMAGE_NAME}

                    # Check for critical vulnerabilities
                    if jq -e '.Results[].Vulnerabilities[] | select(.Severity == "CRITICAL")' trivy-report.json; then
                        echo "Critical vulnerabilities found!"
                        currentBuild.result = 'UNSTABLE'
                    fi

                    # Archive report
                    archiveArtifacts artifacts: 'trivy-report.json'
                '''
            } catch (Exception e) {
                        // Fallback to OWASP if Trivy fails
                        echo 'Falling back to OWASP Dependency-Check'
                        sh '''
                    curl -sSL -L https://github.com/jeremylong/DependencyCheck/releases/download/v8.2.1/dependency-check-8.2.1-release.zip -o dc.zip
                    unzip -q dc.zip
                    ./dependency-check/bin/dependency-check.sh \
                        --scan . \
                        --format JSON \
                        --out security-report.json \
                        --project "SIT753"
                    archiveArtifacts artifacts: 'security-report.json'
                '''
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
    }
}
