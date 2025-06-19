# VIB3 - Vertical Video Social Platform

A modern, full-stack video sharing platform built with Node.js, supporting web and mobile applications with cloud deployment options.

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start development server
vib3 deploy web local --port 3000
```

### Deploy to Cloud
```bash
# Deploy to DigitalOcean (recommended)
vib3 deploy web digitalocean --env prod

# Deploy to AWS
vib3 deploy web aws --env prod

# Check deployment status
vib3 deploy status
```

## 📋 Features

- **Video Sharing**: Upload, stream, and share short-form videos
- **Social Features**: Like, comment, follow, and share
- **Multi-Platform**: Web app, iOS, and Android support
- **Cloud Storage**: S3-compatible storage for videos
- **Real-time**: Live interactions and notifications
- **Responsive**: Mobile-first design

## 🏗️ Architecture

```
Frontend (www/) - React/HTML5 web application
├── Mobile Apps - Capacitor-based iOS/Android
├── Backend (server.js) - Node.js REST API
├── Database - PostgreSQL/MySQL
└── Storage - S3/Spaces for video files
```

## 🛠️ CLI Commands

### Deployment Commands
```bash
# Deploy web application
vib3 deploy web <provider> [--env <env>] [--port <port>]

# Manage deployment configuration
vib3 deploy config <action> [--key <key>] [--value <value>]

# Check deployment status
vib3 deploy status [--provider <provider>]
```

### File Operations
```bash
# Upload files to S3
vib3 upload <file> <bucket> [--key <key>] [--region <region>]

# Download files from S3
vib3 download <bucket> <key> [--output <file>] [--region <region>]
```

### Utility Commands
```bash
# Hello world example
vib3 hello [name]

# List items
vib3 list [items...]

# Show configuration
vib3 config [--show]
```

## 🌩️ Cloud Deployment Options

### DigitalOcean (Recommended - $30-45/month)
- **App Platform**: Easy deployment with GitHub integration
- **Spaces**: S3-compatible storage with CDN
- **Managed Database**: PostgreSQL with automated backups
- **Setup Guide**: See [setup-digitalocean.md](setup-digitalocean.md)

### AWS (Scalable - $40-100+/month)
- **S3 + CloudFront**: Static site hosting with CDN
- **EC2/ECS**: Container-based backend hosting
- **RDS**: Managed database service

### Oracle Cloud (Free Tier Available)
- **Always Free**: 2 AMD compute instances
- **Object Storage**: 20GB free storage
- **Autonomous Database**: 20GB free database

## 📱 Mobile Apps

The project includes mobile app versions built with Capacitor:

### iOS App (`ios/`)
- Native iOS application
- Built with Capacitor and Xcode
- Supports camera integration and push notifications

### Android App (`android/`)
- Native Android application
- Built with Capacitor and Android Studio
- Google Play Store ready

## 🔧 Development Setup

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+ (for CLI)
- Git

### Installation
```bash
# Clone repository
git clone <your-repo>
cd vib3

# Install Python CLI dependencies
pip install -r requirements.txt

# Install Node.js dependencies
npm install

# Install CLI globally
pip install -e .
```

### Environment Variables
```bash
# Required for production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
DO_SPACES_KEY=your_spaces_key
DO_SPACES_SECRET=your_spaces_secret
DO_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=vib3-prod-videos
```

## 🧪 Testing

```bash
# Run all tests
python -m pytest test_vib3_cli.py -v

# Run specific test category
python -m pytest test_vib3_cli.py::TestDeployCommand -v

# Run with coverage
python -m pytest test_vib3_cli.py --cov=vib3_cli
```

## 📁 Project Structure

```
vib3/
├── www/                    # Web application frontend
│   ├── index.html         # Main page
│   ├── app.js            # Application logic
│   └── styles.css        # Styling
├── android/               # Android mobile app
├── ios/                   # iOS mobile app
├── server.js             # Node.js backend server
├── vib3_cli.py           # Python CLI application
├── test_vib3_cli.py      # Test suite
├── requirements.txt      # Python dependencies
├── package.json          # Node.js dependencies
├── setup.py              # Python package setup
└── setup-digitalocean.md # Deployment guide
```

## 🚀 Deployment Guide

### Step 1: Prepare Your Code
```bash
# Ensure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Choose Your Platform
```bash
# For beginners - DigitalOcean
vib3 deploy web digitalocean --env prod

# For AWS users
vib3 deploy web aws --env prod

# For local testing
vib3 deploy web local --port 3000
```

### Step 3: Configure Environment
```bash
# Set deployment configuration
vib3 deploy config set --key database_url --value "your_db_url"
vib3 deploy config set --key spaces_key --value "your_key"
```

### Step 4: Monitor Deployment
```bash
# Check status
vib3 deploy status

# View specific provider
vib3 deploy status --provider digitalocean
```

## 📊 Cost Comparison

| Platform | Monthly Cost | Best For |
|----------|-------------|----------|
| DigitalOcean | $30-45 | Startups, predictable pricing |
| AWS | $40-100+ | Enterprise, high scale |
| Oracle Cloud | $0-30 | Development, free tier |
| Local | $0 | Development only |

## 🔒 Security Features

- **HTTPS**: Automatic SSL certificates
- **CORS**: Configured cross-origin policies
- **Authentication**: Firebase Auth integration
- **File Upload**: Secure multipart uploads
- **API Rate Limiting**: Built-in protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Documentation**: Check platform-specific guides
- **CLI Help**: Run `vib3 --help` for command reference

## 🎯 Roadmap

- [ ] Real-time video streaming
- [ ] Advanced video editing
- [ ] Live streaming capabilities
- [ ] Enhanced social features
- [ ] AI-powered content recommendations
- [ ] Multi-language support