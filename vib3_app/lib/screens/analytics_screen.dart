import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/analytics_service.dart';
import '../widgets/analytics_chart.dart';
import 'package:intl/intl.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, dynamic> _analyticsData = {};
  bool _isLoading = true;
  int _selectedPeriod = 7;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadAnalytics();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAnalytics() async {
    setState(() => _isLoading = true);
    
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.authToken;
      
      if (token != null) {
        final data = await AnalyticsService.getAnalytics(
          token: token,
          period: _selectedPeriod,
        );
        
        if (mounted) {
          setState(() {
            _analyticsData = data;
            _isLoading = false;
          });
          
          // Debug log to check data
          print('📊 Analytics data loaded:');
          print('  - Total views: ${data['totalViews']}');
          print('  - Top videos: ${(data['topVideos'] as List?)?.length ?? 0}');
          print('  - Demographics: ${data['demographics']}');
          print('  - Traffic sources: ${data['trafficSources']}');
        }
      } else {
        if (mounted) {
          setState(() => _isLoading = false);
        }
      }
    } catch (e) {
      print('Error loading analytics: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String _formatNumber(dynamic value) {
    if (value == null) return '0';
    final num = value is int ? value : (value as double).toInt();
    if (num >= 1000000) {
      return '${(num / 1000000).toStringAsFixed(1)}M';
    } else if (num >= 1000) {
      return '${(num / 1000).toStringAsFixed(1)}K';
    }
    return num.toString();
  }

  Widget _buildStatCard(String title, dynamic value, dynamic change, IconData icon) {
    final isPositive = (change ?? 0) >= 0;
    
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, color: Colors.white.withOpacity(0.6), size: 18),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 11,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              _formatNumber(value),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(
                isPositive ? Icons.trending_up : Icons.trending_down,
                color: isPositive ? Colors.green : Colors.red,
                size: 14,
              ),
              const SizedBox(width: 2),
              Text(
                '${change?.toStringAsFixed(1) ?? '0'}%',
                style: TextStyle(
                  color: isPositive ? Colors.green : Colors.red,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.3,
            children: [
              _buildStatCard(
                'Video Views',
                _analyticsData['totalViews'],
                _analyticsData['viewsChange'],
                Icons.play_circle_outline,
              ),
              _buildStatCard(
                'Profile Views',
                _analyticsData['profileViews'],
                _analyticsData['profileViewsChange'],
                Icons.person_outline,
              ),
              _buildStatCard(
                'Likes',
                _analyticsData['totalLikes'],
                _analyticsData['likesChange'],
                Icons.favorite_outline,
              ),
              _buildStatCard(
                'Comments',
                _analyticsData['totalComments'],
                _analyticsData['commentsChange'],
                Icons.chat_bubble_outline,
              ),
              _buildStatCard(
                'Shares',
                _analyticsData['totalShares'],
                _analyticsData['sharesChange'],
                Icons.share_outlined,
              ),
              _buildStatCard(
                'New Followers',
                _analyticsData['newFollowers'],
                _analyticsData['followersChange'],
                Icons.group_add_outlined,
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          if (_analyticsData['viewsHistory'] != null) ...[
            Text(
              'Views Trend',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: AnalyticsChart(
                data: List<double>.from(_analyticsData['viewsHistory']),
                period: _selectedPeriod,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildContentTab() {
    final topVideos = _analyticsData['topVideos'] as List<dynamic>? ?? [];
    
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Top Performing Videos',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        
        if (topVideos.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Text(
                'No video data available',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.5),
                  fontSize: 16,
                ),
              ),
            ),
          )
        else
          ...topVideos.map((video) => _buildVideoCard(video)),
      ],
    );
  }

  Widget _buildVideoCard(dynamic video) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.video_library,
              color: Colors.white.withOpacity(0.5),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  video['title'] ?? 'Untitled',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _buildVideoStat(Icons.play_arrow, video['views']),
                    const SizedBox(width: 16),
                    _buildVideoStat(Icons.favorite, video['likes']),
                    const SizedBox(width: 16),
                    _buildVideoStat(Icons.chat_bubble, video['comments']),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVideoStat(IconData icon, dynamic value) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.white.withOpacity(0.5)),
        const SizedBox(width: 4),
        Text(
          _formatNumber(value),
          style: TextStyle(
            color: Colors.white.withOpacity(0.7),
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildAudienceTab() {
    final demographics = _analyticsData['demographics'] as Map<String, dynamic>? ?? {};
    final topLocations = _analyticsData['topLocations'] as List<dynamic>? ?? [];
    
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Gender Distribution',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildGenderCard(
                'Male',
                _analyticsData['genderMale']?.toDouble() ?? 0,
                Icons.male,
                Colors.blue,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildGenderCard(
                'Female',
                _analyticsData['genderFemale']?.toDouble() ?? 0,
                Icons.female,
                Colors.pink,
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 24),
        
        Text(
          'Age Distribution',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        ...demographics.entries.map((entry) => _buildAgeBar(entry.key, entry.value.toDouble())),
        
        const SizedBox(height: 24),
        
        Text(
          'Top Locations',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        ...topLocations.map((location) => _buildLocationItem(location)),
      ],
    );
  }

  Widget _buildGenderCard(String label, double percentage, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 8),
          Text(
            '${percentage.toStringAsFixed(0)}%',
            style: TextStyle(
              color: color,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAgeBar(String ageRange, double percentage) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                ageRange,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 14,
                ),
              ),
              Text(
                '${percentage.toStringAsFixed(1)}%',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          LinearProgressIndicator(
            value: percentage / 100,
            backgroundColor: Colors.white.withOpacity(0.1),
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF00CED1)),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationItem(dynamic location) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            location['name'] ?? '',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
            ),
          ),
          Text(
            '${location['percentage']}%',
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInsightsTab() {
    final trafficSources = _analyticsData['trafficSources'] as Map<String, dynamic>? ?? {};
    
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Color(0xFF00CED1).withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Color(0xFF00CED1).withOpacity(0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.access_time, color: Color(0xFF00CED1)),
                  const SizedBox(width: 8),
                  Text(
                    'Best Posting Time',
                    style: TextStyle(
                      color: Color(0xFF00CED1),
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                _analyticsData['bestPostingTime'] ?? '6:00 PM - 9:00 PM',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                ),
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 16),
        
        Row(
          children: [
            Expanded(
              child: _buildInsightCard(
                'Avg Watch Time',
                '${_analyticsData['avgWatchTime'] ?? 0}s',
                Icons.timer,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildInsightCard(
                'Completion Rate',
                '${_analyticsData['completionRate'] ?? 0}%',
                Icons.check_circle_outline,
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 24),
        
        Text(
          'Traffic Sources',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        ...trafficSources.entries.map(
          (entry) => _buildTrafficSource(entry.key, entry.value.toDouble()),
        ),
        
        const SizedBox(height: 24),
        
        Text(
          'Top Hashtags',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: (_analyticsData['topHashtags'] as List<dynamic>? ?? [])
              .map((tag) => _buildHashtagChip(tag))
              .toList(),
        ),
      ],
    );
  }

  Widget _buildInsightCard(String title, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.white.withOpacity(0.6), size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            title,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrafficSource(String source, double percentage) {
    final formattedSource = source.replaceAll('forYou', 'VIB3 Pulse')
        .replaceAll('following', 'VIB3 Connect')
        .replaceAll('profile', 'Profile')
        .replaceAll('search', 'Search')
        .replaceAll('other', 'Other');
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                formattedSource,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 14,
                ),
              ),
              Text(
                '${percentage.toStringAsFixed(1)}%',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          LinearProgressIndicator(
            value: percentage / 100,
            backgroundColor: Colors.white.withOpacity(0.1),
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF0080)),
          ),
        ],
      ),
    );
  }

  Widget _buildHashtagChip(String hashtag) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.2)),
      ),
      child: Text(
        hashtag,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 14,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Analytics'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(100),
          child: Column(
            children: [
              Container(
                height: 40,
                margin: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    _buildPeriodChip('7D', 7),
                    const SizedBox(width: 8),
                    _buildPeriodChip('30D', 30),
                    const SizedBox(width: 8),
                    _buildPeriodChip('90D', 90),
                  ],
                ),
              ),
              TabBar(
                controller: _tabController,
                indicatorColor: const Color(0xFF00CED1),
                indicatorWeight: 3,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white.withOpacity(0.5),
                tabs: const [
                  Tab(text: 'Overview'),
                  Tab(text: 'Content'),
                  Tab(text: 'Audience'),
                  Tab(text: 'Insights'),
                ],
              ),
            ],
          ),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF00CED1),
              ),
            )
          : TabBarView(
              controller: _tabController,
              children: [
                _buildOverviewTab(),
                _buildContentTab(),
                _buildAudienceTab(),
                _buildInsightsTab(),
              ],
            ),
    );
  }

  Widget _buildPeriodChip(String label, int days) {
    final isSelected = _selectedPeriod == days;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedPeriod = days;
        });
        _loadAnalytics();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF00CED1) : Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF00CED1) : Colors.white.withOpacity(0.2),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.black : Colors.white,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}