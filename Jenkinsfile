pipeline {
    agent {
        docker {
            image 'node:18-bullseye'
            args '''
                -v /tmp/mongodb-memory-server:/tmp/mongodb-memory-server
                -v /var/run/docker.sock:/var/run/docker.sock
                --ulimit nofile=64000:64000
            '''
        }
    }

    environment {
        NODE_ENV = 'staging'
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
    }

    post {
        always {
            sh 'docker-compose -f docker-compose.staging.yml down || true'
        }
    }
}
