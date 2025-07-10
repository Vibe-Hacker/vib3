import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/auth_provider.dart';
import '../services/analytics_service.dart';
import '../models/video.dart';
import '../widgets/analytics_chart.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> with TickerProviderStateMixin {
  late TabController _tabController;
  String _selectedPeriod = '7';
  Map<String, dynamic> _analyticsData = {};
  bool _isLoading = true;
  
  // Detailed analytics data
  List<FlSpot> _viewsData = [];
  List<FlSpot> _engagementData = [];
  List<Video> _topVideos = [];
  Map<String, double> _audienceData = {};
  Map<String, double> _trafficSources = {};
  
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
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      final data = await AnalyticsService.getAnalytics(
        token: token,
        period: int.parse(_selectedPeriod),
      );
      
      if (mounted) {
        setState(() {
          _analyticsData = data;
          _processAnalyticsData(data);
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
  
  void _processAnalyticsData(Map<String, dynamic> data) {
    // Process views data for chart
    final viewsHistory = data['viewsHistory'] as List? ?? [];
    _viewsData = viewsHistory.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), (entry.value as num).toDouble());
    }).toList();
    
    // Process engagement data
    final engagementHistory = data['engagementHistory'] as List? ?? [];
    _engagementData = engagementHistory.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), (entry.value as num).toDouble());
    }).toList();
    
    // Process top videos
    final topVideosData = data['topVideos'] as List? ?? [];
    _topVideos = topVideosData.map((v) => Video.fromJson(v)).toList();
    
    // Process audience data
    _audienceData = {
      '13-17': data['demographics']?['13-17']?.toDouble() ?? 0,
      '18-24': data['demographics']?['18-24']?.toDouble() ?? 0,
      '25-34': data['demographics']?['25-34']?.toDouble() ?? 0,
      '35-44': data['demographics']?['35-44']?.toDouble() ?? 0,
      '45+': data['demographics']?['45+']?.toDouble() ?? 0,
    };
    
    // Process traffic sources
    _trafficSources = {
      'For You': data['trafficSources']?['forYou']?.toDouble() ?? 0,
      'Following': data['trafficSources']?['following']?.toDouble() ?? 0,
      'Profile': data['trafficSources']?['profile']?.toDouble() ?? 0,
      'Search': data['trafficSources']?['search']?.toDouble() ?? 0,
      'Other': data['trafficSources']?['other']?.toDouble() ?? 0,
    };
  }
  
  void _exportAnalytics() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    // Show export format selection dialog
    final format = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Export Analytics',
          style: TextStyle(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Choose export format:',
              style: TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.table_chart, color: Color(0xFF00CED1)),
              title: const Text('CSV', style: TextStyle(color: Colors.white)),
              onTap: () => Navigator.pop(context, 'csv'),
            ),
            ListTile(
              leading: const Icon(Icons.description, color: Color(0xFF00CED1)),
              title: const Text('PDF', style: TextStyle(color: Colors.white)),
              onTap: () => Navigator.pop(context, 'pdf'),
            ),
            ListTile(
              leading: const Icon(Icons.code, color: Color(0xFF00CED1)),
              title: const Text('JSON', style: TextStyle(color: Colors.white)),
              onTap: () => Navigator.pop(context, 'json'),
            ),
          ],
        ),
      ),
    );
    
    if (format != null) {
      // Show loading indicator
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const AlertDialog(
          backgroundColor: Color(0xFF1A1A1A),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: Color(0xFF00CED1)),
              SizedBox(height: 16),
              Text(
                'Exporting analytics...',
                style: TextStyle(color: Colors.white),
              ),
            ],
          ),
        ),
      );
      
      final success = await AnalyticsService.exportAnalytics(
        token: token,
        format: format,
        period: int.parse(_selectedPeriod),
      );
      
      Navigator.pop(context); // Close loading dialog
      
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Analytics exported as $format'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Export failed'),
            backgroundColor: Colors.red,
          ),
        );
      }
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
          'Analytics',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.file_download),
            onPressed: _exportAnalytics,
            tooltip: 'Export Analytics',
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: TabBar(
            controller: _tabController,
            indicatorColor: const Color(0xFF00CED1),
            indicatorWeight: 3,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white54,
            tabs: const [
              Tab(text: 'Overview'),
              Tab(text: 'Content'),
              Tab(text: 'Followers'),
              Tab(text: 'LIVE'),
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
                _buildFollowersTab(),
                _buildLiveTab(),
              ],
            ),
    );
  }
  
  Widget _buildOverviewTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Time period selector
        Container(
          height: 40,
          margin: const EdgeInsets.only(bottom: 24),
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _buildTimeButton('Last 7 days', '7'),
              _buildTimeButton('Last 28 days', '28'),
              _buildTimeButton('Last 60 days', '60'),
              _buildTimeButton('Last 90 days', '90'),
            ],
          ),
        ),
        // Key metrics grid
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          childAspectRatio: 1.5,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          children: [
            _buildMetricCard(
              title: 'Video views',
              value: _formatCount(_analyticsData['totalViews'] ?? 0),
              change: _analyticsData['viewsChange'] ?? 0,
              icon: Icons.play_arrow,
              color: const Color(0xFF00CED1),
            ),
            _buildMetricCard(
              title: 'Profile views',
              value: _formatCount(_analyticsData['profileViews'] ?? 0),
              change: _analyticsData['profileViewsChange'] ?? 0,
              icon: Icons.person,
              color: const Color(0xFFFF1493),
            ),
            _buildMetricCard(
              title: 'Likes',
              value: _formatCount(_analyticsData['totalLikes'] ?? 0),
              change: _analyticsData['likesChange'] ?? 0,
              icon: Icons.favorite,
              color: const Color(0xFFFF0080),
            ),
            _buildMetricCard(
              title: 'Comments',
              value: _formatCount(_analyticsData['totalComments'] ?? 0),
              change: _analyticsData['commentsChange'] ?? 0,
              icon: Icons.comment,
              color: const Color(0xFF40E0D0),
            ),
            _buildMetricCard(
              title: 'Shares',
              value: _formatCount(_analyticsData['totalShares'] ?? 0),
              change: _analyticsData['sharesChange'] ?? 0,
              icon: Icons.share,
              color: const Color(0xFFFFD700),
            ),
            _buildMetricCard(
              title: 'New Followers',
              value: _formatCount(_analyticsData['newFollowers'] ?? 0),
              change: _analyticsData['followersChange'] ?? 0,
              icon: Icons.person_add,
              color: const Color(0xFF9370DB),
            ),
          ],
        ),
        const SizedBox(height: 24),
        
        // Views chart
        _buildChartSection(
          title: 'Views',
          chart: AnalyticsChart(
            data: _viewsData,
            color: const Color(0xFF00CED1),
            height: 200,
          ),
        ),
        const SizedBox(height: 24),
        
        // Engagement chart
        _buildChartSection(
          title: 'Engagement Rate',
          chart: AnalyticsChart(
            data: _engagementData,
            color: const Color(0xFFFF1493),
            height: 200,
          ),
        ),
        const SizedBox(height: 24),
        
        // Traffic sources
        _buildSection(
          title: 'Traffic Sources',
          child: Column(
            children: _trafficSources.entries.map((entry) {
              return _buildTrafficSourceItem(
                source: entry.key,
                percentage: entry.value,
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
  
  Widget _buildContentTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Top performing videos
        _buildSection(
          title: 'Top Videos',
          action: TextButton(
            onPressed: () {
              // View all videos
            },
            child: const Text(
              'See all',
              style: TextStyle(
                color: Color(0xFF00CED1),
                fontSize: 14,
              ),
            ),
          ),
          child: Column(
            children: _topVideos.take(5).map((video) {
              return _buildVideoAnalyticsItem(video);
            }).toList(),
          ),
        ),
        const SizedBox(height: 24),
        
        // Content insights
        _buildSection(
          title: 'Content Insights',
          child: Column(
            children: [
              _buildInsightItem(
                label: 'Average watch time',
                value: '${_analyticsData['avgWatchTime'] ?? 0}s',
                icon: Icons.timer,
              ),
              _buildInsightItem(
                label: 'Completion rate',
                value: '${_analyticsData['completionRate'] ?? 0}%',
                icon: Icons.check_circle,
              ),
              _buildInsightItem(
                label: 'Best posting time',
                value: _analyticsData['bestPostingTime'] ?? 'Evening',
                icon: Icons.access_time,
              ),
              _buildInsightItem(
                label: 'Most used hashtags',
                value: (_analyticsData['topHashtags'] as List? ?? []).take(3).join(', '),
                icon: Icons.tag,
              ),
            ],
          ),
        ),
      ],
    );
  }
  
  Widget _buildFollowersTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Follower growth chart
        _buildChartSection(
          title: 'Follower Growth',
          chart: AnalyticsChart(
            data: _viewsData, // Reuse for demo
            color: const Color(0xFF9370DB),
            height: 200,
          ),
        ),
        const SizedBox(height: 24),
        
        // Demographics
        _buildSection(
          title: 'Audience Demographics',
          child: Column(
            children: [
              // Age distribution
              const Text(
                'Age',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 12),
              ..._audienceData.entries.map((entry) {
                return _buildDemographicBar(
                  label: entry.key,
                  percentage: entry.value,
                );
              }),
              const SizedBox(height: 24),
              
              // Gender distribution
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildGenderStat(
                    label: 'Male',
                    percentage: _analyticsData['genderMale'] ?? 45,
                    color: const Color(0xFF1E90FF),
                  ),
                  _buildGenderStat(
                    label: 'Female',
                    percentage: _analyticsData['genderFemale'] ?? 55,
                    color: const Color(0xFFFF1493),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              
              // Top locations
              const Text(
                'Top Locations',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 12),
              ...(_analyticsData['topLocations'] as List? ?? []).take(5).map((location) {
                return _buildLocationItem(location);
              }),
            ],
          ),
        ),
      ],
    );
  }
  
  Widget _buildLiveTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Live streaming stats
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          childAspectRatio: 1.5,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          children: [
            _buildMetricCard(
              title: 'Total streams',
              value: _formatCount(_analyticsData['totalStreams'] ?? 0),
              change: 0,
              icon: Icons.live_tv,
              color: const Color(0xFFFF0080),
            ),
            _buildMetricCard(
              title: 'Stream hours',
              value: '${_analyticsData['streamHours'] ?? 0}h',
              change: 0,
              icon: Icons.timer,
              color: const Color(0xFF00CED1),
            ),
            _buildMetricCard(
              title: 'Avg viewers',
              value: _formatCount(_analyticsData['avgViewers'] ?? 0),
              change: _analyticsData['viewersChange'] ?? 0,
              icon: Icons.people,
              color: const Color(0xFFFFD700),
            ),
            _buildMetricCard(
              title: 'Gifts received',
              value: _formatCount(_analyticsData['totalGifts'] ?? 0),
              change: _analyticsData['giftsChange'] ?? 0,
              icon: Icons.card_giftcard,
              color: const Color(0xFF9370DB),
            ),
          ],
        ),
        const SizedBox(height: 24),
        
        // Recent streams
        _buildSection(
          title: 'Recent Streams',
          child: Column(
            children: (_analyticsData['recentStreams'] as List? ?? []).map((stream) {
              return _buildStreamItem(stream);
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildTimeButton(String text, String value) {
    final isSelected = _selectedPeriod == value;
    
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(
          text,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.white70,
            fontSize: 13,
          ),
        ),
        selected: isSelected,
        onSelected: (_) {
          HapticFeedback.lightImpact();
          setState(() {
            _selectedPeriod = value;
          });
          _loadAnalytics();
        },
        backgroundColor: Colors.white.withOpacity(0.1),
        selectedColor: const Color(0xFF00CED1),
        side: BorderSide(
          color: isSelected 
              ? const Color(0xFF00CED1) 
              : Colors.white.withOpacity(0.2),
        ),
      ),
    );
  }

  
  Widget _buildMetricCard({
    required String title,
    required String value,
    required double change,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            color.withOpacity(0.2),
            color.withOpacity(0.1),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 24),
              if (change != 0)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: change > 0 
                        ? Colors.green.withOpacity(0.2)
                        : Colors.red.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        change > 0 ? Icons.trending_up : Icons.trending_down,
                        color: change > 0 ? Colors.green : Colors.red,
                        size: 14,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${change.abs().toStringAsFixed(1)}%',
                        style: TextStyle(
                          color: change > 0 ? Colors.green : Colors.red,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                title,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildSection({
    required String title,
    required Widget child,
    Widget? action,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (action != null) action,
          ],
        ),
        const SizedBox(height: 16),
        child,
      ],
    );
  }
  
  Widget _buildChartSection({
    required String title,
    required Widget chart,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          chart,
        ],
      ),
    );
  }
  
  Widget _buildVideoAnalyticsItem(Video video) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          // Video thumbnail
          Container(
            width: 60,
            height: 80,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              image: video.thumbnailUrl != null
                  ? DecorationImage(
                      image: NetworkImage(video.thumbnailUrl!),
                      fit: BoxFit.cover,
                    )
                  : null,
              color: Colors.grey[800],
            ),
            child: video.thumbnailUrl == null
                ? const Icon(Icons.play_arrow, color: Colors.white)
                : null,
          ),
          const SizedBox(width: 12),
          
          // Video stats
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  video.caption ?? 'Untitled',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _buildStatItem(
                      icon: Icons.play_arrow,
                      value: _formatCount(video.viewCount),
                    ),
                    const SizedBox(width: 16),
                    _buildStatItem(
                      icon: Icons.favorite,
                      value: _formatCount(video.likes),
                    ),
                    const SizedBox(width: 16),
                    _buildStatItem(
                      icon: Icons.comment,
                      value: _formatCount(video.commentCount),
                    ),
                    const SizedBox(width: 16),
                    _buildStatItem(
                      icon: Icons.share,
                      value: _formatCount(video.shares),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildStatItem({
    required IconData icon,
    required String value,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: Colors.white54, size: 14),
        const SizedBox(width: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white54,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
  
  Widget _buildTrafficSourceItem({
    required String source,
    required double percentage,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                source,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                ),
              ),
              Text(
                '${percentage.toStringAsFixed(1)}%',
                style: const TextStyle(
                  color: Color(0xFF00CED1),
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: percentage / 100,
            backgroundColor: Colors.white.withOpacity(0.1),
            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF00CED1)),
          ),
        ],
      ),
    );
  }
  
  Widget _buildInsightItem({
    required String label,
    required String value,
    required IconData icon,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF00CED1), size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildDemographicBar({
    required String label,
    required double percentage,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          SizedBox(
            width: 50,
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: LinearProgressIndicator(
              value: percentage / 100,
              backgroundColor: Colors.white.withOpacity(0.1),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF9370DB)),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            '${percentage.toStringAsFixed(0)}%',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildGenderStat({
    required String label,
    required double percentage,
    required Color color,
  }) {
    return Column(
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: color,
              width: 8,
            ),
          ),
          child: Center(
            child: Text(
              '${percentage.toStringAsFixed(0)}%',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            color: color,
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
  
  Widget _buildLocationItem(Map<String, dynamic> location) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            location['name'] ?? 'Unknown',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
            ),
          ),
          Text(
            '${location['percentage'] ?? 0}%',
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildStreamItem(Map<String, dynamic> stream) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFF0080), Color(0xFFFF80FF)],
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Center(
              child: Icon(
                Icons.live_tv,
                color: Colors.white,
                size: 28,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  stream['title'] ?? 'Live Stream',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  stream['date'] ?? '',
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                _formatCount(stream['viewers'] ?? 0),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Text(
                'viewers',
                style: TextStyle(
                  color: Colors.white54,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}