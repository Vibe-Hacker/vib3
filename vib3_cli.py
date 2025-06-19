#!/usr/bin/env python3
"""
VIB3 Command Line Application
A simple CLI tool for Project VIB3
"""

import sys
import argparse
import os
from typing import Optional, List
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
import subprocess
import json
import time


class VIB3CLI:
    """Main CLI application class for VIB3."""
    
    def __init__(self):
        """Initialize the CLI application."""
        self.parser = self._create_parser()
    
    def _create_parser(self) -> argparse.ArgumentParser:
        """Create and configure the argument parser."""
        parser = argparse.ArgumentParser(
            prog='vib3',
            description='VIB3 Command Line Interface',
            epilog='For more information, visit the project documentation.'
        )
        
        parser.add_argument(
            '--version',
            action='version',
            version='%(prog)s 1.0.0'
        )
        
        subparsers = parser.add_subparsers(
            dest='command',
            help='Available commands'
        )
        
        # Add 'hello' command
        hello_parser = subparsers.add_parser(
            'hello',
            help='Print a greeting message'
        )
        hello_parser.add_argument(
            'name',
            nargs='?',
            default='World',
            help='Name to greet (default: World)'
        )
        
        # Add 'list' command
        list_parser = subparsers.add_parser(
            'list',
            help='List items'
        )
        list_parser.add_argument(
            '--items',
            nargs='+',
            default=['item1', 'item2', 'item3'],
            help='Items to list'
        )
        
        # Add 'config' command
        config_parser = subparsers.add_parser(
            'config',
            help='Show configuration'
        )
        config_parser.add_argument(
            '--show',
            action='store_true',
            help='Show current configuration'
        )
        
        # Add 'upload' command
        upload_parser = subparsers.add_parser(
            'upload',
            help='Upload file to S3'
        )
        upload_parser.add_argument(
            'file',
            help='Path to file to upload'
        )
        upload_parser.add_argument(
            'bucket',
            help='S3 bucket name'
        )
        upload_parser.add_argument(
            '--key',
            help='S3 key (defaults to filename)'
        )
        upload_parser.add_argument(
            '--region',
            default='us-east-1',
            help='AWS region (default: us-east-1)'
        )
        
        # Add 'download' command
        download_parser = subparsers.add_parser(
            'download',
            help='Download file from S3'
        )
        download_parser.add_argument(
            'bucket',
            help='S3 bucket name'
        )
        download_parser.add_argument(
            'key',
            help='S3 key (file path in bucket)'
        )
        download_parser.add_argument(
            '--output',
            help='Output file path (defaults to key basename)'
        )
        download_parser.add_argument(
            '--region',
            default='us-east-1',
            help='AWS region (default: us-east-1)'
        )
        
        # Add 'deploy' command
        deploy_parser = subparsers.add_parser(
            'deploy',
            help='Deploy web application'
        )
        deploy_subparsers = deploy_parser.add_subparsers(
            dest='deploy_command',
            help='Deployment commands'
        )
        
        # Deploy web subcommand
        deploy_web_parser = deploy_subparsers.add_parser(
            'web',
            help='Deploy web application to cloud provider'
        )
        deploy_web_parser.add_argument(
            'provider',
            choices=['aws', 'oracle', 'digitalocean', 'local'],
            help='Cloud provider to deploy to'
        )
        deploy_web_parser.add_argument(
            '--env',
            choices=['dev', 'staging', 'prod'],
            default='dev',
            help='Environment to deploy to (default: dev)'
        )
        deploy_web_parser.add_argument(
            '--port',
            type=int,
            default=3000,
            help='Port for local deployment (default: 3000)'
        )
        
        # Deploy config subcommand
        deploy_config_parser = deploy_subparsers.add_parser(
            'config',
            help='Manage deployment configurations'
        )
        deploy_config_parser.add_argument(
            'action',
            choices=['show', 'set', 'get'],
            help='Configuration action'
        )
        deploy_config_parser.add_argument(
            '--key',
            help='Configuration key (for set/get actions)'
        )
        deploy_config_parser.add_argument(
            '--value',
            help='Configuration value (for set action)'
        )
        
        # Deploy status subcommand
        deploy_status_parser = deploy_subparsers.add_parser(
            'status',
            help='Check deployment status'
        )
        deploy_status_parser.add_argument(
            '--provider',
            choices=['aws', 'oracle', 'digitalocean', 'local'],
            help='Cloud provider to check'
        )
        
        return parser
    
    def hello_command(self, name: str) -> None:
        """Execute the hello command."""
        print(f"Hello, {name}!")
    
    def list_command(self, items: List[str]) -> None:
        """Execute the list command."""
        print("Items:")
        for i, item in enumerate(items, 1):
            print(f"  {i}. {item}")
    
    def config_command(self, show: bool) -> None:
        """Execute the config command."""
        if show:
            print("Configuration:")
            print("  Version: 1.0.0")
            print("  Project: VIB3")
            print("  Type: Command Line Application")
        else:
            print("Use --show to display configuration")
    
    def upload_command(self, file: str, bucket: str, key: Optional[str], region: str) -> None:
        """Execute the upload command."""
        if not os.path.exists(file):
            raise FileNotFoundError(f"File not found: {file}")
        
        if not os.path.isfile(file):
            raise ValueError(f"Not a file: {file}")
        
        # Use filename as key if not specified
        if key is None:
            key = os.path.basename(file)
        
        # Initialize S3 client
        s3_client = boto3.client('s3', region_name=region)
        
        try:
            # Get file size for progress tracking
            file_size = os.path.getsize(file)
            print(f"Uploading {file} ({file_size:,} bytes) to s3://{bucket}/{key}")
            
            # Progress tracking variables
            uploaded_bytes = 0
            
            def upload_callback(bytes_amount):
                nonlocal uploaded_bytes
                uploaded_bytes += bytes_amount
                percentage = (uploaded_bytes / file_size) * 100
                print(f"\rProgress: {percentage:.1f}% ({uploaded_bytes:,}/{file_size:,} bytes)", end='', flush=True)
            
            # Upload file with progress callback
            s3_client.upload_file(
                file, 
                bucket, 
                key,
                Callback=upload_callback
            )
            
            print(f"\nSuccessfully uploaded to s3://{bucket}/{key}")
            
        except NoCredentialsError:
            raise RuntimeError("AWS credentials not found. Please configure your AWS credentials.")
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            if error_code == 'NoSuchBucket':
                raise RuntimeError(f"Bucket '{bucket}' does not exist")
            elif error_code == 'AccessDenied':
                raise RuntimeError(f"Access denied to bucket '{bucket}'")
            else:
                raise RuntimeError(f"S3 error: {str(e)}")
    
    def download_command(self, bucket: str, key: str, output: Optional[str], region: str) -> None:
        """Execute the download command."""
        # Use key basename as output if not specified
        if output is None:
            output = os.path.basename(key)
        
        # Check if output file already exists
        if os.path.exists(output):
            response = input(f"File '{output}' already exists. Overwrite? (y/N): ")
            if response.lower() != 'y':
                print("Download cancelled.")
                return
        
        # Initialize S3 client
        s3_client = boto3.client('s3', region_name=region)
        
        try:
            # Get object metadata to determine file size
            response = s3_client.head_object(Bucket=bucket, Key=key)
            file_size = response['ContentLength']
            print(f"Downloading s3://{bucket}/{key} ({file_size:,} bytes) to {output}")
            
            # Progress tracking variables
            downloaded_bytes = 0
            
            def download_callback(bytes_amount):
                nonlocal downloaded_bytes
                downloaded_bytes += bytes_amount
                percentage = (downloaded_bytes / file_size) * 100
                print(f"\rProgress: {percentage:.1f}% ({downloaded_bytes:,}/{file_size:,} bytes)", end='', flush=True)
            
            # Download file with progress callback
            s3_client.download_file(
                bucket,
                key,
                output,
                Callback=download_callback
            )
            
            print(f"\nSuccessfully downloaded to {output}")
            
        except NoCredentialsError:
            raise RuntimeError("AWS credentials not found. Please configure your AWS credentials.")
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            if error_code == 'NoSuchBucket':
                raise RuntimeError(f"Bucket '{bucket}' does not exist")
            elif error_code == 'NoSuchKey':
                raise RuntimeError(f"Key '{key}' does not exist in bucket '{bucket}'")
            elif error_code == 'AccessDenied':
                raise RuntimeError(f"Access denied to s3://{bucket}/{key}")
            else:
                raise RuntimeError(f"S3 error: {str(e)}")
    
    def deploy_command(self, args) -> None:
        """Execute the deploy command."""
        if args.deploy_command == 'web':
            self._deploy_web(args.provider, args.env, args.port)
        elif args.deploy_command == 'config':
            self._deploy_config(args.action, args.key, args.value)
        elif args.deploy_command == 'status':
            self._deploy_status(args.provider)
        else:
            print("Please specify a deploy subcommand: web, config, or status")
    
    def _deploy_web(self, provider: str, env: str, port: int) -> None:
        """Deploy web application to specified provider."""
        print(f"Deploying web application to {provider} ({env} environment)...")
        
        if provider == 'local':
            self._deploy_local(port)
        elif provider == 'aws':
            self._deploy_aws(env)
        elif provider == 'oracle':
            self._deploy_oracle(env)
        elif provider == 'digitalocean':
            self._deploy_digitalocean(env)
    
    def _deploy_local(self, port: int) -> None:
        """Deploy web application locally."""
        try:
            # Check if server.js exists
            if not os.path.exists('server.js'):
                raise RuntimeError("server.js not found in current directory")
            
            # Check if node is installed
            result = subprocess.run(['node', '--version'], capture_output=True, text=True)
            if result.returncode != 0:
                raise RuntimeError("Node.js is not installed")
            
            print(f"Starting local server on port {port}...")
            
            # Install dependencies if needed
            if os.path.exists('package.json') and not os.path.exists('node_modules'):
                print("Installing dependencies...")
                subprocess.run(['npm', 'install'], check=True)
            
            # Start the server
            env = os.environ.copy()
            env['PORT'] = str(port)
            
            print(f"Server starting at http://localhost:{port}")
            print("Press Ctrl+C to stop the server")
            
            subprocess.run(['node', 'server.js'], env=env)
            
        except FileNotFoundError as e:
            raise RuntimeError(f"Required file not found: {e}")
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Command failed: {e}")
    
    def _deploy_aws(self, env: str) -> None:
        """Deploy web application to AWS."""
        print(f"Deploying to AWS ({env})...")
        
        # Check for AWS CLI
        result = subprocess.run(['aws', '--version'], capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError("AWS CLI is not installed")
        
        # Check for required files
        if not os.path.exists('www'):
            raise RuntimeError("www directory not found")
        
        # Get or create S3 bucket name
        bucket_name = f"vib3-{env}-{int(time.time())}"
        region = 'us-east-1'
        
        try:
            # Create S3 bucket
            print(f"Creating S3 bucket: {bucket_name}")
            s3_client = boto3.client('s3', region_name=region)
            
            if region == 'us-east-1':
                s3_client.create_bucket(Bucket=bucket_name)
            else:
                s3_client.create_bucket(
                    Bucket=bucket_name,
                    CreateBucketConfiguration={'LocationConstraint': region}
                )
            
            # Enable static website hosting
            s3_client.put_bucket_website(
                Bucket=bucket_name,
                WebsiteConfiguration={
                    'IndexDocument': {'Suffix': 'index.html'},
                    'ErrorDocument': {'Key': 'error.html'}
                }
            )
            
            # Set bucket policy for public read
            bucket_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Sid": "PublicReadGetObject",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": f"arn:aws:s3:::{bucket_name}/*"
                }]
            }
            
            s3_client.put_bucket_policy(
                Bucket=bucket_name,
                Policy=json.dumps(bucket_policy)
            )
            
            # Upload files
            print("Uploading files to S3...")
            for root, dirs, files in os.walk('www'):
                for file in files:
                    file_path = os.path.join(root, file)
                    s3_key = os.path.relpath(file_path, 'www')
                    
                    # Determine content type
                    content_type = 'text/html' if file.endswith('.html') else \
                                   'text/css' if file.endswith('.css') else \
                                   'application/javascript' if file.endswith('.js') else \
                                   'application/octet-stream'
                    
                    s3_client.upload_file(
                        file_path,
                        bucket_name,
                        s3_key,
                        ExtraArgs={'ContentType': content_type}
                    )
            
            website_url = f"http://{bucket_name}.s3-website-{region}.amazonaws.com"
            print(f"\nDeployment successful!")
            print(f"Website URL: {website_url}")
            
            # Save deployment info
            self._save_deployment_info('aws', {
                'bucket': bucket_name,
                'region': region,
                'url': website_url,
                'env': env,
                'timestamp': time.time()
            })
            
        except Exception as e:
            raise RuntimeError(f"AWS deployment failed: {e}")
    
    def _deploy_oracle(self, env: str) -> None:
        """Deploy web application to Oracle Cloud."""
        print(f"Deploying to Oracle Cloud ({env})...")
        
        # Check for OCI CLI
        result = subprocess.run(['oci', '--version'], capture_output=True, text=True)
        if result.returncode != 0:
            print("OCI CLI not found. Please install Oracle Cloud CLI.")
            print("Visit: https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm")
            return
        
        print("Oracle Cloud deployment requires additional configuration.")
        print("Please ensure you have:")
        print("1. OCI CLI configured with your credentials")
        print("2. A compute instance or container registry set up")
        print("3. Appropriate security lists and networking configured")
        
        # Placeholder for Oracle Cloud deployment
        print("\nTo deploy manually:")
        print("1. Create an Object Storage bucket")
        print("2. Upload the www/ directory contents")
        print("3. Configure the bucket for static website hosting")
        print("4. Or deploy to a compute instance with the Node.js server")
    
    def _deploy_digitalocean(self, env: str) -> None:
        """Deploy web application to DigitalOcean."""
        print(f"Deploying to DigitalOcean ({env})...")
        
        # Check for doctl CLI
        result = subprocess.run(['doctl', 'version'], capture_output=True, text=True)
        if result.returncode != 0:
            print("DigitalOcean CLI (doctl) not found.")
            print("Please install it from: https://docs.digitalocean.com/reference/doctl/how-to/install/")
            print("\nAlternatively, you can deploy manually:")
            self._show_digitalocean_manual_setup(env)
            return
        
        # Check authentication
        result = subprocess.run(['doctl', 'account', 'get'], capture_output=True, text=True)
        if result.returncode != 0:
            print("DigitalOcean CLI not authenticated.")
            print("Please run: doctl auth init")
            return
        
        self._deploy_digitalocean_app_platform(env)
    
    def _deploy_digitalocean_app_platform(self, env: str) -> None:
        """Deploy to DigitalOcean App Platform."""
        try:
            app_name = f"vib3-{env}"
            
            # Create app spec
            app_spec = {
                "name": app_name,
                "services": [
                    {
                        "name": "web",
                        "source_dir": "/",
                        "github": {
                            "repo": "your-username/vib3",
                            "branch": "main"
                        },
                        "run_command": "node server.js",
                        "environment_slug": "node-js",
                        "instance_count": 1,
                        "instance_size_slug": "basic-xxs",
                        "http_port": 3000,
                        "routes": [{"path": "/"}],
                        "envs": [
                            {
                                "key": "NODE_ENV",
                                "value": env
                            }
                        ]
                    }
                ],
                "static_sites": [
                    {
                        "name": "frontend",
                        "source_dir": "/www",
                        "routes": [{"path": "/static"}]
                    }
                ]
            }
            
            # Save app spec
            spec_file = f'.vib3-do-{env}.yaml'
            import yaml
            with open(spec_file, 'w') as f:
                yaml.dump(app_spec, f)
            
            print(f"Created app spec: {spec_file}")
            print("To deploy, run:")
            print(f"doctl apps create --spec {spec_file}")
            print("\nOr deploy with GitHub integration:")
            self._show_digitalocean_github_setup(env)
            
        except ImportError:
            print("PyYAML not installed. Showing manual setup instead...")
            self._show_digitalocean_manual_setup(env)
        except Exception as e:
            print(f"Error creating app spec: {e}")
            self._show_digitalocean_manual_setup(env)
    
    def _show_digitalocean_manual_setup(self, env: str) -> None:
        """Show manual DigitalOcean setup instructions."""
        print(f"\n=== DigitalOcean Setup Guide for VIB3 ({env}) ===")
        print("\n1. CREATE ACCOUNTS & SETUP:")
        print("   • Sign up at https://digitalocean.com")
        print("   • Install doctl CLI: https://docs.digitalocean.com/reference/doctl/how-to/install/")
        print("   • Authenticate: doctl auth init")
        
        print("\n2. DEPLOY WEB APP (App Platform):")
        print("   • Go to https://cloud.digitalocean.com/apps")
        print("   • Click 'Create App'")
        print("   • Connect your GitHub repo")
        print("   • Configure:")
        print("     - Source: Root directory")
        print("     - Build Command: npm install")
        print("     - Run Command: node server.js")
        print("     - HTTP Port: 3000")
        print("     - Environment: Node.js")
        print("   • Add static site:")
        print("     - Source: /www directory")
        print("     - Build Command: (none)")
        
        print("\n3. SETUP SPACES (for video storage):")
        print("   • Go to https://cloud.digitalocean.com/spaces")
        print("   • Create Space:")
        print(f"     - Name: vib3-{env}-videos")
        print("     - Region: Choose closest to users")
        print("     - CDN: Enable")
        print("     - File Listing: Restricted")
        
        print("\n4. SETUP DATABASE:")
        print("   • Go to https://cloud.digitalocean.com/databases")
        print("   • Create Database:")
        print("     - Engine: PostgreSQL")
        print(f"     - Name: vib3-{env}-db")
        print("     - Size: Basic plan")
        
        print("\n5. ENVIRONMENT VARIABLES:")
        print("   Add these to your App Platform app:")
        print("   • NODE_ENV=" + env)
        print("   • DATABASE_URL=(from database connection)")
        print("   • DO_SPACES_KEY=(from API keys)")
        print("   • DO_SPACES_SECRET=(from API keys)")
        print("   • DO_SPACES_ENDPOINT=(from spaces)")
        print("   • DO_SPACES_BUCKET=vib3-" + env + "-videos")
        
        print("\n6. DOMAIN SETUP:")
        print("   • Go to Networking > Domains")
        print("   • Add your domain")
        print("   • Point to your App Platform app")
        
        print(f"\n7. ESTIMATED MONTHLY COSTS:")
        print("   • App Platform: $12-25")
        print("   • Database: $15")
        print("   • Spaces: $5 (250GB)")
        print("   • Total: ~$30-45/month")
        
        print(f"\n🚀 Once deployed, your app will be at:")
        print(f"   https://vib3-{env}-xxxxx.ondigitalocean.app")
    
    def _show_digitalocean_github_setup(self, env: str) -> None:
        """Show GitHub integration setup for DigitalOcean."""
        print(f"\n=== GitHub Integration Setup ===")
        print("1. Push your code to GitHub")
        print("2. Go to https://cloud.digitalocean.com/apps")
        print("3. Create App from GitHub")
        print("4. Select your vib3 repository")
        print("5. Configure build settings:")
        print("   • Build Command: npm install")
        print("   • Run Command: node server.js")
        print("   • HTTP Port: 3000")
        print("6. Add environment variables")
        print("7. Deploy!")
    
    def _deploy_config(self, action: str, key: Optional[str], value: Optional[str]) -> None:
        """Manage deployment configurations."""
        config_file = '.vib3_deploy_config.json'
        
        # Load existing config
        config = {}
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                config = json.load(f)
        
        if action == 'show':
            if not config:
                print("No deployment configuration found.")
            else:
                print("Deployment Configuration:")
                print(json.dumps(config, indent=2))
        
        elif action == 'get':
            if not key:
                print("Error: --key is required for get action")
                return
            
            value = config.get(key)
            if value is None:
                print(f"Key '{key}' not found in configuration")
            else:
                print(f"{key}: {value}")
        
        elif action == 'set':
            if not key or not value:
                print("Error: --key and --value are required for set action")
                return
            
            config[key] = value
            with open(config_file, 'w') as f:
                json.dump(config, f, indent=2)
            print(f"Set {key} = {value}")
    
    def _deploy_status(self, provider: Optional[str]) -> None:
        """Check deployment status."""
        deployments_file = '.vib3_deployments.json'
        
        if not os.path.exists(deployments_file):
            print("No deployments found.")
            return
        
        with open(deployments_file, 'r') as f:
            deployments = json.load(f)
        
        if provider:
            provider_deployments = deployments.get(provider, [])
            if not provider_deployments:
                print(f"No {provider} deployments found.")
            else:
                print(f"\n{provider.upper()} Deployments:")
                for deployment in provider_deployments:
                    timestamp = time.strftime('%Y-%m-%d %H:%M:%S', 
                                            time.localtime(deployment['timestamp']))
                    print(f"- Environment: {deployment['env']}")
                    print(f"  URL: {deployment.get('url', 'N/A')}")
                    print(f"  Deployed: {timestamp}")
                    if provider == 'aws':
                        print(f"  Bucket: {deployment.get('bucket', 'N/A')}")
                    print()
        else:
            print("All Deployments:")
            for provider_name, provider_deployments in deployments.items():
                print(f"\n{provider_name.upper()}:")
                for deployment in provider_deployments:
                    timestamp = time.strftime('%Y-%m-%d %H:%M:%S', 
                                            time.localtime(deployment['timestamp']))
                    print(f"- Environment: {deployment['env']}")
                    print(f"  URL: {deployment.get('url', 'N/A')}")
                    print(f"  Deployed: {timestamp}")
    
    def _save_deployment_info(self, provider: str, info: dict) -> None:
        """Save deployment information."""
        deployments_file = '.vib3_deployments.json'
        
        deployments = {}
        if os.path.exists(deployments_file):
            with open(deployments_file, 'r') as f:
                deployments = json.load(f)
        
        if provider not in deployments:
            deployments[provider] = []
        
        deployments[provider].append(info)
        
        # Keep only last 5 deployments per provider
        deployments[provider] = deployments[provider][-5:]
        
        with open(deployments_file, 'w') as f:
            json.dump(deployments, f, indent=2)
    
    def run(self, args: Optional[List[str]] = None) -> int:
        """
        Run the CLI application.
        
        Args:
            args: Command line arguments (defaults to sys.argv[1:])
            
        Returns:
            Exit code (0 for success, non-zero for error)
        """
        try:
            parsed_args = self.parser.parse_args(args)
            
            if parsed_args.command == 'hello':
                self.hello_command(parsed_args.name)
            elif parsed_args.command == 'list':
                self.list_command(parsed_args.items)
            elif parsed_args.command == 'config':
                self.config_command(parsed_args.show)
            elif parsed_args.command == 'upload':
                self.upload_command(
                    parsed_args.file,
                    parsed_args.bucket,
                    parsed_args.key,
                    parsed_args.region
                )
            elif parsed_args.command == 'download':
                self.download_command(
                    parsed_args.bucket,
                    parsed_args.key,
                    parsed_args.output,
                    parsed_args.region
                )
            elif parsed_args.command == 'deploy':
                self.deploy_command(parsed_args)
            else:
                self.parser.print_help()
                return 1
            
            return 0
            
        except KeyboardInterrupt:
            print("\nOperation cancelled by user")
            return 130
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            return 1


def main():
    """Entry point for the CLI application."""
    cli = VIB3CLI()
    sys.exit(cli.run())


if __name__ == '__main__':
    main()