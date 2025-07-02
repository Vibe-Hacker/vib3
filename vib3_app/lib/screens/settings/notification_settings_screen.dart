import 'package:flutter/material.dart';

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  bool _pushNotifications = true;
  bool _emailNotifications = false;
  bool _likes = true;
  bool _comments = true;
  bool _newFollowers = true;
  bool _videoUpdates = false;
  bool _mentions = true;
  bool _directMessages = true;
  bool _liveNotifications = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Notifications'),
      ),
      body: ListView(
        children: [
          // General
          _buildSectionHeader('GENERAL'),
          SwitchListTile(
            title: const Text('Push notifications',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Allow VIB3 to send you push notifications',
              style: TextStyle(color: Colors.grey)),
            value: _pushNotifications,
            onChanged: (value) {
              setState(() => _pushNotifications = value);
            },
            activeColor: const Color(0xFFFF0080),
          ),
          SwitchListTile(
            title: const Text('Email notifications',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Receive notifications via email',
              style: TextStyle(color: Colors.grey)),
            value: _emailNotifications,
            onChanged: (value) {
              setState(() => _emailNotifications = value);
            },
            activeColor: const Color(0xFFFF0080),
          ),
          
          // Interactions
          _buildSectionHeader('INTERACTIONS'),
          SwitchListTile(
            title: const Text('Likes',
              style: TextStyle(color: Colors.white)),
            value: _likes,
            onChanged: _pushNotifications ? (value) {
              setState(() => _likes = value);
            } : null,
            activeColor: const Color(0xFFFF0080),
          ),
          SwitchListTile(
            title: const Text('Comments',
              style: TextStyle(color: Colors.white)),
            value: _comments,
            onChanged: _pushNotifications ? (value) {
              setState(() => _comments = value);
            } : null,
            activeColor: const Color(0xFFFF0080),
          ),
          SwitchListTile(
            title: const Text('Mentions and tags',
              style: TextStyle(color: Colors.white)),
            value: _mentions,
            onChanged: _pushNotifications ? (value) {
              setState(() => _mentions = value);
            } : null,
            activeColor: const Color(0xFFFF0080),
          ),
          SwitchListTile(
            title: const Text('New followers',
              style: TextStyle(color: Colors.white)),
            value: _newFollowers,
            onChanged: _pushNotifications ? (value) {
              setState(() => _newFollowers = value);
            } : null,
            activeColor: const Color(0xFFFF0080),
          ),
          
          // Messages
          _buildSectionHeader('MESSAGES'),
          SwitchListTile(
            title: const Text('Direct messages',
              style: TextStyle(color: Colors.white)),
            value: _directMessages,
            onChanged: _pushNotifications ? (value) {
              setState(() => _directMessages = value);
            } : null,
            activeColor: const Color(0xFFFF0080),
          ),
          
          // Content
          _buildSectionHeader('CONTENT'),
          SwitchListTile(
            title: const Text('Video updates from accounts you follow',
              style: TextStyle(color: Colors.white)),
            value: _videoUpdates,
            onChanged: _pushNotifications ? (value) {
              setState(() => _videoUpdates = value);
            } : null,
            activeColor: const Color(0xFFFF0080),
          ),
          SwitchListTile(
            title: const Text('LIVE videos',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('When accounts you follow go live',
              style: TextStyle(color: Colors.grey)),
            value: _liveNotifications,
            onChanged: _pushNotifications ? (value) {
              setState(() => _liveNotifications = value);
            } : null,
            activeColor: const Color(0xFFFF0080),
          ),
          
          // Other options
          _buildSectionHeader('OTHER'),
          ListTile(
            title: const Text('Notification sound',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Default',
              style: TextStyle(color: Colors.grey)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {
              _showSoundOptionsDialog();
            },
          ),
          ListTile(
            title: const Text('Do not disturb',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Set quiet hours',
              style: TextStyle(color: Colors.grey)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {
              _showDoNotDisturbDialog();
            },
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

  void _showSoundOptionsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Notification Sound',
          style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildSoundOption('Default', true),
            _buildSoundOption('Bell', false),
            _buildSoundOption('Chime', false),
            _buildSoundOption('Pop', false),
            _buildSoundOption('None', false),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Done', style: TextStyle(color: Color(0xFFFF0080))),
          ),
        ],
      ),
    );
  }

  Widget _buildSoundOption(String sound, bool isSelected) {
    return ListTile(
      title: Text(sound, style: const TextStyle(color: Colors.white)),
      trailing: isSelected
          ? const Icon(Icons.check, color: Color(0xFFFF0080))
          : null,
      onTap: () {
        Navigator.pop(context);
      },
    );
  }

  void _showDoNotDisturbDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Do Not Disturb',
          style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Set quiet hours when you won\'t receive notifications',
              style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('From', style: TextStyle(color: Colors.grey)),
                      TextButton(
                        onPressed: () {},
                        child: const Text('10:00 PM', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('To', style: TextStyle(color: Colors.grey)),
                      TextButton(
                        onPressed: () {},
                        child: const Text('8:00 AM', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Save', style: TextStyle(color: Color(0xFFFF0080))),
          ),
        ],
      ),
    );
  }
}