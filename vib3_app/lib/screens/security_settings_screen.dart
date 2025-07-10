import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/privacy_service.dart';
import '../widgets/privacy_section.dart';

class SecuritySettingsScreen extends StatefulWidget {
  const SecuritySettingsScreen({super.key});

  @override
  State<SecuritySettingsScreen> createState() => _SecuritySettingsScreenState();
}

class _SecuritySettingsScreenState extends State<SecuritySettingsScreen> {
  bool _twoFactorEnabled = false;
  bool _isLoading = true;
  List<Map<String, dynamic>> _activities = [];
  
  @override
  void initState() {
    super.initState();
    _loadSecurityData();
  }
  
  Future<void> _loadSecurityData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      final activities = await PrivacyService.getAccountActivity(token: token);
      
      if (mounted) {
        setState(() {
          _activities = activities;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
  
  Future<void> _toggleTwoFactor() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    if (_twoFactorEnabled) {
      _showDisableTwoFactorDialog();
    } else {
      _showEnableTwoFactorDialog();
    }
  }
  
  void _showEnableTwoFactorDialog() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Enable Two-Factor Authentication',
          style: TextStyle(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Setting up two-factor authentication...',
              style: TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 16),
            const CircularProgressIndicator(color: Color(0xFF00CED1)),
          ],
        ),
      ),
    );
    
    final qrCode = await PrivacyService.enableTwoFactor(token: token);
    
    Navigator.pop(context);
    
    if (qrCode != null) {
      _showQRCodeDialog(qrCode);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to enable two-factor authentication'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  void _showQRCodeDialog(String qrCode) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Scan QR Code',
          style: TextStyle(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Scan this QR code with your authenticator app:',
              style: TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 16),
            Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Text('QR Code would appear here'),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                hintText: 'Enter verification code',
                hintStyle: TextStyle(color: Colors.white54),
                filled: true,
                fillColor: Color(0xFF2A2A2A),
                border: OutlineInputBorder(),
              ),
              onSubmitted: (code) {
                _verifyTwoFactor(code);
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }
  
  void _verifyTwoFactor(String code) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    final success = await PrivacyService.verifyTwoFactor(
      code: code,
      token: token,
    );
    
    Navigator.pop(context);
    
    if (success) {
      setState(() {
        _twoFactorEnabled = true;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Two-factor authentication enabled'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Invalid verification code'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  void _showDisableTwoFactorDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Disable Two-Factor Authentication',
          style: TextStyle(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Enter your authentication code to disable two-factor authentication:',
              style: TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 16),
            TextField(
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                hintText: 'Enter verification code',
                hintStyle: TextStyle(color: Colors.white54),
                filled: true,
                fillColor: Color(0xFF2A2A2A),
                border: OutlineInputBorder(),
              ),
              onSubmitted: (code) {
                _disableTwoFactor(code);
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }
  
  void _disableTwoFactor(String code) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    final success = await PrivacyService.disableTwoFactor(
      code: code,
      token: token,
    );
    
    Navigator.pop(context);
    
    if (success) {
      setState(() {
        _twoFactorEnabled = false;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Two-factor authentication disabled'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Invalid verification code'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 2,
        title: const Text(
          'Security Settings',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF00CED1),
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Authentication
                PrivacySection(
                  title: 'Authentication',
                  icon: Icons.security,
                  children: [
                    SwitchListTile(
                      title: const Text(
                        'Two-Factor Authentication',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      subtitle: const Text(
                        'Add an extra layer of security to your account',
                        style: TextStyle(
                          color: Colors.white54,
                          fontSize: 14,
                        ),
                      ),
                      value: _twoFactorEnabled,
                      onChanged: (_) => _toggleTwoFactor(),
                      activeColor: const Color(0xFF00CED1),
                    ),
                    ListTile(
                      title: const Text(
                        'Change Password',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      subtitle: const Text(
                        'Update your account password',
                        style: TextStyle(
                          color: Colors.white54,
                          fontSize: 14,
                        ),
                      ),
                      trailing: const Icon(
                        Icons.arrow_forward_ios,
                        color: Colors.white54,
                        size: 16,
                      ),
                      onTap: () {
                        // Navigate to change password screen
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                
                // Account Activity
                PrivacySection(
                  title: 'Account Activity',
                  icon: Icons.history,
                  children: [
                    ListTile(
                      title: const Text(
                        'Login Sessions',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      subtitle: const Text(
                        'View and manage your active sessions',
                        style: TextStyle(
                          color: Colors.white54,
                          fontSize: 14,
                        ),
                      ),
                      trailing: const Icon(
                        Icons.arrow_forward_ios,
                        color: Colors.white54,
                        size: 16,
                      ),
                      onTap: () {
                        _showLoginSessionsDialog();
                      },
                    ),
                    ListTile(
                      title: const Text(
                        'Recent Activity',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      subtitle: Text(
                        '${_activities.length} recent activities',
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 14,
                        ),
                      ),
                      trailing: const Icon(
                        Icons.arrow_forward_ios,
                        color: Colors.white54,
                        size: 16,
                      ),
                      onTap: () {
                        _showActivityDialog();
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                
                // Data & Privacy
                PrivacySection(
                  title: 'Data & Privacy',
                  icon: Icons.data_usage,
                  children: [
                    ListTile(
                      title: const Text(
                        'Download Your Data',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      subtitle: const Text(
                        'Request a copy of your data',
                        style: TextStyle(
                          color: Colors.white54,
                          fontSize: 14,
                        ),
                      ),
                      trailing: const Icon(
                        Icons.arrow_forward_ios,
                        color: Colors.white54,
                        size: 16,
                      ),
                      onTap: () {
                        // Navigate to data download screen
                      },
                    ),
                    ListTile(
                      title: const Text(
                        'Delete Account',
                        style: TextStyle(
                          color: Colors.red,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      subtitle: const Text(
                        'Permanently delete your account',
                        style: TextStyle(
                          color: Colors.white54,
                          fontSize: 14,
                        ),
                      ),
                      trailing: const Icon(
                        Icons.arrow_forward_ios,
                        color: Colors.red,
                        size: 16,
                      ),
                      onTap: () {
                        _showDeleteAccountDialog();
                      },
                    ),
                  ],
                ),
              ],
            ),
    );
  }
  
  void _showLoginSessionsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Login Sessions',
          style: TextStyle(color: Colors.white),
        ),
        content: SizedBox(
          width: double.maxFinite,
          height: 300,
          child: ListView(
            children: [
              _buildSessionTile(
                device: 'iPhone 14 Pro',
                location: 'San Francisco, CA',
                time: '2 hours ago',
                isCurrent: true,
              ),
              _buildSessionTile(
                device: 'Chrome on Windows',
                location: 'New York, NY',
                time: '1 day ago',
                isCurrent: false,
              ),
              _buildSessionTile(
                device: 'Safari on Mac',
                location: 'Los Angeles, CA',
                time: '3 days ago',
                isCurrent: false,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }
  
  void _showActivityDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Recent Activity',
          style: TextStyle(color: Colors.white),
        ),
        content: SizedBox(
          width: double.maxFinite,
          height: 300,
          child: ListView.builder(
            itemCount: _activities.length,
            itemBuilder: (context, index) {
              final activity = _activities[index];
              return ListTile(
                title: Text(
                  activity['action'] ?? 'Unknown action',
                  style: const TextStyle(color: Colors.white),
                ),
                subtitle: Text(
                  activity['timestamp'] ?? 'Unknown time',
                  style: const TextStyle(color: Colors.white54),
                ),
                leading: Icon(
                  _getActivityIcon(activity['type']),
                  color: const Color(0xFF00CED1),
                ),
              );
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildSessionTile({
    required String device,
    required String location,
    required String time,
    required bool isCurrent,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: isCurrent
            ? Border.all(color: const Color(0xFF00CED1))
            : null,
      ),
      child: Row(
        children: [
          Icon(
            _getDeviceIcon(device),
            color: const Color(0xFF00CED1),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  device,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  location,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
                Text(
                  time,
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          if (isCurrent)
            const Text(
              'Current',
              style: TextStyle(
                color: Color(0xFF00CED1),
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            )
          else
            TextButton(
              onPressed: () {
                // End session
              },
              child: const Text(
                'End',
                style: TextStyle(color: Colors.red),
              ),
            ),
        ],
      ),
    );
  }
  
  IconData _getDeviceIcon(String device) {
    if (device.toLowerCase().contains('iphone')) {
      return Icons.phone_iphone;
    } else if (device.toLowerCase().contains('android')) {
      return Icons.phone_android;
    } else if (device.toLowerCase().contains('chrome')) {
      return Icons.web;
    } else if (device.toLowerCase().contains('safari')) {
      return Icons.web;
    } else {
      return Icons.computer;
    }
  }
  
  IconData _getActivityIcon(String? type) {
    switch (type) {
      case 'login':
        return Icons.login;
      case 'logout':
        return Icons.logout;
      case 'profile_update':
        return Icons.edit;
      case 'password_change':
        return Icons.lock;
      case 'video_upload':
        return Icons.video_library;
      default:
        return Icons.info;
    }
  }
  
  void _showDeleteAccountDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Delete Account',
          style: TextStyle(color: Colors.red),
        ),
        content: const Text(
          'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
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
              // Navigate to account deletion flow
            },
            child: const Text(
              'Delete',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }
}