pipeline {
    agent any

    environment {
        FRONTEND_IMAGE = 'aryan9626/chess_app_pipeline-chess-frontend'
        BACKEND_IMAGE = 'aryan9626/chess_app_pipeline-chess-backend'
    }

    stages {
        stage('Clone Repository') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    doGenerateSubmoduleConfigurations: false,
                    extensions: [],
                    submoduleCfg: [],
                    userRemoteConfigs: [[url: 'https://github.com/Aryan9626/chess-app.git']]
                ])
            }
        }
        stage('Docker Cleanup') {
            steps {
                script {
                    // Clean up Docker containers, volumes, and networks to ensure a fresh start
                    sh 'docker container prune -f'
                    sh 'docker volume prune -f'
                    sh 'docker network prune -f'
                    sh 'docker image prune -f'
                }
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                script {
                    docker.build("$FRONTEND_IMAGE", "./client")
                }
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                script {
                    docker.build("$BACKEND_IMAGE", "./server")
                }
            }
        }

        stage('Push Docker Images to DockerHub') {
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', '25a17427-796d-420c-bb6c-77bacfc2a2ea') {
                        docker.image("$FRONTEND_IMAGE").push('latest')
                        docker.image("$BACKEND_IMAGE").push('latest')
                    }
                }
            }
        }

        stage('Pull Docker Image of Nodes using ansible') {
            steps {
                ansiblePlaybook becomeUser: null, colorized: true, disableHostKeyChecking: true, inventory: './inventory',
                playbook: './docker-deploy.yml', sudoUser: null, vaultTmpPath: ''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}