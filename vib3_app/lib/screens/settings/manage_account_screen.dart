import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class ManageAccountScreen extends StatelessWidget {
  const ManageAccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).currentUser;
    
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Manage account'),
      ),
      body: ListView(
        children: [
          // Account Information
          _buildSectionHeader('ACCOUNT INFORMATION'),
          _buildInfoItem('Username', '@${user?.username ?? ''}'),
          _buildInfoItem('Email', user?.email ?? ''),
          _buildInfoItem('Phone number', 'Add phone number', isAction: true),
          
          // Account Control
          _buildSectionHeader('ACCOUNT CONTROL'),
          ListTile(
            title: const Text('Verify account', 
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Get verified badge',
              style: TextStyle(color: Colors.grey)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () => _showVerificationDialog(context),
          ),
          ListTile(
            title: const Text('Switch to Pro Account',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Get access to analytics and more',
              style: TextStyle(color: Colors.grey)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () => _showProAccountDialog(context),
          ),
          ListTile(
            title: const Text('Delete account',
              style: TextStyle(color: Colors.red)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () => _showDeleteAccountDialog(context),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Text(
        title,
        style: const TextStyle(
          color: Colors.grey,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildInfoItem(String label, String value, {bool isAction = false}) {
    return ListTile(
      title: Text(label, style: const TextStyle(color: Colors.grey)),
      subtitle: Text(
        value,
        style: TextStyle(
          color: isAction ? const Color(0xFFFF0080) : Colors.white,
          fontSize: 16,
        ),
      ),
      trailing: isAction
          ? const Icon(Icons.chevron_right, color: Colors.grey)
          : null,
      onTap: isAction ? () {} : null,
    );
  }

  void _showVerificationDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Verify Account', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Account verification is available for notable public figures, celebrities, and brands.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showProAccountDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Switch to Pro', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Pro accounts get access to:\n• Analytics\n• Promotional tools\n• Commercial music library\n• And more!',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Switched to Pro account')),
              );
            },
            child: const Text('Switch', style: TextStyle(color: Color(0xFFFF0080))),
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Delete Account', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Are you sure you want to delete your account? This action cannot be undone.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              // TODO: Implement account deletion
              Navigator.pop(context);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}