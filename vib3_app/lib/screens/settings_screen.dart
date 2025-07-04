import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'settings/manage_account_screen.dart';
import 'settings/privacy_screen.dart';
import 'settings/security_screen.dart';
import 'settings/notification_settings_screen.dart';
import 'settings/content_preferences_screen.dart';
import 'qr_code_screen.dart';
import 'theme_selection_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        title: const Text(
          'Settings and privacy',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            children: [
              // Account Section
              _buildSectionHeader('ACCOUNT'),
              _buildSettingItem(
                icon: Icons.person_outline,
                title: 'Manage account',
                onTap: () => _navigateTo(context, const ManageAccountScreen()),
              ),
              _buildSettingItem(
                icon: Icons.lock_outline,
                title: 'Privacy',
                onTap: () => _navigateTo(context, const PrivacyScreen()),
              ),
              _buildSettingItem(
                icon: Icons.security,
                title: 'Security',
                onTap: () => _navigateTo(context, const SecurityScreen()),
              ),
              _buildSettingItem(
                icon: Icons.qr_code,
                title: 'QR code',
                onTap: () => _navigateTo(context, const QRCodeScreen()),
              ),
              _buildSettingItem(
                icon: Icons.account_balance_wallet_outlined,
                title: 'Balance',
                subtitle: '\$0.00',
                onTap: () {}, // TODO: Implement BalanceScreen
              ),
              
              // Content & Display Section
              _buildSectionHeader('CONTENT & DISPLAY'),
              _buildSettingItem(
                icon: Icons.palette_outlined,
                title: 'Choose Your Vibe',
                subtitle: 'Select app theme',
                onTap: () => _navigateTo(context, const ThemeSelectionScreen()),
              ),
              _buildSettingItem(
                icon: Icons.notifications_outlined,
                title: 'Push notifications',
                onTap: () => _navigateTo(context, const NotificationSettingsScreen()),
              ),
              _buildSettingItem(
                icon: Icons.tune,
                title: 'Content preferences',
                onTap: () => _navigateTo(context, const ContentPreferencesScreen()),
              ),
              _buildSettingItem(
                icon: Icons.download_outlined,
                title: 'Downloads',
                onTap: () {}, // TODO: Implement DownloadSettingsScreen
              ),
              _buildSettingItem(
                icon: Icons.language,
                title: 'Language',
                subtitle: 'English',
                onTap: () {}, // TODO: Implement LanguageScreen
              ),
              _buildSettingItem(
                icon: Icons.play_circle_outline,
                title: 'Playback and display',
                onTap: () {}, // TODO: Implement PlaybackSettingsScreen
              ),
              _buildSettingItem(
                icon: Icons.accessibility_new,
                title: 'Accessibility',
                onTap: () {}, // TODO: Implement AccessibilityScreen
              ),
              _buildSettingItem(
                icon: Icons.wifi_outlined,
                title: 'Data usage',
                onTap: () {}, // TODO: Implement DataUsageScreen
              ),
              
              // Support Section
              _buildSectionHeader('SUPPORT'),
              _buildSettingItem(
                icon: Icons.flag_outlined,
                title: 'Report a problem',
                onTap: () {}, // TODO: Implement ReportProblemScreen
              ),
              _buildSettingItem(
                icon: Icons.help_outline,
                title: 'Help Center',
                onTap: () => _launchUrl('https://support.vib3.com'),
              ),
              _buildSettingItem(
                icon: Icons.verified_user_outlined,
                title: 'Safety Center',
                onTap: () => _launchUrl('https://safety.vib3.com'),
              ),
              _buildSettingItem(
                icon: Icons.people_outline,
                title: 'Creator Portal',
                onTap: () => _launchUrl('https://creators.vib3.com'),
              ),
              _buildSettingItem(
                icon: Icons.lightbulb_outline,
                title: 'Community Guidelines',
                onTap: () {}, // TODO: Implement CommunityGuidelinesScreen
              ),
              
              // About Section
              _buildSectionHeader('ABOUT'),
              _buildSettingItem(
                icon: Icons.article_outlined,
                title: 'Terms of Service',
                onTap: () => _launchUrl('https://vib3.com/terms'),
              ),
              _buildSettingItem(
                icon: Icons.privacy_tip_outlined,
                title: 'Privacy Policy',
                onTap: () => _launchUrl('https://vib3.com/privacy'),
              ),
              _buildSettingItem(
                icon: Icons.copyright_outlined,
                title: 'Copyright Policy',
                onTap: () => _launchUrl('https://vib3.com/copyright'),
              ),
              _buildSettingItem(
                icon: Icons.policy_outlined,
                title: 'Open source licenses',
                onTap: () {}, // TODO: Implement OpenSourceLicensesScreen
              ),
              
              // Cache & Account Actions
              _buildSectionHeader('CACHE & CELLULAR'),
              _buildSettingItem(
                icon: Icons.cleaning_services_outlined,
                title: 'Clear cache',
                subtitle: '0 MB',
                onTap: () => _showClearCacheDialog(context),
              ),
              
              const SizedBox(height: 20),
              
              // Logout Button
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                child: OutlinedButton(
                  onPressed: () => _showLogoutDialog(context),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.red),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text(
                    'Log out',
                    style: TextStyle(color: Colors.red, fontSize: 16),
                  ),
                ),
              ),
              
              const SizedBox(height: 50), // Bottom padding for safe scrolling
            ],
          ),
        ),
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

  Widget _buildSettingItem({
    required IconData icon,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.white),
      title: Text(title, style: const TextStyle(color: Colors.white)),
      subtitle: subtitle != null
          ? Text(subtitle, style: const TextStyle(color: Colors.grey))
          : null,
      trailing: const Icon(Icons.chevron_right, color: Colors.grey),
      onTap: onTap,
    );
  }

  void _navigateTo(BuildContext context, Widget screen) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => screen),
    );
  }

  void _launchUrl(String url) {
    // TODO: Implement URL launching
  }

  void _showClearCacheDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Clear cache', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Are you sure you want to clear cache?',
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
                const SnackBar(content: Text('Cache cleared')),
              );
            },
            child: const Text('Clear', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Log out', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Are you sure you want to log out?',
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
              Provider.of<AuthProvider>(context, listen: false).logout();
              Navigator.of(context).pushNamedAndRemoveUntil(
                '/login',
                (route) => false,
              );
            },
            child: const Text('Log out', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}