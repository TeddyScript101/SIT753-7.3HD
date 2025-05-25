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
                echo 'Deploying Netdata Monitoring Stack...'
                script {
                    sh '''
                        echo "Bringing up Netdata container..."
                        docker ps | grep netdata && docker rm -f netdata || true

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
                }
            }
        }
    }
}
