#!/usr/bin/env python3
"""
Test suite for VIB3 CLI application
"""

import os
import sys
import pytest
from unittest.mock import Mock, patch, mock_open, MagicMock, call
from io import StringIO
import json
import tempfile
from botocore.exceptions import NoCredentialsError, ClientError

from vib3_cli import VIB3CLI


class TestVIB3CLI:
    """Test cases for VIB3CLI class."""
    
    @pytest.fixture
    def cli(self):
        """Create a VIB3CLI instance for testing."""
        return VIB3CLI()
    
    def test_version_flag(self, cli, capsys):
        """Test --version flag."""
        with pytest.raises(SystemExit) as exc_info:
            cli.run(['--version'])
        assert exc_info.value.code == 0
        captured = capsys.readouterr()
        assert 'vib3 1.0.0' in captured.out
    
    def test_help_flag(self, cli, capsys):
        """Test --help flag."""
        with pytest.raises(SystemExit) as exc_info:
            cli.run(['--help'])
        assert exc_info.value.code == 0
        captured = capsys.readouterr()
        assert 'VIB3 Command Line Interface' in captured.out
        assert 'Available commands' in captured.out
    
    def test_no_command(self, cli, capsys):
        """Test running without any command."""
        exit_code = cli.run([])
        assert exit_code == 1
        captured = capsys.readouterr()
        assert 'usage:' in captured.out
    
    def test_hello_command_default(self, cli, capsys):
        """Test hello command with default name."""
        exit_code = cli.run(['hello'])
        assert exit_code == 0
        captured = capsys.readouterr()
        assert captured.out.strip() == 'Hello, World!'
    
    def test_hello_command_with_name(self, cli, capsys):
        """Test hello command with custom name."""
        exit_code = cli.run(['hello', 'Alice'])
        assert exit_code == 0
        captured = capsys.readouterr()
        assert captured.out.strip() == 'Hello, Alice!'
    
    def test_list_command_default(self, cli, capsys):
        """Test list command with default items."""
        exit_code = cli.run(['list'])
        assert exit_code == 0
        captured = capsys.readouterr()
        assert 'Items:' in captured.out
        assert '1. item1' in captured.out
        assert '2. item2' in captured.out
        assert '3. item3' in captured.out
    
    def test_list_command_custom_items(self, cli, capsys):
        """Test list command with custom items."""
        exit_code = cli.run(['list', '--items', 'apple', 'banana', 'cherry'])
        assert exit_code == 0
        captured = capsys.readouterr()
        assert 'Items:' in captured.out
        assert '1. apple' in captured.out
        assert '2. banana' in captured.out
        assert '3. cherry' in captured.out
    
    def test_config_command_no_show(self, cli, capsys):
        """Test config command without --show flag."""
        exit_code = cli.run(['config'])
        assert exit_code == 0
        captured = capsys.readouterr()
        assert 'Use --show to display configuration' in captured.out
    
    def test_config_command_with_show(self, cli, capsys):
        """Test config command with --show flag."""
        exit_code = cli.run(['config', '--show'])
        assert exit_code == 0
        captured = capsys.readouterr()
        assert 'Configuration:' in captured.out
        assert 'Version: 1.0.0' in captured.out
        assert 'Project: VIB3' in captured.out
        assert 'Type: Command Line Application' in captured.out
    
    @patch('boto3.client')
    @patch('os.path.exists')
    @patch('os.path.isfile')
    @patch('os.path.getsize')
    @patch('os.path.basename')
    def test_upload_command_success(self, mock_basename, mock_getsize, mock_isfile, 
                                   mock_exists, mock_boto_client, cli, capsys):
        """Test successful file upload to S3."""
        # Setup mocks
        mock_exists.return_value = True
        mock_isfile.return_value = True
        mock_getsize.return_value = 1024
        mock_basename.return_value = 'test.txt'
        
        mock_s3_client = Mock()
        mock_boto_client.return_value = mock_s3_client
        
        # Run command
        exit_code = cli.run(['upload', 'test.txt', 'my-bucket'])
        
        # Verify
        assert exit_code == 0
        mock_boto_client.assert_called_once_with('s3', region_name='us-east-1')
        mock_s3_client.upload_file.assert_called_once()
        
        captured = capsys.readouterr()
        assert 'Uploading test.txt (1,024 bytes) to s3://my-bucket/test.txt' in captured.out
        assert 'Successfully uploaded to s3://my-bucket/test.txt' in captured.out
    
    @patch('boto3.client')
    @patch('os.path.exists')
    @patch('os.path.isfile')
    @patch('os.path.getsize')
    def test_upload_command_with_custom_key(self, mock_getsize, mock_isfile, 
                                           mock_exists, mock_boto_client, cli, capsys):
        """Test file upload with custom S3 key."""
        # Setup mocks
        mock_exists.return_value = True
        mock_isfile.return_value = True
        mock_getsize.return_value = 2048
        
        mock_s3_client = Mock()
        mock_boto_client.return_value = mock_s3_client
        
        # Run command
        exit_code = cli.run(['upload', 'test.txt', 'my-bucket', '--key', 'custom/path/file.txt'])
        
        # Verify
        assert exit_code == 0
        captured = capsys.readouterr()
        assert 'Uploading test.txt (2,048 bytes) to s3://my-bucket/custom/path/file.txt' in captured.out
    
    @patch('os.path.exists')
    def test_upload_command_file_not_found(self, mock_exists, cli, capsys):
        """Test upload command with non-existent file."""
        mock_exists.return_value = False
        
        exit_code = cli.run(['upload', 'nonexistent.txt', 'my-bucket'])
        
        assert exit_code == 1
        captured = capsys.readouterr()
        assert 'Error: File not found: nonexistent.txt' in captured.err
    
    @patch('os.path.exists')
    @patch('os.path.isfile')
    def test_upload_command_not_a_file(self, mock_isfile, mock_exists, cli, capsys):
        """Test upload command with directory instead of file."""
        mock_exists.return_value = True
        mock_isfile.return_value = False
        
        exit_code = cli.run(['upload', 'directory/', 'my-bucket'])
        
        assert exit_code == 1
        captured = capsys.readouterr()
        assert 'Error: Not a file: directory/' in captured.err
    
    @patch('boto3.client')
    @patch('os.path.exists')
    @patch('os.path.isfile')
    @patch('os.path.getsize')
    @patch('os.path.basename')
    def test_upload_command_no_credentials(self, mock_basename, mock_getsize, 
                                          mock_isfile, mock_exists, mock_boto_client, cli, capsys):
        """Test upload command with missing AWS credentials."""
        # Setup mocks
        mock_exists.return_value = True
        mock_isfile.return_value = True
        mock_getsize.return_value = 1024
        mock_basename.return_value = 'test.txt'
        
        mock_s3_client = Mock()
        mock_s3_client.upload_file.side_effect = NoCredentialsError()
        mock_boto_client.return_value = mock_s3_client
        
        # Run command
        exit_code = cli.run(['upload', 'test.txt', 'my-bucket'])
        
        assert exit_code == 1
        captured = capsys.readouterr()
        assert 'Error: AWS credentials not found' in captured.err
    
    @patch('boto3.client')
    @patch('os.path.exists')
    @patch('os.path.isfile')
    @patch('os.path.getsize')
    @patch('os.path.basename')
    def test_upload_command_bucket_not_found(self, mock_basename, mock_getsize, 
                                           mock_isfile, mock_exists, mock_boto_client, cli, capsys):
        """Test upload command with non-existent bucket."""
        # Setup mocks
        mock_exists.return_value = True
        mock_isfile.return_value = True
        mock_getsize.return_value = 1024
        mock_basename.return_value = 'test.txt'
        
        mock_s3_client = Mock()
        error_response = {'Error': {'Code': 'NoSuchBucket'}}
        mock_s3_client.upload_file.side_effect = ClientError(error_response, 'upload_file')
        mock_boto_client.return_value = mock_s3_client
        
        # Run command
        exit_code = cli.run(['upload', 'test.txt', 'nonexistent-bucket'])
        
        assert exit_code == 1
        captured = capsys.readouterr()
        assert "Error: Bucket 'nonexistent-bucket' does not exist" in captured.err
    
    @patch('boto3.client')
    @patch('os.path.exists')
    @patch('os.path.isfile')
    @patch('os.path.getsize')
    @patch('os.path.basename')
    def test_upload_command_access_denied(self, mock_basename, mock_getsize, 
                                        mock_isfile, mock_exists, mock_boto_client, cli, capsys):
        """Test upload command with access denied error."""
        # Setup mocks
        mock_exists.return_value = True
        mock_isfile.return_value = True
        mock_getsize.return_value = 1024
        mock_basename.return_value = 'test.txt'
        
        mock_s3_client = Mock()
        error_response = {'Error': {'Code': 'AccessDenied'}}
        mock_s3_client.upload_file.side_effect = ClientError(error_response, 'upload_file')
        mock_boto_client.return_value = mock_s3_client
        
        # Run command
        exit_code = cli.run(['upload', 'test.txt', 'private-bucket'])
        
        assert exit_code == 1
        captured = capsys.readouterr()
        assert "Error: Access denied to bucket 'private-bucket'" in captured.err
    
    def test_keyboard_interrupt(self, cli, capsys):
        """Test handling of keyboard interrupt."""
        with patch.object(cli.parser, 'parse_args', side_effect=KeyboardInterrupt):
            exit_code = cli.run(['hello'])
        
        assert exit_code == 130
        captured = capsys.readouterr()
        assert 'Operation cancelled by user' in captured.out
    
    def test_generic_exception(self, cli, capsys):
        """Test handling of generic exceptions."""
        with patch.object(cli, 'hello_command', side_effect=RuntimeError('Test error')):
            exit_code = cli.run(['hello'])
        
        assert exit_code == 1
        captured = capsys.readouterr()
        assert 'Error: Test error' in captured.err
    
    @patch('boto3.client')
    @patch('os.path.exists')
    @patch('os.path.basename')
    @patch('builtins.input')
    def test_download_command_success(self, mock_input, mock_basename, mock_exists, 
                                    mock_boto_client, cli, capsys):
        """Test successful file download from S3."""
        # Setup mocks
        mock_exists.return_value = False
        mock_basename.return_value = 'downloaded.txt'
        
        mock_s3_client = Mock()
        mock_s3_client.head_object.return_value = {'ContentLength': 2048}
        mock_boto_client.return_value = mock_s3_client
        
        # Run command
        exit_code = cli.run(['download', 'my-bucket', 'path/to/file.txt'])
        
        # Verify
        assert exit_code == 0
        mock_boto_client.assert_called_once_with('s3', region_name='us-east-1')
        mock_s3_client.head_object.assert_called_once_with(Bucket='my-bucket', Key='path/to/file.txt')
        mock_s3_client.download_file.assert_called_once()
        
        captured = capsys.readouterr()
        assert 'Downloading s3://my-bucket/path/to/file.txt (2,048 bytes) to downloaded.txt' in captured.out
        assert 'Successfully downloaded to downloaded.txt' in captured.out
    
    @patch('boto3.client')
    @patch('os.path.exists')
    def test_download_command_with_output(self, mock_exists, mock_boto_client, cli, capsys):
        """Test download with custom output path."""
        # Setup mocks
        mock_exists.return_value = False
        
        mock_s3_client = Mock()
        mock_s3_client.head_object.return_value = {'ContentLength': 1024}
        mock_boto_client.return_value = mock_s3_client
        
        # Run command
        exit_code = cli.run(['download', 'my-bucket', 'file.txt', '--output', 'custom/path/output.txt'])
        
        # Verify
        assert exit_code == 0
        captured = capsys.readouterr()
        assert 'Downloading s3://my-bucket/file.txt (1,024 bytes) to custom/path/output.txt' in captured.out
    
    @patch('boto3.client')
    @patch('os.path.exists')
    @patch('builtins.input')
    def test_download_command_file_exists_no_overwrite(self, mock_input, mock_exists, 
                                                      mock_boto_client, cli, capsys):
        """Test download when file exists and user chooses not to overwrite."""
        # Setup mocks
        mock_exists.return_value = True
        mock_input.return_value = 'n'
        
        # Run command
        exit_code = cli.run(['download', 'my-bucket', 'file.txt'])
        
        # Verify
        assert exit_code == 0
        captured = capsys.readouterr()
        assert 'Download cancelled.' in captured.out
    
    @patch('boto3.client')
    @patch('os.path.exists')
    @patch('builtins.input')
    @patch('os.path.basename')
    def test_download_command_file_exists_overwrite(self, mock_basename, mock_input, 
                                                   mock_exists, mock_boto_client, cli, capsys):
        """Test download when file exists and user chooses to overwrite."""
        # Setup mocks
        mock_exists.return_value = True
        mock_input.return_value = 'y'
        mock_basename.return_value = 'file.txt'
        
        mock_s3_client = Mock()
        mock_s3_client.head_object.return_value = {'ContentLength': 512}
        mock_boto_client.return_value = mock_s3_client
        
        # Run command
        exit_code = cli.run(['download', 'my-bucket', 'file.txt'])
        
        # Verify
        assert exit_code == 0
        mock_s3_client.download_file.assert_called_once()
    
    @patch('boto3.client')
    @patch('os.path.exists')
    @patch('os.path.basename')
    def test_download_command_no_credentials(self, mock_basename, mock_exists, 
                                           mock_boto_client, cli, capsys):
        """Test download with missing AWS credentials."""
        # Setup mocks
        mock_exists.return_value = False
        mock_basename.return_value = 'file.txt'
        
        mock_s3_client = Mock()
        mock_s3_client.head_object.side_effect = NoCredentialsError()
        mock_boto_client.return_value = mock_s3_client
        
        # Run command
        exit_code = cli.run(['download', 'my-bucket', 'file.txt'])
        
        assert exit_code == 1
        captured = capsys.readouterr()
        assert 'Error: AWS credentials not found' in captured.err
    
    @patch('boto3.client')
    @patch('os.path.exists')
    @patch('os.path.basename')
    def test_download_command_no_such_key(self, mock_basename, mock_exists, 
                                        mock_boto_client, cli, capsys):
        """Test download with non-existent S3 key."""
        # Setup mocks
        mock_exists.return_value = False
        mock_basename.return_value = 'file.txt'
        
        mock_s3_client = Mock()
        error_response = {'Error': {'Code': 'NoSuchKey'}}
        mock_s3_client.head_object.side_effect = ClientError(error_response, 'head_object')
        mock_boto_client.return_value = mock_s3_client
        
        # Run command
        exit_code = cli.run(['download', 'my-bucket', 'nonexistent.txt'])
        
        assert exit_code == 1
        captured = capsys.readouterr()
        assert "Error: Key 'nonexistent.txt' does not exist in bucket 'my-bucket'" in captured.err
    
    @patch('boto3.client')
    @patch('os.path.exists')
    @patch('os.path.isfile')
    @patch('os.path.getsize')
    @patch('os.path.basename')
    def test_upload_progress_callback(self, mock_basename, mock_getsize, 
                                    mock_isfile, mock_exists, mock_boto_client, cli, capsys):
        """Test upload progress callback functionality."""
        # Setup mocks
        mock_exists.return_value = True
        mock_isfile.return_value = True
        mock_getsize.return_value = 10000
        mock_basename.return_value = 'test.txt'
        
        mock_s3_client = Mock()
        
        # Capture the callback function
        captured_callback = None
        def capture_callback(file, bucket, key, Callback=None):
            nonlocal captured_callback
            captured_callback = Callback
            # Simulate progress updates
            if Callback:
                Callback(2500)
                Callback(2500)
                Callback(2500)
                Callback(2500)
        
        mock_s3_client.upload_file.side_effect = capture_callback
        mock_boto_client.return_value = mock_s3_client
        
        # Run command
        exit_code = cli.run(['upload', 'test.txt', 'my-bucket'])
        
        # Verify progress was tracked
        assert exit_code == 0
        assert captured_callback is not None
        
        captured = capsys.readouterr()
        assert 'Successfully uploaded to s3://my-bucket/test.txt' in captured.out


