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
                    // Use platform-compatible OWASP image
                    sh '''
                # Create cache directory if it doesn't exist
                mkdir -p odc-cache

                # Run platform-specific OWASP scan
                docker run --rm \
                    --platform linux/amd64 \
                    -v "$PWD:/src" \
                    -v "$PWD/odc-cache:/usr/share/dependency-check/data" \
                    owasp/dependency-check:8.2.1 \
                    --scan /src \
                    --format JSON \
                    --out /src/security-report.json \
                    --project "SIT753" \
                    --disableNodeAudit \
                    --disableYarnAudit \
                    --disableNodeJS \
                    --noupdate

                # Generate simplified report
                jq '.dependencies[] | select(.vulnerabilities != null)' security-report.json > vulnerabilities.json || echo "No vulnerabilities found"

                # Archive both reports
                archiveArtifacts artifacts: '*-report.json, vulnerabilities.json'
            '''
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
