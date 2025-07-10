import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../models/privacy_settings.dart';
import '../services/privacy_service.dart';
import '../widgets/privacy_section.dart';
import 'blocked_users_screen.dart';
import 'security_settings_screen.dart';

class PrivacySettingsScreen extends StatefulWidget {
  const PrivacySettingsScreen({super.key});

  @override
  State<PrivacySettingsScreen> createState() => _PrivacySettingsScreenState();
}

class _PrivacySettingsScreenState extends State<PrivacySettingsScreen> {
  PrivacySettings? _settings;
  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    final userId = authProvider.currentUser?.id;

    if (token == null || userId == null) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final settings = await PrivacyService.getPrivacySettings(
        userId: userId,
        token: token,
      );

      if (mounted) {
        setState(() {
          _settings = settings;
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

  Future<void> _saveSettings() async {
    if (_settings == null) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;

    if (token == null) return;

    setState(() {
      _isSaving = true;
    });

    HapticFeedback.mediumImpact();

    final success = await PrivacyService.updatePrivacySettings(
      settings: _settings!,
      token: token,
    );

    if (mounted) {
      setState(() {
        _isSaving = false;
      });

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Privacy settings updated'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to update settings'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _updateSettings(PrivacySettings newSettings) {
    setState(() {
      _settings = newSettings;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 2,
        title: const Text(
          'Privacy & Safety',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          if (_settings != null)
            TextButton(
              onPressed: _isSaving ? null : _saveSettings,
              child: _isSaving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'Save',
                      style: TextStyle(
                        color: Color(0xFF00CED1),
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF00CED1),
              ),
            )
          : _settings == null
              ? const Center(
                  child: Text(
                    'Failed to load privacy settings',
                    style: TextStyle(color: Colors.white),
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Account Privacy
                    PrivacySection(
                      title: 'Account Privacy',
                      icon: Icons.account_circle,
                      children: [
                        _buildPrivacyTile(
                          title: 'Profile Visibility',
                          subtitle: 'Who can see your profile',
                          value: _settings!.profileVisibility,
                          onChanged: (value) {
                            _updateSettings(_settings!.copyWith(
                              profileVisibility: value,
                            ));
                          },
                        ),
                        _buildPrivacyTile(
                          title: 'Video Visibility',
                          subtitle: 'Who can see your videos',
                          value: _settings!.videoVisibility,
                          onChanged: (value) {
                            _updateSettings(_settings!.copyWith(
                              videoVisibility: value,
                            ));
                          },
                        ),
                        _buildPrivacyTile(
                          title: 'Message Visibility',
                          subtitle: 'Who can send you messages',
                          value: _settings!.messageVisibility,
                          onChanged: (value) {
                            _updateSettings(_settings!.copyWith(
                              messageVisibility: value,
                            ));
                          },
                        ),
                        _buildSwitchTile(
                          title: 'Require Follow Approval',
                          subtitle: 'Approve followers manually',
                          value: _settings!.requireFollowApproval,
                          onChanged: (value) {
                            _updateSettings(_settings!.copyWith(
                              requireFollowApproval: value,
                            ));
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Content Interactions
                    PrivacySection(
                      title: 'Content Interactions',
                      icon: Icons.thumb_up,
                      children: [
                        _buildSwitchTile(
                          title: 'Allow Comments',
                          subtitle: 'Let others comment on your videos',
                          value: _settings!.allowComments,
                          onChanged: (value) {
                            _updateSettings(_settings!.copyWith(
                              allowComments: value,
                            ));
                          },
                        ),
                        _buildSwitchTile(
                          title: 'Allow Duets',
                          subtitle: 'Let others duet with your videos',
                          value: _settings!.allowDuet,
                          onChanged: (value) {
                            _updateSettings(_settings!.copyWith(
                              allowDuet: value,
                            ));
                          },
                        ),
                        _buildSwitchTile(
                          title: 'Allow Reactions',
                          subtitle: 'Let others react to your videos',
                          value: _settings!.allowReactions,
                          onChanged: (value) {
                            _updateSettings(_settings!.copyWith(
                              allowReactions: value,
                            ));
                          },
                        ),
                        _buildSwitchTile(
                          title: 'Allow Downloads',
                          subtitle: 'Let others download your videos',
                          value: _settings!.allowDownloads,
                          onChanged: (value) {
                            _updateSettings(_settings!.copyWith(
                              allowDownloads: value,
                            ));
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Social Features
                    PrivacySection(
                      title: 'Social Features',
                      icon: Icons.people,
                      children: [
                        _buildSwitchTile(
                          title: 'Allow Mentions',
                          subtitle: 'Let others mention you in posts',
                          value: _settings!.allowMentions,
                          onChanged: (value) {
                            _updateSettings(_settings!.copyWith(
                              allowMentions: value,
                            ));
                          },
                        ),
                        _buildSwitchTile(
                          title: 'Allow Tagging',
                          subtitle: 'Let others tag you in videos',
                          value: _settings!.allowTagging,
                          onChanged: (value) {
                            _updateSettings(_settings!.copyWith(
                              allowTagging: value,
                            ));
                          },
                        ),
                        _buildSwitchTile(
                          title: 'Show Online Status',
                          subtitle: 'Let others see when you\'re online',
                          value: _settings!.showOnlineStatus,
                          onChanged: (value) {
                            _updateSettings(_settings!.copyWith(
                              showOnlineStatus: value,
                            ));
                          },
                        ),
                        _buildSwitchTile(
                          title: 'Show Activity',
                          subtitle: 'Let others see your activity',
                          value: _settings!.showActivity,
                          onChanged: (value) {
                            _updateSettings(_settings!.copyWith(
                              showActivity: value,
                            ));
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Profile Visibility
                    PrivacySection(
                      title: 'Profile Visibility',
                      icon: Icons.visibility,
                      children: [
                        _buildSwitchTile(
                          title: 'Show Following List',
                          subtitle: 'Let others see who you follow',
                          value: _settings!.showFollowingList,
                          onChanged: (value) {
                            _updateSettings(_settings!.copyWith(
                              showFollowingList: value,
                            ));
                          },
                        ),
                        _buildSwitchTile(
                          title: 'Show Followers List',
                          subtitle: 'Let others see your followers',
                          value: _settings!.showFollowersList,
                          onChanged: (value) {
                            _updateSettings(_settings!.copyWith(
                              showFollowersList: value,
                            ));
                          },
                        ),
                        _buildSwitchTile(
                          title: 'Show Liked Videos',
                          subtitle: 'Let others see videos you liked',
                          value: _settings!.showLikedVideos,
                          onChanged: (value) {
                            _updateSettings(_settings!.copyWith(
                              showLikedVideos: value,
                            ));
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Safety Features
                    PrivacySection(
                      title: 'Safety Features',
                      icon: Icons.security,
                      children: [
                        _buildSwitchTile(
                          title: 'Filter Offensive Comments',
                          subtitle: 'Automatically hide offensive comments',
                          value: _settings!.filterOffensiveComments,
                          onChanged: (value) {
                            _updateSettings(_settings!.copyWith(
                              filterOffensiveComments: value,
                            ));
                          },
                        ),
                        _buildSwitchTile(
                          title: 'Restricted Mode',
                          subtitle: 'Filter out potentially mature content',
                          value: _settings!.restrictedMode,
                          onChanged: (value) {
                            _updateSettings(_settings!.copyWith(
                              restrictedMode: value,
                            ));
                          },
                        ),
                        _buildNavigationTile(
                          title: 'Blocked Users',
                          subtitle: '${_settings!.blockedUsers.length} blocked',
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const BlockedUsersScreen(),
                              ),
                            );
                          },
                        ),
                        _buildNavigationTile(
                          title: 'Restricted Words',
                          subtitle: '${_settings!.restrictedWords.length} words',
                          onTap: () {
                            _showRestrictedWordsDialog();
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Security
                    PrivacySection(
                      title: 'Security',
                      icon: Icons.lock,
                      children: [
                        _buildNavigationTile(
                          title: 'Security Settings',
                          subtitle: 'Two-factor authentication, login activity',
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const SecuritySettingsScreen(),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ],
                ),
    );
  }

  Widget _buildPrivacyTile({
    required String title,
    required String subtitle,
    required PrivacyLevel value,
    required Function(PrivacyLevel) onChanged,
  }) {
    return ListTile(
      title: Text(
        title,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(
          color: Colors.white54,
          fontSize: 14,
        ),
      ),
      trailing: DropdownButton<PrivacyLevel>(
        value: value,
        onChanged: (newValue) {
          if (newValue != null) {
            onChanged(newValue);
          }
        },
        dropdownColor: const Color(0xFF1A1A1A),
        underline: Container(),
        items: PrivacyLevel.values.map((level) {
          return DropdownMenuItem(
            value: level,
            child: Text(
              _getPrivacyLevelName(level),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required bool value,
    required Function(bool) onChanged,
  }) {
    return SwitchListTile(
      title: Text(
        title,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(
          color: Colors.white54,
          fontSize: 14,
        ),
      ),
      value: value,
      onChanged: onChanged,
      activeColor: const Color(0xFF00CED1),
    );
  }

  Widget _buildNavigationTile({
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      title: Text(
        title,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        subtitle,
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
      onTap: onTap,
    );
  }

  String _getPrivacyLevelName(PrivacyLevel level) {
    switch (level) {
      case PrivacyLevel.public:
        return 'Public';
      case PrivacyLevel.friends:
        return 'Friends';
      case PrivacyLevel.private:
        return 'Private';
    }
  }

  void _showRestrictedWordsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Restricted Words',
          style: TextStyle(color: Colors.white),
        ),
        content: SizedBox(
          width: double.maxFinite,
          height: 300,
          child: Column(
            children: [
              const Text(
                'Words that will be filtered from comments',
                style: TextStyle(color: Colors.white70),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: ListView.builder(
                  itemCount: _settings!.restrictedWords.length,
                  itemBuilder: (context, index) {
                    final word = _settings!.restrictedWords[index];
                    return ListTile(
                      title: Text(
                        word,
                        style: const TextStyle(color: Colors.white),
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        onPressed: () {
                          final newWords = List<String>.from(_settings!.restrictedWords);
                          newWords.removeAt(index);
                          _updateSettings(_settings!.copyWith(
                            restrictedWords: newWords,
                          ));
                          Navigator.pop(context);
                          _showRestrictedWordsDialog();
                        },
                      ),
                    );
                  },
                ),
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
}