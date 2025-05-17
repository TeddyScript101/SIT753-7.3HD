pipeline {
    agent any

    environment {
        NODE_ENV = 'staging'
        MONGO_URI = 'mongodb://mongo:27017/dummy'
        JWT_SECRET = 'default_secret'
    }

    stages {
        stage('Build') {
            steps {
                echo 'Start Building'
                sh 'docker-compose build'
            }
        }

        stage('Test') {
            steps {
                echo 'Running Mocha tests'
                sh 'docker-compose run --rm app npm test'
            }

            post {
                always {
                    echo 'Test stage cleanup'
                }
            }
        }
    }
}
