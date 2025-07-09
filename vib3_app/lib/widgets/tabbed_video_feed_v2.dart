import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../features/video_feed/presentation/widgets/video_feed_widget.dart';
import '../features/video_feed/presentation/providers/video_feed_provider.dart';

/// New tabbed video feed using repository pattern
/// This version uses the isolated architecture
class TabbedVideoFeedV2 extends StatefulWidget {
  const TabbedVideoFeedV2({Key? key}) : super(key: key);
  
  @override
  State<TabbedVideoFeedV2> createState() => _TabbedVideoFeedV2State();
}

class _TabbedVideoFeedV2State extends State<TabbedVideoFeedV2>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          color: Colors.black,
          child: SafeArea(
            bottom: false,
            child: TabBar(
              controller: _tabController,
              indicatorColor: const Color(0xFF00CED1), // Cyan like logo
              labelColor: const Color(0xFF00CED1),
              unselectedLabelColor: Colors.grey,
              labelStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
              tabs: const [
                Tab(
                  height: 56,
                  child: Text(
                    'Vib3\nPulse',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13),
                  ),
                ),
                Tab(
                  height: 56,
                  child: Text(
                    'Vib3\nConnect',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13),
                  ),
                ),
                Tab(
                  height: 56,
                  child: Text(
                    'Vib3\nCircle',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: const [
              VideoFeedWidget(feedType: 'for_you'),
              VideoFeedWidget(feedType: 'following'),
              VideoFeedWidget(feedType: 'friends'),
            ],
          ),
        ),
      ],
    );
  }
}