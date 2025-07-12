import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'dart:io' show Platform;
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:path_provider/path_provider.dart';
import 'package:dio/dio.dart';
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
  
  void _shareToSystem() async {
    final videoUrl = 'https://vib3.app/v/${widget.video.id}';
    final shareText = '${widget.video.description ?? "Check out this VIB3!"}\n\n$videoUrl';
    
    try {
      await Share.share(
        shareText,
        subject: 'Check out this VIB3!',
      );
      Navigator.pop(context);
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error sharing: $e')),
      );
    }
  }
  
  void _shareToWhatsApp() async {
    final videoUrl = 'https://vib3.app/v/${widget.video.id}';
    final shareText = '${widget.video.description ?? "Check out this VIB3!"} $videoUrl';
    final whatsappUrl = 'whatsapp://send?text=${Uri.encodeComponent(shareText)}';
    
    try {
      if (await canLaunchUrl(Uri.parse(whatsappUrl))) {
        await launchUrl(Uri.parse(whatsappUrl));
        Navigator.pop(context);
      } else {
        // Fallback to web WhatsApp
        final webUrl = 'https://wa.me/?text=${Uri.encodeComponent(shareText)}';
        await launchUrl(Uri.parse(webUrl), mode: LaunchMode.externalApplication);
        Navigator.pop(context);
      }
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('WhatsApp not available')),
      );
    }
  }
  
  void _shareToInstagram() async {
    final videoUrl = 'https://vib3.app/v/${widget.video.id}';
    try {
      // Instagram doesn't support direct URL sharing, but we can open the app
      await launchUrl(Uri.parse('instagram://'), mode: LaunchMode.externalApplication);
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Opened Instagram - share manually: $videoUrl')),
      );
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Instagram not available')),
      );
    }
  }
  
  void _shareToTwitter() async {
    final videoUrl = 'https://vib3.app/v/${widget.video.id}';
    final text = '${widget.video.description ?? "Check out this VIB3!"} $videoUrl #VIB3';
    final twitterUrl = 'twitter://post?message=${Uri.encodeComponent(text)}';
    
    try {
      if (await canLaunchUrl(Uri.parse(twitterUrl))) {
        await launchUrl(Uri.parse(twitterUrl));
      } else {
        // Fallback to web Twitter
        final webUrl = 'https://twitter.com/intent/tweet?text=${Uri.encodeComponent(text)}';
        await launchUrl(Uri.parse(webUrl), mode: LaunchMode.externalApplication);
      }
      Navigator.pop(context);
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Twitter not available')),
      );
    }
  }
  
  void _shareToFacebook() async {
    final videoUrl = 'https://vib3.app/v/${widget.video.id}';
    final facebookUrl = 'https://www.facebook.com/sharer/sharer.php?u=${Uri.encodeComponent(videoUrl)}';
    
    try {
      await launchUrl(Uri.parse(facebookUrl), mode: LaunchMode.externalApplication);
      Navigator.pop(context);
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Facebook not available')),
      );
    }
  }
  
  void _shareToSnapchat() async {
    final videoUrl = 'https://vib3.app/v/${widget.video.id}';
    try {
      await launchUrl(Uri.parse('snapchat://'), mode: LaunchMode.externalApplication);
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Opened Snapchat - share manually: $videoUrl')),
      );
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Snapchat not available')),
      );
    }
  }
  
  void _shareToTelegram() async {
    final videoUrl = 'https://vib3.app/v/${widget.video.id}';
    final shareText = '${widget.video.description ?? "Check out this VIB3!"} $videoUrl';
    final telegramUrl = 'tg://msg?text=${Uri.encodeComponent(shareText)}';
    
    try {
      if (await canLaunchUrl(Uri.parse(telegramUrl))) {
        await launchUrl(Uri.parse(telegramUrl));
      } else {
        // Fallback to web Telegram
        final webUrl = 'https://t.me/share/url?url=${Uri.encodeComponent(videoUrl)}&text=${Uri.encodeComponent(widget.video.description ?? "Check out this VIB3!")}';
        await launchUrl(Uri.parse(webUrl), mode: LaunchMode.externalApplication);
      }
      Navigator.pop(context);
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Telegram not available')),
      );
    }
  }
  
  void _shareViaSMS() async {
    final videoUrl = 'https://vib3.app/v/${widget.video.id}';
    final shareText = '${widget.video.description ?? "Check out this VIB3!"} $videoUrl';
    final smsUrl = 'sms:?body=${Uri.encodeComponent(shareText)}';
    
    try {
      await launchUrl(Uri.parse(smsUrl));
      Navigator.pop(context);
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('SMS not available')),
      );
    }
  }
  
  void _shareViaEmail() async {
    final videoUrl = 'https://vib3.app/v/${widget.video.id}';
    final subject = 'Check out this VIB3!';
    final body = '${widget.video.description ?? "Check out this amazing VIB3!"}\n\n$videoUrl';
    final emailUrl = 'mailto:?subject=${Uri.encodeComponent(subject)}&body=${Uri.encodeComponent(body)}';
    
    try {
      await launchUrl(Uri.parse(emailUrl));
      Navigator.pop(context);
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Email not available')),
      );
    }
  }
  
  void _saveVideo() async {
    Navigator.pop(context);
    
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Downloading video...'),
          backgroundColor: Color(0xFF9370DB),
        ),
      );
      
      // Get application documents directory
      final appDir = await getApplicationDocumentsDirectory();
      final videoFileName = 'vib3_${widget.video.id}.mp4';
      final savePath = '${appDir.path}/$videoFileName';
      
      // Download the video file
      final dio = Dio();
      await dio.download(
        widget.video.videoUrl!,
        savePath,
        onReceiveProgress: (received, total) {
          if (total != -1) {
            final progress = (received / total * 100).toStringAsFixed(0);
            print('Download progress: $progress%');
          }
        },
      );
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Video saved to: $savePath'),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 3),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to save video: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
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