def test_main_function():
    """Test the main() entry point."""
    with patch('sys.exit') as mock_exit:
        with patch('vib3_cli.VIB3CLI') as mock_cli_class:
            mock_cli = Mock()
            mock_cli.run.return_value = 0
            mock_cli_class.return_value = mock_cli
            
            from vib3_cli import main
            main()
            
            mock_cli.run.assert_called_once()
            mock_exit.assert_called_once_with(0)


class TestDeployCommand:
    """Test cases for deploy command."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.cli = VIB3CLI()
    
    @patch('subprocess.run')
    @patch('os.path.exists')
    def test_deploy_local(self, mock_exists, mock_run):
        """Test local deployment."""
        mock_exists.side_effect = lambda x: x in ['server.js', 'package.json']
        mock_run.return_value = MagicMock(returncode=0, stdout='v18.0.0')
        
        with patch('sys.stdout', new=StringIO()) as fake_out:
            result = self.cli.run(['deploy', 'web', 'local'])
            assert result == 0
            output = fake_out.getvalue()
            assert 'Starting local server on port 3000' in output
    
    @patch('subprocess.run')
    @patch('os.path.exists')
    def test_deploy_local_custom_port(self, mock_exists, mock_run):
        """Test local deployment with custom port."""
        mock_exists.side_effect = lambda x: x in ['server.js', 'package.json']
        mock_run.return_value = MagicMock(returncode=0, stdout='v18.0.0')
        
        with patch('sys.stdout', new=StringIO()) as fake_out:
            result = self.cli.run(['deploy', 'web', 'local', '--port', '8080'])
            assert result == 0
            output = fake_out.getvalue()
            assert 'Starting local server on port 8080' in output
    
    @patch('boto3.client')
    @patch('subprocess.run')
    @patch('os.path.exists')
    @patch('os.walk')
    def test_deploy_aws(self, mock_walk, mock_exists, mock_run, mock_boto_client):
        """Test AWS deployment."""
        mock_exists.return_value = True
        mock_run.return_value = MagicMock(returncode=0)
        mock_walk.return_value = [
            ('www', [], ['index.html', 'app.js', 'style.css'])
        ]
        
        mock_s3 = MagicMock()
        mock_boto_client.return_value = mock_s3
        
        with patch('sys.stdout', new=StringIO()) as fake_out:
            result = self.cli.run(['deploy', 'web', 'aws'])
            assert result == 0
            output = fake_out.getvalue()
            assert 'Deploying to AWS' in output
            assert 'Deployment successful!' in output
        
        # Verify S3 operations
        mock_s3.create_bucket.assert_called_once()
        mock_s3.put_bucket_website.assert_called_once()
        mock_s3.put_bucket_policy.assert_called_once()
        assert mock_s3.upload_file.call_count == 3
    
    @patch('subprocess.run')
    def test_deploy_oracle(self, mock_run):
        """Test Oracle Cloud deployment."""
        mock_run.return_value = MagicMock(returncode=1)
        
        with patch('sys.stdout', new=StringIO()) as fake_out:
            result = self.cli.run(['deploy', 'web', 'oracle'])
            assert result == 0
            output = fake_out.getvalue()
            assert 'OCI CLI not found' in output
    
    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    def test_deploy_config_show(self, mock_file, mock_exists):
        """Test deploy config show."""
        mock_exists.return_value = True
        config_data = {'aws_region': 'us-west-2', 'bucket_prefix': 'vib3-prod'}
        mock_file.return_value.read.return_value = json.dumps(config_data)
        
        with patch('sys.stdout', new=StringIO()) as fake_out:
            result = self.cli.run(['deploy', 'config', 'show'])
            assert result == 0
            output = fake_out.getvalue()
            assert 'aws_region' in output
            assert 'us-west-2' in output
    
    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    def test_deploy_config_set(self, mock_file, mock_exists):
        """Test deploy config set."""
        mock_exists.return_value = False
        
        with patch('sys.stdout', new=StringIO()) as fake_out:
            result = self.cli.run(['deploy', 'config', 'set', '--key', 'region', '--value', 'us-east-1'])
            assert result == 0
            output = fake_out.getvalue()
            assert 'Set region = us-east-1' in output
    
    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    def test_deploy_status(self, mock_file, mock_exists):
        """Test deploy status."""
        mock_exists.return_value = True
        deployments_data = {
            'aws': [{
                'bucket': 'vib3-dev-123456',
                'region': 'us-east-1',
                'url': 'http://vib3-dev-123456.s3-website-us-east-1.amazonaws.com',
                'env': 'dev',
                'timestamp': 1234567890
            }]
        }
        mock_file.return_value.read.return_value = json.dumps(deployments_data)
        
        with patch('sys.stdout', new=StringIO()) as fake_out:
            result = self.cli.run(['deploy', 'status'])
            assert result == 0
            output = fake_out.getvalue()
            assert 'AWS' in output
            assert 'vib3-dev-123456' in output
    
    def test_deploy_no_subcommand(self):
        """Test deploy without subcommand."""
        with patch('sys.stdout', new=StringIO()) as fake_out:
            result = self.cli.run(['deploy'])
            assert result == 0
            output = fake_out.getvalue()
            assert 'Please specify a deploy subcommand' in output


if __name__ == '__main__':
    pytest.main([__file__, '-v'])