import 'package:flutter/material.dart';

class PrivacyScreen extends StatefulWidget {
  const PrivacyScreen({super.key});

  @override
  State<PrivacyScreen> createState() => _PrivacyScreenState();
}

class _PrivacyScreenState extends State<PrivacyScreen> {
  bool _privateAccount = false;
  bool _suggestAccount = true;
  bool _syncContacts = false;
  bool _allowComments = true;
  bool _allowDuet = true;
  bool _allowStitch = true;
  bool _allowDownloads = true;
  String _whoCanMessage = 'Everyone';
  String _whoCanView = 'Everyone';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Privacy'),
      ),
      body: ListView(
        children: [
          // Discoverability
          _buildSectionHeader('DISCOVERABILITY'),
          SwitchListTile(
            title: const Text('Private account', 
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Only approved followers can view your videos',
              style: TextStyle(color: Colors.grey)),
            value: _privateAccount,
            onChanged: (value) {
              setState(() => _privateAccount = value);
            },
            activeColor: const Color(0xFFFF0080),
          ),
          SwitchListTile(
            title: const Text('Suggest your account to others',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Allow your account to be suggested to other users',
              style: TextStyle(color: Colors.grey)),
            value: _suggestAccount,
            onChanged: (value) {
              setState(() => _suggestAccount = value);
            },
            activeColor: const Color(0xFFFF0080),
          ),
          SwitchListTile(
            title: const Text('Sync contacts and Facebook friends',
              style: TextStyle(color: Colors.white)),
            value: _syncContacts,
            onChanged: (value) {
              setState(() => _syncContacts = value);
            },
            activeColor: const Color(0xFFFF0080),
          ),
          
          // Personalization and data
          _buildSectionHeader('PERSONALIZATION AND DATA'),
          ListTile(
            title: const Text('Ads personalization',
              style: TextStyle(color: Colors.white)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {},
          ),
          ListTile(
            title: const Text('Download your data',
              style: TextStyle(color: Colors.white)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {},
          ),
          
          // Safety
          _buildSectionHeader('SAFETY'),
          ListTile(
            title: const Text('Who can send you direct messages',
              style: TextStyle(color: Colors.white)),
            subtitle: Text(_whoCanMessage,
              style: const TextStyle(color: Colors.grey)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () => _showMessageOptionsDialog(),
          ),
          ListTile(
            title: const Text('Who can view your liked videos',
              style: TextStyle(color: Colors.white)),
            subtitle: Text(_whoCanView,
              style: const TextStyle(color: Colors.grey)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () => _showViewOptionsDialog(),
          ),
          SwitchListTile(
            title: const Text('Filter comments',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Hide comments that may be offensive',
              style: TextStyle(color: Colors.grey)),
            value: _allowComments,
            onChanged: (value) {
              setState(() => _allowComments = value);
            },
            activeColor: const Color(0xFFFF0080),
          ),
          ListTile(
            title: const Text('Blocked accounts',
              style: TextStyle(color: Colors.white)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {},
          ),
          
          // Interactions
          _buildSectionHeader('INTERACTIONS'),
          SwitchListTile(
            title: const Text('Allow your videos to be used for Duets',
              style: TextStyle(color: Colors.white)),
            value: _allowDuet,
            onChanged: (value) {
              setState(() => _allowDuet = value);
            },
            activeColor: const Color(0xFFFF0080),
          ),
          SwitchListTile(
            title: const Text('Allow your videos to be used for Stitch',
              style: TextStyle(color: Colors.white)),
            value: _allowStitch,
            onChanged: (value) {
              setState(() => _allowStitch = value);
            },
            activeColor: const Color(0xFFFF0080),
          ),
          SwitchListTile(
            title: const Text('Allow downloads',
              style: TextStyle(color: Colors.white)),
            value: _allowDownloads,
            onChanged: (value) {
              setState(() => _allowDownloads = value);
            },
            activeColor: const Color(0xFFFF0080),
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

  void _showMessageOptionsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Who can send you direct messages',
          style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildOption('Everyone', _whoCanMessage == 'Everyone', () {
              setState(() => _whoCanMessage = 'Everyone');
              Navigator.pop(context);
            }),
            _buildOption('Friends', _whoCanMessage == 'Friends', () {
              setState(() => _whoCanMessage = 'Friends');
              Navigator.pop(context);
            }),
            _buildOption('No one', _whoCanMessage == 'No one', () {
              setState(() => _whoCanMessage = 'No one');
              Navigator.pop(context);
            }),
          ],
        ),
      ),
    );
  }

  void _showViewOptionsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Who can view your liked videos',
          style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildOption('Everyone', _whoCanView == 'Everyone', () {
              setState(() => _whoCanView = 'Everyone');
              Navigator.pop(context);
            }),
            _buildOption('Friends', _whoCanView == 'Friends', () {
              setState(() => _whoCanView = 'Friends');
              Navigator.pop(context);
            }),
            _buildOption('Only me', _whoCanView == 'Only me', () {
              setState(() => _whoCanView = 'Only me');
              Navigator.pop(context);
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildOption(String text, bool isSelected, VoidCallback onTap) {
    return ListTile(
      title: Text(text, style: const TextStyle(color: Colors.white)),
      trailing: isSelected
          ? const Icon(Icons.check, color: Color(0xFFFF0080))
          : null,
      onTap: onTap,
    );
  }
}