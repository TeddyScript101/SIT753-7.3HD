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
                    sh '''
                # Download using correct URL (GitHub redirects need -L)
                curl -sSL -L https://github.com/jeremylong/DependencyCheck/releases/latest/download/dependency-check-8.2.1-release.zip -o dc.zip

                # Verify download
                if [ -f dc.zip ]; then
                    echo "Download successful"
                    unzip -q dc.zip
                    ./dependency-check/bin/dependency-check.sh \
                        --scan . \
                        --format JSON \
                        --out owasp-report.json \
                        --project "SIT753" \
                        --disableNodeJS

                    # Archive report
                    [ -f owasp-report.json ] && echo "Report generated" || echo "Report generation failed"
                else
                    echo "Download failed - falling back to npm audit"
                    npm audit --json > owasp-report.json || true
                fi

                # Always archive if file exists
                [ -f owasp-report.json ] && archiveArtifacts artifacts: 'owasp-report.json'
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
