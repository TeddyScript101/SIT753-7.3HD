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
                echo 'Start Building'
                sh 'npm install'
                archiveArtifacts artifacts: 'package.json,package-lock.json,dist/**'
            }
        }

        stage('Test') {
            steps {
                echo 'Running Mocha tests'
                script {
                    //todo: write more test
                    sh 'npm test'
                }
            }

            post {
                always {
                    echo 'Test stage cleanup'
                }
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying to staging environment...'

                script {
                    sh '''
                        docker rm -f $CONTAINER_NAME || true
                        docker build -t $IMAGE_NAME .
                        docker run -d \
                            --name $CONTAINER_NAME \
                            -e NODE_ENV=$NODE_ENV \
                            -e MONGO_URI=$MONGO_URI \
                            -e JWT_SECRET=$JWT_SECRET \
                            -p 3000:3000 \
                            $IMAGE_NAME
                    '''
                }
            }
        }
    }
}

