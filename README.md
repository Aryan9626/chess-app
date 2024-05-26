# Chess Application
---
This project sets up a multiplayer chess game with a React frontend, a Node.js backend, and a MySQL database. It uses Docker for containerization and Ansible for orchestration. The project includes an ELK stack for logging and monitoring, enhancing operational visibility and troubleshooting.

## Features

- Multiplayer chess game logic.
- User authentication and session management.
- Real-time game state management using WebSockets.
- Comprehensive logging via Elasticsearch, Logstash, and Kibana (ELK stack).
- Monitoring of Docker container logs using Filebeat.

## Prerequisites

- Docker
- Docker Compose
- Ansible
- Node.js and npm
- Jenkins (for CI/CD pipeline)

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aryan9626/chess-app.git
   cd chess-app
   ```

2. **Build and run the Docker containers:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Chess frontend available at `http://localhost:3000`
   - Kibana dashboard for logs at `http://localhost:5601`

## Architecture

### Components

- **Chess Frontend**: Served by a React application providing the user interface.
- **Chess Backend**: A Node.js server handling game logic and player interactions.
- **MySQL Database**: Stores user and game state information.
- **ELK Stack**: Elasticsearch for storage, Logstash for processing, and Kibana for visualizing logs.
- **Filebeat**: Monitors and forwards logs from Docker containers to Logstash.

### Network

All components communicate over a dedicated Docker network, ensuring isolated and secure interactions.

## Deployment

Deployment is managed through an Ansible playbook that automates the setup of Docker containers and networks. The playbook handles pulling images, configuring environments, and ensuring that all components are linked correctly.

## Monitoring and Logging

- **Elasticsearch**: Stores logs for analysis.
- **Logstash**: Processes and enhances logs before passing to Elasticsearch.
- **Kibana**: Provides a dashboard to visualize and query logs.
- **Filebeat**: Collects logs from Docker containers.

## CI/CD

Jenkins is used to automate the deployment process:
- Builds Docker images for frontend and backend.
- Pushes images to DockerHub.
- Deploys images using Ansible.

## Configuration Files

- `docker-compose.yml`: Defines how Docker containers are built, run, and interconnect.
- `ansible-playbook.yml`: Orchestrates the deployment and management of all services.
- `filebeat.yml`: Configures log collection from Docker containers.
- `logstash.conf`: Defines the processing rules for logs before they are sent to Elasticsearch.
