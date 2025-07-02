import 'package:flutter/material.dart';

class ContentPreferencesScreen extends StatefulWidget {
  const ContentPreferencesScreen({super.key});

  @override
  State<ContentPreferencesScreen> createState() => _ContentPreferencesScreenState();
}

class _ContentPreferencesScreenState extends State<ContentPreferencesScreen> {
  bool _digitalWellbeing = false;
  bool _restrictedMode = false;
  String _contentLanguage = 'English';
  List<String> _interests = ['Music', 'Dance', 'Comedy'];
  final List<String> _availableInterests = [
    'Music', 'Dance', 'Comedy', 'Food', 'Travel', 'Fashion', 
    'Beauty', 'Sports', 'Gaming', 'Education', 'Art', 'Animals'
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Content preferences'),
      ),
      body: ListView(
        children: [
          // Content filtering
          _buildSectionHeader('CONTENT FILTERING'),
          SwitchListTile(
            title: const Text('Restricted Mode',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Filter out content that may not be suitable for all audiences',
              style: TextStyle(color: Colors.grey)),
            value: _restrictedMode,
            onChanged: (value) {
              setState(() => _restrictedMode = value);
            },
            activeColor: const Color(0xFFFF0080),
          ),
          SwitchListTile(
            title: const Text('Digital Wellbeing',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Manage your time on VIB3',
              style: TextStyle(color: Colors.grey)),
            value: _digitalWellbeing,
            onChanged: (value) {
              setState(() => _digitalWellbeing = value);
            },
            activeColor: const Color(0xFFFF0080),
          ),
          ListTile(
            title: const Text('Content language',
              style: TextStyle(color: Colors.white)),
            subtitle: Text(_contentLanguage,
              style: const TextStyle(color: Colors.grey)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {
              _showLanguageDialog();
            },
          ),
          
          // Interests
          _buildSectionHeader('YOUR INTERESTS'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'We\'ll suggest content based on your interests',
                  style: TextStyle(color: Colors.grey, fontSize: 14),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _availableInterests.map((interest) {
                    final isSelected = _interests.contains(interest);
                    return FilterChip(
                      label: Text(interest),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() {
                          if (selected) {
                            _interests.add(interest);
                          } else {
                            _interests.remove(interest);
                          }
                        });
                      },
                      backgroundColor: const Color(0xFF1A1A1A),
                      selectedColor: const Color(0xFFFF0080),
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : Colors.grey,
                      ),
                      side: BorderSide(
                        color: isSelected ? const Color(0xFFFF0080) : Colors.grey,
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Blocked content
          _buildSectionHeader('BLOCKED CONTENT'),
          ListTile(
            title: const Text('Blocked words',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Hide videos with these words',
              style: TextStyle(color: Colors.grey)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {
              _showBlockedWordsDialog();
            },
          ),
          ListTile(
            title: const Text('Blocked accounts',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Accounts you\'ve blocked',
              style: TextStyle(color: Colors.grey)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {},
          ),
          ListTile(
            title: const Text('Blocked effects',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Effects you don\'t want to see',
              style: TextStyle(color: Colors.grey)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {},
          ),
          
          // Data usage
          _buildSectionHeader('DATA USAGE'),
          ListTile(
            title: const Text('Data saver',
              style: TextStyle(color: Colors.white)),
            subtitle: const Text('Reduce data usage',
              style: TextStyle(color: Colors.grey)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () {
              _showDataSaverDialog();
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

  void _showLanguageDialog() {
    final languages = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean'];
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Content Language',
          style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: languages.map((language) {
            return ListTile(
              title: Text(language, style: const TextStyle(color: Colors.white)),
              trailing: _contentLanguage == language
                  ? const Icon(Icons.check, color: Color(0xFFFF0080))
                  : null,
              onTap: () {
                setState(() => _contentLanguage = language);
                Navigator.pop(context);
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  void _showBlockedWordsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Blocked Words',
          style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Add words or phrases to hide videos containing them',
              style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 16),
            TextField(
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                hintText: 'Add word or phrase',
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
            onPressed: () => Navigator.pop(context),
            child: const Text('Add', style: TextStyle(color: Color(0xFFFF0080))),
          ),
        ],
      ),
    );
  }

  void _showDataSaverDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Data Saver',
          style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildDataOption('Off', 'Use data normally'),
            _buildDataOption('On', 'Reduce data usage'),
            _buildDataOption('Wi-Fi only', 'Only load videos on Wi-Fi'),
          ],
        ),
      ),
    );
  }

  Widget _buildDataOption(String title, String subtitle) {
    return ListTile(
      title: Text(title, style: const TextStyle(color: Colors.white)),
      subtitle: Text(subtitle, style: const TextStyle(color: Colors.grey)),
      onTap: () => Navigator.pop(context),
    );
  }
}