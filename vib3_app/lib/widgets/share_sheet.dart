import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'dart:io' show Platform;
import '../models/video.dart';
import 'qr_share_dialog.dart';

/// Share sheet with platform-specific options
class ShareSheet extends StatefulWidget {
  final Video video;
  final VoidCallback? onDuet;
  final VoidCallback? onStitch;
  
  const ShareSheet({
    super.key,
    required this.video,
    this.onDuet,
    this.onStitch,
  });
  
  @override
  State<ShareSheet> createState() => _ShareSheetState();
}

class _ShareSheetState extends State<ShareSheet> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _slideAnimation;
  
  // Platform share options
  final List<ShareOption> _platformOptions = [];
  
  // VIB3 specific options
  final List<ShareOption> _vib3Options = [];
  
  @override
  void initState() {
    super.initState();
    
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _slideAnimation = Tween<double>(
      begin: 1.0,
      end: 0.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ));
    
    _animationController.forward();
    _initializeShareOptions();
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
  
  void _initializeShareOptions() {
    // VIB3 specific options
    _vib3Options.addAll([
      ShareOption(
        icon: Icons.copy_all,
        label: 'Duet',
        color: const Color(0xFF00CED1),
        onTap: () {
          Navigator.pop(context);
          widget.onDuet?.call();
        },
      ),
      ShareOption(
        icon: Icons.cut,
        label: 'Stitch',
        color: const Color(0xFFFF1493),
        onTap: () {
          Navigator.pop(context);
          widget.onStitch?.call();
        },
      ),
      ShareOption(
        icon: Icons.download,
        label: 'Save video',
        color: const Color(0xFF9370DB),
        onTap: () => _saveVideo(),
      ),
      ShareOption(
        icon: Icons.report_problem_outlined,
        label: 'Report',
        color: Colors.red,
        onTap: () => _reportVideo(),
      ),
    ]);
    
    // Platform specific share options
    _platformOptions.addAll([
      ShareOption(
        icon: Icons.link,
        label: 'Copy link',
        color: Colors.grey,
        onTap: () => _copyLink(),
      ),
      ShareOption(
        icon: Icons.share,
        label: 'Share to...',
        color: Colors.blue,
        onTap: () => _shareToSystem(),
      ),
      ShareOption(
        icon: Icons.qr_code,
        label: 'QR Code',
        color: Colors.purple,
        onTap: () => _showQRCode(),
      ),
    ]);
    
    // Add platform-specific options
    if (!kIsWeb) {
      _platformOptions.addAll([
        ShareOption(
          iconPath: 'assets/icons/whatsapp.png',
          label: 'WhatsApp',
          color: const Color(0xFF25D366),
          onTap: () => _shareToWhatsApp(),
        ),
        ShareOption(
          iconPath: 'assets/icons/instagram.png',
          label: 'Instagram',
          color: const Color(0xFFE4405F),
          onTap: () => _shareToInstagram(),
        ),
        ShareOption(
          iconPath: 'assets/icons/twitter.png',
          label: 'Twitter',
          color: const Color(0xFF1DA1F2),
          onTap: () => _shareToTwitter(),
        ),
        ShareOption(
          iconPath: 'assets/icons/facebook.png',
          label: 'Facebook',
          color: const Color(0xFF1877F2),
          onTap: () => _shareToFacebook(),
        ),
        ShareOption(
          iconPath: 'assets/icons/snapchat.png',
          label: 'Snapchat',
          color: const Color(0xFFFFFC00),
          onTap: () => _shareToSnapchat(),
        ),
        ShareOption(
          iconPath: 'assets/icons/telegram.png',
          label: 'Telegram',
          color: const Color(0xFF0088CC),
          onTap: () => _shareToTelegram(),
        ),
      ]);
    }
    
    // Add SMS option for mobile
    if (!kIsWeb && (Platform.isAndroid || Platform.isIOS)) {
      _platformOptions.add(
        ShareOption(
          icon: Icons.sms,
          label: 'SMS',
          color: Colors.green,
          onTap: () => _shareViaSMS(),
        ),
      );
    }
    
    // Add email option
    _platformOptions.add(
      ShareOption(
        icon: Icons.email,
        label: 'Email',
        color: Colors.orange,
        onTap: () => _shareViaEmail(),
      ),
    );
  }
  
  void _copyLink() {
    final videoUrl = 'https://vib3.app/v/${widget.video.id}';
    Clipboard.setData(ClipboardData(text: videoUrl));
    
    HapticFeedback.mediumImpact();
    Navigator.pop(context);
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Link copied to clipboard!'),
        duration: Duration(seconds: 2),
      ),
    );
  }
  
  void _shareToSystem() {
    // TODO: Implement system share sheet
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Opening share menu...')),
    );
  }
  
  void _shareToWhatsApp() {
    // TODO: Implement WhatsApp share
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Sharing to WhatsApp...')),
    );
  }
  
  void _shareToInstagram() {
    // TODO: Implement Instagram share
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Sharing to Instagram...')),
    );
  }
  
  void _shareToTwitter() {
    // TODO: Implement Twitter share
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Sharing to Twitter...')),
    );
  }
  
  void _shareToFacebook() {
    // TODO: Implement Facebook share
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Sharing to Facebook...')),
    );
  }
  
  void _shareToSnapchat() {
    // TODO: Implement Snapchat share
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Sharing to Snapchat...')),
    );
  }
  
  void _shareToTelegram() {
    // TODO: Implement Telegram share
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Sharing to Telegram...')),
    );
  }
  
  void _shareViaSMS() {
    // TODO: Implement SMS share
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Opening SMS...')),
    );
  }
  
  void _shareViaEmail() {
    // TODO: Implement email share
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Opening email...')),
    );
  }
  
  void _saveVideo() {
    // TODO: Implement video download
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Saving video...'),
        backgroundColor: Color(0xFF9370DB),
      ),
    );
  }
  
  void _reportVideo() {
    Navigator.pop(context);
    _showReportDialog();
  }
  
  void _showQRCode() {
    Navigator.pop(context);
    showDialog(
      context: context,
      builder: (context) => QRShareDialog(video: widget.video),
    );
  }
  
  void _showReportDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Report Video',
          style: TextStyle(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildReportOption('Inappropriate content'),
            _buildReportOption('Spam or misleading'),
            _buildReportOption('Violence or dangerous acts'),
            _buildReportOption('Hateful or abusive content'),
            _buildReportOption('Harmful or dangerous acts'),
            _buildReportOption('Other'),
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
  
  Widget _buildReportOption(String reason) {
    return ListTile(
      title: Text(
        reason,
        style: const TextStyle(color: Colors.white),
      ),
      onTap: () {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Thank you for reporting. We\'ll review this video.'),
            backgroundColor: Colors.red,
          ),
        );
      },
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _slideAnimation,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, _slideAnimation.value * 500),
          child: child,
        );
      },
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.8,
        ),
        decoration: const BoxDecoration(
          color: Color(0xFF1A1A1A),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[600],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            
            // Title
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: Text(
                'Share this VIB3',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            
            // Video info
            if (widget.video.description != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  widget.video.description!,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                ),
              ),
            
            const SizedBox(height: 16),
            
            // VIB3 Options
            if (_vib3Options.isNotEmpty) ...[
              _buildSectionTitle('VIB3 Options'),
              Container(
                height: 100,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _vib3Options.length,
                  itemBuilder: (context, index) {
                    return _buildShareOptionItem(_vib3Options[index]);
                  },
                ),
              ),
              const SizedBox(height: 16),
            ],
            
            // Platform Options
            _buildSectionTitle('Share to'),
            Flexible(
              child: GridView.builder(
                shrinkWrap: true,
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 0.8,
                ),
                itemCount: _platformOptions.length,
                itemBuilder: (context, index) {
                  return _buildShareOptionItem(_platformOptions[index]);
                },
              ),
            ),
            
            // Cancel button
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: () => Navigator.pop(context),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Colors.white.withOpacity(0.1),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Cancel',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
  
  Widget _buildShareOptionItem(ShareOption option) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        option.onTap();
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: option.color.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: option.iconPath != null
                  ? Image.asset(
                      option.iconPath!,
                      width: 28,
                      height: 28,
                      errorBuilder: (context, error, stackTrace) {
                        return Icon(
                          Icons.share,
                          color: option.color,
                          size: 28,
                        );
                      },
                    )
                  : Icon(
                      option.icon,
                      color: option.color,
                      size: 28,
                    ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            option.label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class ShareOption {
  final IconData? icon;
  final String? iconPath;
  final String label;
  final Color color;
  final VoidCallback onTap;
  
  ShareOption({
    this.icon,
    this.iconPath,
    required this.label,
    required this.color,
    required this.onTap,
  });
}