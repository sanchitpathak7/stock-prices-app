# Stock Prices App
A real-time web application that displays the top 10 stock prices with data from Alpha Vantage. This application is designed to be deployed on DigitalOcean Kubernetes Service (DOKS) with horizontal pod autoscaling and load balancing.

## Features
- Real-time stock price data display for top 10 companies
- Automatic data refresh every 60 seconds (with toggle option)
- Manual refresh button for on-demand updates
- Color-coded price changes (green for positive, red for negative)
- DigitalOcean Kubernetes deployment with horizontal pod autoscaling
- LoadBalancer configuration for traffic distribution

## Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express
- **Containerization**: Docker
- **Orchestration**: Kubernetes on DigitalOcean (DOKS)
- **Autoscaling**: Kubernetes Horizontal Pod Autoscaler (HPA)
- **Load Balancing**: DigitalOcean Load Balancer

## Prerequisites
- DigitalOcean account
- `doctl` CLI installed and authenticated
- `kubectl` CLI installed
- Docker installed and configured
- Docker Hub account or another container registry

![Architecture](https://github.com/user-attachments/assets/f07c5f9e-0c5c-4bcb-8490-812906b71ceb)

### Setting Up the Project
```bash
# Clone the repository
git clone https://github.com/yourusername/stock-prices-app.git
cd stock-prices-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at http://localhost:3000

### Using Docker Compose for Local Development
```bash
# Start the application with Docker Compose
docker-compose up

# Build and start in detached mode
docker-compose up -d --build
```

## Deployment
### Building and Pushing the Docker Image
```bash
# Build the Docker image
docker build -t yourusername/stock-prices-app:latest .

# Push the image to Docker Hub
docker push yourusername/stock-prices-app:latest
```

### Deploying to DigitalOcean Kubernetes
1. Create a Kubernetes cluster:
```bash
doctl kubernetes cluster create stock-prices-cluster \
  --region nyc1 \
  --size s-2vcpu-4gb \
  --count 2 \
  --auto-upgrade=true

doctl kubernetes cluster kubeconfig save stock-prices-cluster
```

2. Deploy the application:
```bash
# Update the Docker image in k8s/deployment.yaml with your Docker Hub username
# Then apply the Kubernetes configurations
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml
kubectl create secret generic stock-api-keys --from-literal=alpha-vantage-key=<API_KEY>
```

3. Access the application:
```bash
# Get the external IP
kubectl get service stock-prices-service

# The application will be available at http://<EXTERNAL-IP>
```

![U/I](https://github.com/user-attachments/assets/00d1855f-458a-46f6-8dde-2a537174b836)