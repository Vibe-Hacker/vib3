import 'package:flutter/material.dart';

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Analytics'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Time period selector
          Row(
            children: [
              _buildTimeButton('7 days', true),
              _buildTimeButton('28 days', false),
              _buildTimeButton('60 days', false),
            ],
          ),
          const SizedBox(height: 24),
          
          // Overview Stats
          _buildStatsCard(
            title: 'Video views',
            value: '1.2K',
            change: '+15.3%',
            isPositive: true,
          ),
          _buildStatsCard(
            title: 'Profile views',
            value: '456',
            change: '+8.7%',
            isPositive: true,
          ),
          _buildStatsCard(
            title: 'Likes',
            value: '890',
            change: '+12.1%',
            isPositive: true,
          ),
          _buildStatsCard(
            title: 'Comments',
            value: '234',
            change: '-2.4%',
            isPositive: false,
          ),
          _buildStatsCard(
            title: 'Shares',
            value: '167',
            change: '+5.9%',
            isPositive: true,
          ),
          _buildStatsCard(
            title: 'Followers',
            value: '1.8K',
            change: '+3.2%',
            isPositive: true,
          ),
          
          const SizedBox(height: 24),
          
          // Top Videos
          const Text(
            'Top videos',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          // Video analytics list
          ...List.generate(5, (index) => _buildVideoAnalytics(index + 1)),
        ],
      ),
    );
  }

  Widget _buildTimeButton(String text, bool isSelected) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: OutlinedButton(
        onPressed: () {},
        style: OutlinedButton.styleFrom(
          backgroundColor: isSelected ? const Color(0xFFFF0080) : null,
          side: BorderSide(
            color: isSelected ? const Color(0xFFFF0080) : Colors.grey,
          ),
        ),
        child: Text(
          text,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.grey,
          ),
        ),
      ),
    );
  }

  Widget _buildStatsCard({
    required String title,
    required String value,
    required String change,
    required bool isPositive,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.grey)),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          Row(
            children: [
              Icon(
                isPositive ? Icons.trending_up : Icons.trending_down,
                color: isPositive ? Colors.green : Colors.red,
                size: 16,
              ),
              const SizedBox(width: 4),
              Text(
                change,
                style: TextStyle(
                  color: isPositive ? Colors.green : Colors.red,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildVideoAnalytics(int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          // Video thumbnail placeholder
          Container(
            width: 60,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.grey[800],
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.play_arrow, color: Colors.white),
          ),
          const SizedBox(width: 12),
          // Video stats
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Video $index',
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.play_arrow, color: Colors.grey, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      '${(index * 123)}K',
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                    const SizedBox(width: 16),
                    const Icon(Icons.favorite, color: Colors.grey, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      '${(index * 45)}',
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
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
}