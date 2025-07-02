import 'package:flutter/material.dart';

class SecurityScreen extends StatefulWidget {
  const SecurityScreen({super.key});

  @override
  State<SecurityScreen> createState() => _SecurityScreenState();
}

class _SecurityScreenState extends State<SecurityScreen> {
  bool _twoFactorEnabled = false;
  bool _loginAlertsEnabled = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Security'),
      ),
      body: ListView(
        children: [
          // Password and authentication
          _buildSectionHeader('PASSWORD AND AUTHENTICATION'),
          ListTile(
            title: const Text('Change password',
              style: TextStyle(color: Colors.white)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {
              _showChangePasswordDialog();
            },
          ),
          SwitchListTile(
            title: const Text('Two-factor authentication',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Add an extra layer of security',
              style: TextStyle(color: Colors.grey)),
            value: _twoFactorEnabled,
            onChanged: (value) {
              setState(() => _twoFactorEnabled = value);
            },
            activeColor: const Color(0xFFFF0080),
          ),
          
          // Login activity
          _buildSectionHeader('LOGIN ACTIVITY'),
          SwitchListTile(
            title: const Text('Login alerts',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Get notified when someone logs into your account',
              style: TextStyle(color: Colors.grey)),
            value: _loginAlertsEnabled,
            onChanged: (value) {
              setState(() => _loginAlertsEnabled = value);
            },
            activeColor: const Color(0xFFFF0080),
          ),
          ListTile(
            title: const Text('Where you\'re logged in',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('See your active sessions',
              style: TextStyle(color: Colors.grey)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {
              _showActiveSessionsDialog();
            },
          ),
          
          // Data and permissions
          _buildSectionHeader('DATA AND PERMISSIONS'),
          ListTile(
            title: const Text('Apps and websites',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Manage connected apps',
              style: TextStyle(color: Colors.grey)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {},
          ),
          ListTile(
            title: const Text('Download your data',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Request a copy of your information',
              style: TextStyle(color: Colors.grey)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {},
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

  void _showChangePasswordDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Change Password',
          style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              obscureText: true,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                hintText: 'Current password',
                hintStyle: TextStyle(color: Colors.grey),
                enabledBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.grey),
                ),
                focusedBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Color(0xFFFF0080)),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              obscureText: true,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                hintText: 'New password',
                hintStyle: TextStyle(color: Colors.grey),
                enabledBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.grey),
                ),
                focusedBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Color(0xFFFF0080)),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              obscureText: true,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                hintText: 'Confirm new password',
                hintStyle: TextStyle(color: Colors.grey),
                enabledBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.grey),
                ),
                focusedBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Color(0xFFFF0080)),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Password changed successfully')),
              );
            },
            child: const Text('Change', style: TextStyle(color: Color(0xFFFF0080))),
          ),
        ],
      ),
    );
  }

  void _showActiveSessionsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Active Sessions',
          style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.phone_android, color: Colors.white),
              title: const Text('Android Device (Current)',
                style: TextStyle(color: Colors.white, fontSize: 14)),
              subtitle: const Text('Last active: Now',
                style: TextStyle(color: Colors.grey, fontSize: 12)),
            ),
            ListTile(
              leading: const Icon(Icons.computer, color: Colors.white),
              title: const Text('Web Browser',
                style: TextStyle(color: Colors.white, fontSize: 14)),
              subtitle: const Text('Last active: 2 hours ago',
                style: TextStyle(color: Colors.grey, fontSize: 12)),
              trailing: TextButton(
                onPressed: () {},
                child: const Text('End', style: TextStyle(color: Colors.red)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close', style: TextStyle(color: Color(0xFFFF0080))),
          ),
        ],
      ),
    );
  }
}