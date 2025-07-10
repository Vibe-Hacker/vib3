import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class CollabScreen extends StatefulWidget {
  final String? videoId;
  final bool isHost;
  
  const CollabScreen({
    super.key,
    this.videoId,
    this.isHost = false,
  });
  
  @override
  State<CollabScreen> createState() => _CollabScreenState();
}

class _CollabScreenState extends State<CollabScreen> 
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  
  // Collab data
  CollabProject? _currentProject;
  final List<CollabInvite> _pendingInvites = [
    CollabInvite(
      id: '1',
      projectName: 'Dance Challenge Collab',
      hostName: '@dance_master',
      hostAvatar: 'D',
      description: 'Join me for an epic dance collaboration!',
      deadline: DateTime.now().add(const Duration(days: 3)),
      participantCount: 5,
      maxParticipants: 10,
      status: InviteStatus.pending,
    ),
    CollabInvite(
      id: '2',
      projectName: 'Comedy Skit Series',
      hostName: '@funny_creator',
      hostAvatar: 'F',
      description: 'Looking for actors for a comedy series',
      deadline: DateTime.now().add(const Duration(days: 7)),
      participantCount: 3,
      maxParticipants: 6,
      status: InviteStatus.pending,
    ),
  ];
  
  final List<CollabProject> _activeProjects = [
    CollabProject(
      id: '1',
      title: 'Summer Vibes Music Video',
      hostId: 'host123',
      hostName: '@music_producer',
      createdAt: DateTime.now().subtract(const Duration(days: 2)),
      deadline: DateTime.now().add(const Duration(days: 5)),
      description: 'Creating a summer-themed music video',
      participants: [
        CollabParticipant(
          userId: 'user1',
          username: '@singer1',
          role: 'Vocalist',
          status: ParticipantStatus.submitted,
          submittedAt: DateTime.now().subtract(const Duration(hours: 12)),
        ),
        CollabParticipant(
          userId: 'user2',
          username: '@dancer1',
          role: 'Dancer',
          status: ParticipantStatus.pending,
        ),
      ],
      settings: CollabSettings(
        allowPublicJoin: true,
        requireApproval: true,
        maxParticipants: 15,
        videoVisibility: VideoVisibility.participants,
      ),
    ),
  ];
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text(
          'Collaborations',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Colors.white),
            onPressed: _showSearchModal,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF00CED1),
          labelColor: const Color(0xFF00CED1),
          unselectedLabelColor: Colors.white54,
          tabs: const [
            Tab(text: 'Active'),
            Tab(text: 'Invites'),
            Tab(text: 'Discover'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildActiveTab(),
          _buildInvitesTab(),
          _buildDiscoverTab(),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _createNewCollab,
        backgroundColor: const Color(0xFF00CED1),
        child: const Icon(Icons.add, color: Colors.black),
      ),
    );
  }
  
  Widget _buildActiveTab() {
    if (_activeProjects.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.group_work,
              size: 64,
              color: Colors.white.withOpacity(0.3),
            ),
            const SizedBox(height: 16),
            Text(
              'No active collaborations',
              style: TextStyle(
                color: Colors.white.withOpacity(0.5),
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => _tabController.animateTo(2),
              child: const Text(
                'Discover collaborations',
                style: TextStyle(color: Color(0xFF00CED1)),
              ),
            ),
          ],
        ),
      );
    }
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _activeProjects.length,
      itemBuilder: (context, index) {
        final project = _activeProjects[index];
        return _buildProjectCard(project);
      },
    );
  }
  
  Widget _buildInvitesTab() {
    if (_pendingInvites.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.mail_outline,
              size: 64,
              color: Colors.white.withOpacity(0.3),
            ),
            const SizedBox(height: 16),
            Text(
              'No pending invites',
              style: TextStyle(
                color: Colors.white.withOpacity(0.5),
                fontSize: 16,
              ),
            ),
          ],
        ),
      );
    }
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _pendingInvites.length,
      itemBuilder: (context, index) {
        final invite = _pendingInvites[index];
        return _buildInviteCard(invite);
      },
    );
  }
  
  Widget _buildDiscoverTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Featured collabs
          const Text(
            'Featured Collaborations',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          SizedBox(
            height: 200,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: 5,
              itemBuilder: (context, index) {
                return _buildFeaturedCard(index);
              },
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Categories
          const Text(
            'Browse by Category',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.5,
            children: [
              _buildCategoryCard('Dance', Icons.music_note, Colors.purple),
              _buildCategoryCard('Comedy', Icons.theater_comedy, Colors.orange),
              _buildCategoryCard('Music', Icons.audiotrack, Colors.blue),
              _buildCategoryCard('Education', Icons.school, Colors.green),
              _buildCategoryCard('Fashion', Icons.checkroom, Colors.pink),
              _buildCategoryCard('Sports', Icons.sports_basketball, Colors.red),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildProjectCard(CollabProject project) {
    final submittedCount = project.participants
        .where((p) => p.status == ParticipantStatus.submitted)
        .length;
    final totalCount = project.participants.length;
    
    return GestureDetector(
      onTap: () => _openProjectDetails(project),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: const Color(0xFF00CED1).withOpacity(0.3),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: const Color(0xFF00CED1),
                  child: Text(
                    project.hostName[1].toUpperCase(),
                    style: const TextStyle(
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        project.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'by ${project.hostName}',
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'Active',
                    style: TextStyle(
                      color: Colors.green,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Description
            Text(
              project.description,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            
            const SizedBox(height: 12),
            
            // Progress
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Progress',
                      style: TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      '$submittedCount/$totalCount submitted',
                      style: const TextStyle(
                        color: Color(0xFF00CED1),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                LinearProgressIndicator(
                  value: totalCount > 0 ? submittedCount / totalCount : 0,
                  backgroundColor: Colors.white.withOpacity(0.1),
                  valueColor: const AlwaysStoppedAnimation<Color>(
                    Color(0xFF00CED1),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Footer
            Row(
              children: [
                Icon(
                  Icons.schedule,
                  color: Colors.orange,
                  size: 16,
                ),
                const SizedBox(width: 4),
                Text(
                  '${project.deadline.difference(DateTime.now()).inDays}d left',
                  style: const TextStyle(
                    color: Colors.orange,
                    fontSize: 12,
                  ),
                ),
                const Spacer(),
                // Participant avatars
                SizedBox(
                  height: 24,
                  child: Stack(
                    children: List.generate(
                      project.participants.length.clamp(0, 3),
                      (index) => Positioned(
                        left: index * 16.0,
                        child: CircleAvatar(
                          radius: 12,
                          backgroundColor: Colors.primaries[
                              index % Colors.primaries.length],
                          child: Text(
                            project.participants[index].username[1].toUpperCase(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                if (project.participants.length > 3)
                  Padding(
                    padding: const EdgeInsets.only(left: 52),
                    child: Text(
                      '+${project.participants.length - 3}',
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildInviteCard(CollabInvite invite) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: const Color(0xFF00CED1),
                child: Text(
                  invite.hostAvatar,
                  style: const TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      invite.projectName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'from ${invite.hostName}',
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Description
          Text(
            invite.description,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 14,
            ),
          ),
          
          const SizedBox(height: 12),
          
          // Stats
          Row(
            children: [
              Icon(
                Icons.people,
                color: Colors.white54,
                size: 16,
              ),
              const SizedBox(width: 4),
              Text(
                '${invite.participantCount}/${invite.maxParticipants} joined',
                style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 12,
                ),
              ),
              const SizedBox(width: 16),
              Icon(
                Icons.schedule,
                color: Colors.white54,
                size: 16,
              ),
              const SizedBox(width: 4),
              Text(
                '${invite.deadline.difference(DateTime.now()).inDays}d deadline',
                style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Actions
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _declineInvite(invite),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white54,
                    side: const BorderSide(color: Colors.white30),
                  ),
                  child: const Text('Decline'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => _acceptInvite(invite),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00CED1),
                    foregroundColor: Colors.black,
                  ),
                  child: const Text('Accept'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildFeaturedCard(int index) {
    return Container(
      width: 280,
      margin: const EdgeInsets.only(right: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.primaries[index % Colors.primaries.length],
            Colors.primaries[(index + 1) % Colors.primaries.length],
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Stack(
        children: [
          // Overlay
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.black.withOpacity(0.7),
                ],
              ),
            ),
          ),
          
          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.yellow,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    '🔥 Trending',
                    style: TextStyle(
                      color: Colors.black,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Epic Dance Battle',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Join 50+ creators',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildCategoryCard(String title, IconData icon, Color color) {
    return GestureDetector(
      onTap: () => _browseCategory(title),
      child: Container(
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: color.withOpacity(0.3),
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  void _showSearchModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        decoration: const BoxDecoration(
          color: Color(0xFF1A1A1A),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _searchController,
                autofocus: true,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Search collaborations...',
                  hintStyle: const TextStyle(color: Colors.white54),
                  prefixIcon: const Icon(Icons.search, color: Colors.white54),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.1),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(30),
                    borderSide: BorderSide.none,
                  ),
                ),
                onSubmitted: (value) {
                  Navigator.pop(context);
                  // Perform search
                },
              ),
              const SizedBox(height: 20),
              // Recent searches
              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Recent Searches',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                children: ['Dance collab', 'Comedy', 'Music video']
                    .map((search) => ActionChip(
                          label: Text(search),
                          onPressed: () {
                            _searchController.text = search;
                          },
                          backgroundColor: Colors.white.withOpacity(0.1),
                          labelStyle: const TextStyle(color: Colors.white),
                        ))
                    .toList(),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _createNewCollab() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const CreateCollabScreen(),
      ),
    );
  }
  
  void _openProjectDetails(CollabProject project) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CollabDetailsScreen(project: project),
      ),
    );
  }
  
  void _acceptInvite(CollabInvite invite) {
    setState(() {
      _pendingInvites.remove(invite);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Joined collaboration!'),
        backgroundColor: Color(0xFF00CED1),
      ),
    );
  }
  
  void _declineInvite(CollabInvite invite) {
    setState(() {
      _pendingInvites.remove(invite);
    });
  }
  
  void _browseCategory(String category) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Browsing $category collaborations'),
        backgroundColor: const Color(0xFF00CED1),
      ),
    );
  }
}

// Create collaboration screen
class CreateCollabScreen extends StatelessWidget {
  const CreateCollabScreen({super.key});
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Create Collaboration'),
      ),
      body: const Center(
        child: Text(
          'Create Collaboration Form',
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }
}

// Collaboration details screen
class CollabDetailsScreen extends StatelessWidget {
  final CollabProject project;
  
  const CollabDetailsScreen({
    super.key,
    required this.project,
  });
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: Text(project.title),
      ),
      body: const Center(
        child: Text(
          'Collaboration Details',
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }
}

// Data models
class CollabProject {
  final String id;
  final String title;
  final String hostId;
  final String hostName;
  final DateTime createdAt;
  final DateTime deadline;
  final String description;
  final List<CollabParticipant> participants;
  final CollabSettings settings;
  
  CollabProject({
    required this.id,
    required this.title,
    required this.hostId,
    required this.hostName,
    required this.createdAt,
    required this.deadline,
    required this.description,
    required this.participants,
    required this.settings,
  });
}

class CollabParticipant {
  final String userId;
  final String username;
  final String role;
  final ParticipantStatus status;
  final DateTime? submittedAt;
  
  CollabParticipant({
    required this.userId,
    required this.username,
    required this.role,
    required this.status,
    this.submittedAt,
  });
}

class CollabInvite {
  final String id;
  final String projectName;
  final String hostName;
  final String hostAvatar;
  final String description;
  final DateTime deadline;
  final int participantCount;
  final int maxParticipants;
  final InviteStatus status;
  
  CollabInvite({
    required this.id,
    required this.projectName,
    required this.hostName,
    required this.hostAvatar,
    required this.description,
    required this.deadline,
    required this.participantCount,
    required this.maxParticipants,
    required this.status,
  });
}

class CollabSettings {
  final bool allowPublicJoin;
  final bool requireApproval;
  final int maxParticipants;
  final VideoVisibility videoVisibility;
  
  CollabSettings({
    required this.allowPublicJoin,
    required this.requireApproval,
    required this.maxParticipants,
    required this.videoVisibility,
  });
}

enum ParticipantStatus { pending, submitted, approved, rejected }
enum InviteStatus { pending, accepted, declined, expired }
enum VideoVisibility { public, participants, host }