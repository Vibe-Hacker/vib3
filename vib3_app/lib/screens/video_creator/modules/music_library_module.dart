import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/creation_state_provider.dart';

class MusicLibraryModule extends StatefulWidget {
  const MusicLibraryModule({super.key});
  
  @override
  State<MusicLibraryModule> createState() => _MusicLibraryModuleState();
}

class _MusicLibraryModuleState extends State<MusicLibraryModule> 
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  
  String _selectedCategory = 'For You';
  MusicTrack? _selectedTrack;
  bool _isPlaying = false;
  double _trimStart = 0.0;
  double _trimEnd = 15.0;
  
  // Categories
  final List<String> _categories = [
    'For You',
    'Trending',
    'Pop',
    'Hip Hop',
    'Electronic',
    'Rock',
    'R&B',
    'Country',
    'Latin',
    'Classical',
  ];
  
  // Sample music tracks
  final List<MusicTrack> _musicTracks = [
    MusicTrack(
      id: '1',
      title: 'Summer Vibes',
      artist: 'DJ Sunshine',
      duration: 180,
      coverUrl: 'summer_vibes.jpg',
      genre: 'Electronic',
      bpm: 128,
      isVerified: true,
      playCount: 2500000,
      isTrending: true,
    ),
    MusicTrack(
      id: '2',
      title: 'City Lights',
      artist: 'Urban Dreams',
      duration: 210,
      coverUrl: 'city_lights.jpg',
      genre: 'Hip Hop',
      bpm: 95,
      isVerified: true,
      playCount: 1800000,
      isTrending: true,
    ),
    MusicTrack(
      id: '3',
      title: 'Heartbeat',
      artist: 'Love Songs Inc',
      duration: 195,
      coverUrl: 'heartbeat.jpg',
      genre: 'Pop',
      bpm: 120,
      isVerified: false,
      playCount: 950000,
      isTrending: false,
    ),
    MusicTrack(
      id: '4',
      title: 'Electric Dreams',
      artist: 'Synth Master',
      duration: 240,
      coverUrl: 'electric.jpg',
      genre: 'Electronic',
      bpm: 140,
      isVerified: true,
      playCount: 3200000,
      isTrending: true,
    ),
    MusicTrack(
      id: '5',
      title: 'Midnight Blues',
      artist: 'Jazz Collective',
      duration: 300,
      coverUrl: 'midnight.jpg',
      genre: 'R&B',
      bpm: 85,
      isVerified: false,
      playCount: 450000,
      isTrending: false,
    ),
  ];
  
  // Playlists
  final List<MusicPlaylist> _playlists = [
    MusicPlaylist(
      id: '1',
      name: 'Viral Hits',
      trackCount: 50,
      coverUrl: 'viral_hits.jpg',
      isOfficial: true,
    ),
    MusicPlaylist(
      id: '2',
      name: 'Dance Challenge',
      trackCount: 30,
      coverUrl: 'dance.jpg',
      isOfficial: true,
    ),
    MusicPlaylist(
      id: '3',
      name: 'Chill Vibes',
      trackCount: 40,
      coverUrl: 'chill.jpg',
      isOfficial: false,
    ),
  ];
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A1A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
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
          
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Add Music',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (_selectedTrack != null)
                  TextButton(
                    onPressed: _addMusicToVideo,
                    child: const Text(
                      'Add',
                      style: TextStyle(
                        color: Color(0xFF00CED1),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          
          // Search bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _searchController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Search songs, artists, or sounds',
                hintStyle: const TextStyle(color: Colors.white54),
                prefixIcon: const Icon(Icons.search, color: Colors.white54),
                filled: true,
                fillColor: Colors.white.withOpacity(0.1),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide.none,
                ),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Colors.white54),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {});
                        },
                      )
                    : null,
              ),
              onChanged: (value) => setState(() {}),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Tabs
          TabBar(
            controller: _tabController,
            indicatorColor: const Color(0xFF00CED1),
            labelColor: const Color(0xFF00CED1),
            unselectedLabelColor: Colors.white54,
            tabs: const [
              Tab(text: 'Discover'),
              Tab(text: 'Playlists'),
              Tab(text: 'Favorites'),
              Tab(text: 'My Sounds'),
            ],
          ),
          
          // Tab content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildDiscoverTab(),
                _buildPlaylistsTab(),
                _buildFavoritesTab(),
                _buildMySoundsTab(),
              ],
            ),
          ),
          
          // Music player
          if (_selectedTrack != null)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black,
                border: Border(
                  top: BorderSide(color: Colors.white.withOpacity(0.1)),
                ),
              ),
              child: Column(
                children: [
                  // Track info
                  Row(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          color: Colors.grey[800],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.music_note,
                          color: Colors.white54,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _selectedTrack!.title,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              _selectedTrack!.artist,
                              style: const TextStyle(
                                color: Colors.white54,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Play/Pause button
                      IconButton(
                        onPressed: _togglePlayback,
                        icon: Icon(
                          _isPlaying ? Icons.pause : Icons.play_arrow,
                          color: const Color(0xFF00CED1),
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 12),
                  
                  // Trim slider
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Trim: ${_trimStart.toStringAsFixed(1)}s - ${_trimEnd.toStringAsFixed(1)}s',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                          Text(
                            'Duration: ${(_trimEnd - _trimStart).toStringAsFixed(1)}s',
                            style: const TextStyle(
                              color: Color(0xFF00CED1),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      RangeSlider(
                        values: RangeValues(_trimStart, _trimEnd),
                        min: 0,
                        max: _selectedTrack!.duration.toDouble(),
                        onChanged: (values) {
                          setState(() {
                            _trimStart = values.start;
                            _trimEnd = values.end;
                          });
                        },
                        activeColor: const Color(0xFF00CED1),
                        inactiveColor: Colors.white.withOpacity(0.2),
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
  
  Widget _buildDiscoverTab() {
    return Column(
      children: [
        // Category chips
        Container(
          height: 40,
          margin: const EdgeInsets.symmetric(vertical: 16),
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _categories.length,
            itemBuilder: (context, index) {
              final category = _categories[index];
              final isSelected = _selectedCategory == category;
              
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(category),
                  selected: isSelected,
                  onSelected: (selected) {
                    setState(() {
                      _selectedCategory = category;
                    });
                  },
                  backgroundColor: Colors.white.withOpacity(0.1),
                  selectedColor: const Color(0xFF00CED1),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.black : Colors.white,
                    fontSize: 12,
                  ),
                ),
              );
            },
          ),
        ),
        
        // Music list
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _musicTracks.length,
            itemBuilder: (context, index) {
              final track = _musicTracks[index];
              return _buildTrackItem(track);
            },
          ),
        ),
      ],
    );
  }
  
  Widget _buildPlaylistsTab() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.0,
      ),
      itemCount: _playlists.length,
      itemBuilder: (context, index) {
        final playlist = _playlists[index];
        return _buildPlaylistCard(playlist);
      },
    );
  }
  
  Widget _buildFavoritesTab() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.favorite_border,
            size: 64,
            color: Colors.white.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            'No favorite songs yet',
            style: TextStyle(
              color: Colors.white.withOpacity(0.5),
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Tap the heart icon to save songs',
            style: TextStyle(
              color: Color(0xFF00CED1),
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildMySoundsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Upload sound button
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: const Color(0xFF00CED1).withOpacity(0.3),
                style: BorderStyle.dashed,
                width: 2,
              ),
            ),
            child: Column(
              children: const [
                Icon(
                  Icons.cloud_upload,
                  color: Color(0xFF00CED1),
                  size: 40,
                ),
                SizedBox(height: 12),
                Text(
                  'Upload Your Own Sound',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'MP3, WAV, M4A up to 3 minutes',
                  style: TextStyle(
                    color: Colors.white54,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Record sound button
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(
                  Icons.mic,
                  color: Colors.red,
                  size: 24,
                ),
                SizedBox(width: 12),
                Text(
                  'Record Original Sound',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 30),
          
          // Extracted sounds
          const Text(
            'Sounds from Your Videos',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          Center(
            child: Text(
              'No extracted sounds yet',
              style: TextStyle(
                color: Colors.white.withOpacity(0.5),
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildTrackItem(MusicTrack track) {
    final isSelected = _selectedTrack?.id == track.id;
    
    return GestureDetector(
      onTap: () => _selectTrack(track),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF00CED1).withOpacity(0.2)
              : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF00CED1)
                : Colors.transparent,
          ),
        ),
        child: Row(
          children: [
            // Cover art
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: Colors.grey[800],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Stack(
                children: [
                  const Center(
                    child: Icon(
                      Icons.music_note,
                      color: Colors.white54,
                    ),
                  ),
                  if (track.isTrending)
                    Positioned(
                      top: 4,
                      right: 4,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.trending_up,
                          color: Colors.white,
                          size: 12,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            
            // Track info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          track.title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (track.isVerified)
                        const Icon(
                          Icons.verified,
                          color: Color(0xFF00CED1),
                          size: 16,
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    track.artist,
                    style: const TextStyle(
                      color: Colors.white54,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.play_arrow,
                        color: Colors.white54,
                        size: 14,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        _formatPlayCount(track.playCount),
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 11,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Icon(
                        Icons.timer,
                        color: Colors.white54,
                        size: 14,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        _formatDuration(track.duration),
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 11,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '${track.bpm} BPM',
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            // Actions
            Row(
              children: [
                IconButton(
                  onPressed: () => _toggleFavorite(track),
                  icon: const Icon(
                    Icons.favorite_border,
                    color: Colors.white54,
                    size: 20,
                  ),
                ),
                if (isSelected)
                  IconButton(
                    onPressed: _togglePlayback,
                    icon: Icon(
                      _isPlaying ? Icons.pause : Icons.play_arrow,
                      color: const Color(0xFF00CED1),
                      size: 20,
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildPlaylistCard(MusicPlaylist playlist) {
    return GestureDetector(
      onTap: () => _openPlaylist(playlist),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.grey[800],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Stack(
          children: [
            // Cover
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.playlist_play,
                    color: Colors.white54,
                    size: 40,
                  ),
                  const SizedBox(height: 8),
                  if (playlist.isOfficial)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00CED1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        'Official',
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            
            // Gradient overlay
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withOpacity(0.8),
                    ],
                  ),
                ),
              ),
            ),
            
            // Info
            Positioned(
              bottom: 12,
              left: 12,
              right: 12,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    playlist.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${playlist.trackCount} tracks',
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
      ),
    );
  }
  
  void _selectTrack(MusicTrack track) {
    setState(() {
      _selectedTrack = track;
      _isPlaying = false;
      _trimStart = 0;
      _trimEnd = track.duration > 60 ? 15.0 : track.duration.toDouble();
    });
    HapticFeedback.lightImpact();
  }
  
  void _togglePlayback() {
    setState(() {
      _isPlaying = !_isPlaying;
    });
    
    if (_isPlaying) {
      // Start playback
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Playing preview...'),
          duration: Duration(seconds: 1),
        ),
      );
    }
  }
  
  void _toggleFavorite(MusicTrack track) {
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Added ${track.title} to favorites'),
        backgroundColor: const Color(0xFF00CED1),
      ),
    );
  }
  
  void _openPlaylist(MusicPlaylist playlist) {
    // Navigate to playlist details
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Opening ${playlist.name}...'),
        backgroundColor: const Color(0xFF00CED1),
      ),
    );
  }
  
  void _addMusicToVideo() {
    if (_selectedTrack == null) return;
    
    final creationState = context.read<CreationStateProvider>();
    
    creationState.setBackgroundMusic(
      BackgroundMusic(
        trackId: _selectedTrack!.id,
        title: _selectedTrack!.title,
        artist: _selectedTrack!.artist,
        startTime: _trimStart,
        endTime: _trimEnd,
        volume: 0.7,
      ),
    );
    
    Navigator.pop(context);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.music_note, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(
              child: Text('Added "${_selectedTrack!.title}" to your video'),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF00CED1),
      ),
    );
  }
  
  String _formatPlayCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
  
  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '$minutes:${remainingSeconds.toString().padLeft(2, '0')}';
  }
}

// Data models
class MusicTrack {
  final String id;
  final String title;
  final String artist;
  final int duration; // seconds
  final String coverUrl;
  final String genre;
  final int bpm;
  final bool isVerified;
  final int playCount;
  final bool isTrending;
  
  MusicTrack({
    required this.id,
    required this.title,
    required this.artist,
    required this.duration,
    required this.coverUrl,
    required this.genre,
    required this.bpm,
    required this.isVerified,
    required this.playCount,
    required this.isTrending,
  });
}

class MusicPlaylist {
  final String id;
  final String name;
  final int trackCount;
  final String coverUrl;
  final bool isOfficial;
  
  MusicPlaylist({
    required this.id,
    required this.name,
    required this.trackCount,
    required this.coverUrl,
    required this.isOfficial,
  });
}

class BackgroundMusic {
  final String trackId;
  final String title;
  final String artist;
  final double startTime;
  final double endTime;
  final double volume;
  
  BackgroundMusic({
    required this.trackId,
    required this.title,
    required this.artist,
    required this.startTime,
    required this.endTime,
    required this.volume,
  });
}