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
        EMAIL_RECIPIENTS = 'teddyhiny@gmail.com'
    }

    stages {
        stage('Build') {
            steps {
                script {
                    def version = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.VERSION = version

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
            post {
                failure {
                    script {
                        sendFailureEmail('Build')
                    }
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
                failure {
                    script {
                        sendFailureEmail('Test')
                    }
                }
            }
        }
        stage('Code Quality') {
            steps {
                withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
                    sh 'npm run sonar'
                }
            }
            post {
                failure {
                    script {
                        sendFailureEmail('SonarQube Analysis')
                    }
                }
            }
        }

        stage('Security Scan') {
            steps {
                script {
                    echo "Running Trivy scan on ${env.IMAGE_NAME}:${env.VERSION}"
                    sh 'trivy --cache-dir /tmp/trivy-cache image --download-db-only'
                    sh """
                        trivy --cache-dir /tmp/trivy-cache image \
                          --skip-update \
                          --exit-code 0 \
                          --severity CRITICAL,HIGH \
                          ${env.IMAGE_NAME}:${env.VERSION}
                    """
                    sh 'npm audit --json > npm-audit.json || true'
                    archiveArtifacts artifacts: '*-report.json'
                }
            }
            post {
                failure {
                    script {
                        sendFailureEmail('Security Scan')
                    }
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
            post {
                failure {
                    script {
                        sendFailureEmail('Push to Docker Hub')
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
                    sleep(time: 5, unit: 'SECONDS')
                }
            }
            post {
                failure {
                    script {
                        sendFailureEmail('Deploy')
                    }
                }
            }
        }

        stage('Release') {
            steps {
                script {
                    withCredentials([usernamePassword(
                credentialsId: 'git-creds',
                usernameVariable: 'GIT_USER',
                passwordVariable: 'GIT_TOKEN'
            )]) {
                        sh """
                    git config --global user.email "jenkins@example.com"
                    git config --global user.name "Jenkins"
                    git tag "release-${env.VERSION}"
                    git push "https://${GIT_USER}:${GIT_TOKEN}@github.com/TeddyScript101/SIT753-7.3HD.git" "release-${env.VERSION}"
                """
                        echo "Git tag 'release-${env.VERSION}' created and pushed."
            }

                    withCredentials([usernamePassword(
                credentialsId: 'dockerhub-creds',
                usernameVariable: 'DOCKER_USER',
                passwordVariable: 'DOCKER_PASS'
            )]) {
                        sh '''
                    echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                    docker tag ${IMAGE_NAME}:${VERSION} ${IMAGE_NAME}:prod
                    docker push ${IMAGE_NAME}:prod
                '''
                        echo "Docker image promoted to 'prod' tag in Docker Hub."
            }

                    def releaseVerified = false
                    def maxAttempts = 5
                    def waitTime = 10

                    for (int i = 0; i < maxAttempts; i++) {
                        try {
                            sh "git ls-remote --tags origin | grep -q 'refs/tags/release-${env.VERSION}'"
                            sh '''
                        docker pull ${IMAGE_NAME}:prod
                        docker inspect ${IMAGE_NAME}:prod
                    '''
                            sh 'curl --fail http://host.docker.internal:3000/health'
                            releaseVerified = true
                            break
                } catch (Exception e) {
                            echo "Release verification attempt ${i + 1} failed. Retrying in ${waitTime}s..."
                            sleep(time: waitTime, unit: 'SECONDS')
                        }
                    }

                    if (!releaseVerified) {
                        error "Release verification failed after ${maxAttempts} attempts"
                    }
                }
            }
        }

        stage('Monitoring') {
            steps {
                script {
                    sh '''
                        # Stop ALL containers using port 19999 (including ancestors)
                        docker ps -aq --filter "publish=19999" | xargs -r docker rm -f || true
                        docker ps -aq --filter "name=netdata" | xargs -r docker rm -f || true
                        docker network prune -f || true
                        docker volume rm -f netdataconfig netdatalib netdatacache || true
                    '''

                    sleep 5

                    sh '''
                        docker run -d \
                          --name=netdata \
                          -p 19999:19999 \
                          -v netdataconfig:/etc/netdata \
                          -v netdatalib:/var/lib/netdata \
                          -v netdatacache:/var/cache/netdata \
                          -v /etc/passwd:/host/etc/passwd:ro \
                          -v /etc/group:/host/etc/group:ro \
                          -v /proc:/host/proc:ro \
                          -v /sys:/host/sys:ro \
                          -v /etc/os-release:/host/etc/os-release:ro \
                          -v /var/run/docker.sock:/var/run/docker.sock:ro \
                          --cap-add SYS_PTRACE \
                          --security-opt apparmor=unconfined \
                          netdata/netdata
                    '''

                    def healthCheckPassed = false
                    def maxAttempts = 6
                    def waitTime = 5

                    for (int i = 0; i < maxAttempts; i++) {
                        try {
                            sh 'curl --fail http://host.docker.internal:3000/health'
                            echo 'Health check passed.'
                            healthCheckPassed = true
                            break
                        } catch (Exception e) {
                            echo "Attempt ${i + 1} failed. Retrying in ${waitTime} seconds..."
                            sleep(waitTime)
                        }
                    }

                    if (!healthCheckPassed) {
                        error "Health check failed after ${maxAttempts} attempts. Aborting pipeline."
                    }
                }
            }
            post {
                failure {
                    script {
                        sendFailureEmail('Monitoring / Health Check')
                    }
                }
            }
        }
    }

    post {
        failure {
            script {
                sendFailureEmail('Pipeline Failure')
            }
        }
        success {
            script {
                sendSuccessEmail()
            }
        }
    }
}

def sendFailureEmail(String stageName) {
    emailext(
        subject: "FAILURE: ${stageName} - ${env.JOB_NAME} [${env.BUILD_NUMBER}]",
        body: """\
             The '${stageName}' stage failed in Jenkins.
             Job: ${env.JOB_NAME}
             Build Number: ${env.BUILD_NUMBER}
             Stage: ${stageName}
             URL: ${env.BUILD_URL}
             """,
        to: "${env.EMAIL_RECIPIENTS}",
        attachLog: true,
        compressLog: true
    )
}

def sendSuccessEmail() {
    emailext(
        subject: "SUCCESS: ${env.JOB_NAME} [${env.BUILD_NUMBER}]",
        body: """\
            The Jenkins pipeline completed successfully.
            Job: ${env.JOB_NAME}
            Build Number: ${env.BUILD_NUMBER}
            URL: ${env.BUILD_URL}
            """,
        to: "${env.EMAIL_RECIPIENTS}",
        attachLog: true,
        compressLog: true
    )
}
