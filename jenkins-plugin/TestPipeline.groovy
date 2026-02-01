pipeline {
    agent any

    stages {
        stage('Initialize') {
            steps {
                echo 'Checking out code...'
            }
        }
        
        stage('Build') {
            steps {
                echo 'Compiling project...'
                // Small delay to simulate work
                sleep 2
            }
        }

        stage('Test') {
            steps {
                echo 'Running unit tests...'
                sh 'echo "Tests passed!"'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying to staging...'
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished. CI-Insight plugin will now automatically push this data!'
        }
    }
}
