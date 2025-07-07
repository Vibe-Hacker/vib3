import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:audioplayers/audioplayers.dart';
import 'dart:async';
import 'dart:math' as math;
import '../providers/creation_state_provider.dart';

class MusicModule extends StatefulWidget {
  const MusicModule({super.key});
  
  @override
  State<MusicModule> createState() => _MusicModuleState();
}

class _MusicModuleState extends State<MusicModule> 
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final AudioPlayer _audioPlayer = AudioPlayer();
  
  // Search and filters
  String _searchQuery = '';
  String _selectedGenre = 'All';
  
  // Audio recording
  bool _isRecordingVoiceover = false;
  int _voiceoverSeconds = 0;
  Timer? _voiceoverTimer;
  
  // Voice effects
  String _selectedVoiceEffect = 'none';
  
  // Beat sync
  bool _beatSyncEnabled = false;
  Timer? _beatTimer;
  int _currentBeat = 0;
  
  // Mock music library
  final List<MusicTrack> _musicLibrary = [
    MusicTrack(
      id: '1',
      title: 'Summer Vibes',
      artist: 'DJ Cool',
      duration: const Duration(seconds: 30),
      genre: 'Pop',
      bpm: 120,
    ),
    MusicTrack(
      id: '2', 
      title: 'Night Drive',
      artist: 'Synthwave Master',
      duration: const Duration(seconds: 45),
      genre: 'Electronic',
      bpm: 100,
    ),
    MusicTrack(
      id: '3',
      title: 'Happy Days',
      artist: 'Upbeat Productions',
      duration: const Duration(seconds: 25),
      genre: 'Pop',
      bpm: 140,
    ),
  ];
  
  final List<SoundEffectItem> _soundEffects = [
    SoundEffectItem(id: '1', name: 'Applause', category: 'Human'),
    SoundEffectItem(id: '2', name: 'Laugh', category: 'Human'),
    SoundEffectItem(id: '3', name: 'Whoosh', category: 'Transition'),
    SoundEffectItem(id: '4', name: 'Pop', category: 'Cartoon'),
    SoundEffectItem(id: '5', name: 'Ding', category: 'Alert'),
  ];
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    _audioPlayer.dispose();
    _voiceoverTimer?.cancel();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    final creationState = context.watch<CreationStateProvider>();
    
    return Column(
      children: [
        // Tab bar
        Container(
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.5),
            border: Border(
              bottom: BorderSide(
                color: Colors.white.withOpacity(0.1),
              ),
            ),
          ),
          child: TabBar(
            controller: _tabController,
            indicatorColor: const Color(0xFF00CED1),
            indicatorWeight: 3,
            labelColor: const Color(0xFF00CED1),
            unselectedLabelColor: Colors.white54,
            tabs: const [
              Tab(text: 'Music'),
              Tab(text: 'Sounds'),
              Tab(text: 'Voiceover'),
              Tab(text: 'My Audio'),
            ],
          ),
        ),
        
        // Tab content
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildMusicTab(creationState),
              _buildSoundsTab(creationState),
              _buildVoiceoverTab(creationState),
              _buildMyAudioTab(creationState),
            ],
          ),
        ),
        
        // Volume mixer
        if (creationState.backgroundMusicPath != null || 
            creationState.voiceoverPath != null)
          _buildVolumeMixer(creationState),
      ],
    );
  }
  
  Widget _buildMusicTab(CreationStateProvider creationState) {
    return Column(
      children: [
        // Search bar
        Container(
          padding: const EdgeInsets.all(16),
          child: TextField(
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
              });
            },
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Search music...',
              hintStyle: TextStyle(color: Colors.white54),
              prefixIcon: const Icon(Icons.search, color: Colors.white54),
              filled: true,
              fillColor: Colors.white.withOpacity(0.1),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(30),
                borderSide: BorderSide.none,
              ),
            ),
          ),
        ),
        
        // Genre filter
        Container(
          height: 40,
          margin: const EdgeInsets.only(bottom: 10),
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: ['All', 'Pop', 'Electronic', 'Hip Hop', 'Rock', 'Classical']
                .map((genre) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(genre),
                        selected: _selectedGenre == genre,
                        onSelected: (selected) {
                          setState(() {
                            _selectedGenre = selected ? genre : 'All';
                          });
                        },
                        backgroundColor: Colors.white.withOpacity(0.1),
                        selectedColor: const Color(0xFF00CED1),
                        labelStyle: TextStyle(
                          color: _selectedGenre == genre 
                              ? Colors.black 
                              : Colors.white,
                        ),
                      ),
                    ))
                .toList(),
          ),
        ),
        
        // Music list
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _filteredMusic.length,
            itemBuilder: (context, index) {
              final track = _filteredMusic[index];
              final isSelected = creationState.backgroundMusicPath == track.id;
              
              return _buildMusicTile(
                track: track,
                isSelected: isSelected,
                onTap: () async {
                  if (isSelected) {
                    creationState.setBackgroundMusic('');
                    await _audioPlayer.stop();
                  } else {
                    creationState.setBackgroundMusic(track.id);
                    // Play preview
                    // await _audioPlayer.play(UrlSource(track.previewUrl));
                  }
                },
                onTrim: () {
                  _showMusicTrimmer(track);
                },
              );
            },
          ),
        ),
      ],
    );
  }
  
  Widget _buildSoundsTab(CreationStateProvider creationState) {
    return Column(
      children: [
        // Category filter
        Container(
          height: 40,
          margin: const EdgeInsets.symmetric(vertical: 10),
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: ['All', 'Human', 'Transition', 'Cartoon', 'Alert', 'Nature']
                .map((category) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(category),
                        selected: false,
                        onSelected: (selected) {
                          // Filter by category
                        },
                        backgroundColor: Colors.white.withOpacity(0.1),
                        labelStyle: const TextStyle(color: Colors.white),
                      ),
                    ))
                .toList(),
          ),
        ),
        
        // Sound effects grid
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
            ),
            itemCount: _soundEffects.length,
            itemBuilder: (context, index) {
              final effect = _soundEffects[index];
              
              return GestureDetector(
                onTap: () {
                  creationState.addSoundEffect(
                    SoundEffect(
                      path: effect.id,
                      name: effect.name,
                      startTime: Duration.zero, // TODO: Get current position
                    ),
                  );
                  
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Added ${effect.name}'),
                      duration: const Duration(seconds: 1),
                    ),
                  );
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.volume_up,
                        color: Colors.white,
                        size: 30,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        effect.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
  
  Widget _buildVoiceoverTab(CreationStateProvider creationState) {
    return Column(
      children: [
        const SizedBox(height: 20),
        
        // Voice effects
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Voice Effects',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  'None', 'Chipmunk', 'Deep', 'Robot', 'Echo', 'Reverb'
                ].map((effect) => ChoiceChip(
                      label: Text(effect),
                      selected: _selectedVoiceEffect == effect.toLowerCase(),
                      onSelected: (selected) {
                        setState(() {
                          _selectedVoiceEffect = selected 
                              ? effect.toLowerCase() 
                              : 'none';
                        });
                      },
                      backgroundColor: Colors.white.withOpacity(0.1),
                      selectedColor: const Color(0xFF00CED1),
                      labelStyle: TextStyle(
                        color: _selectedVoiceEffect == effect.toLowerCase()
                            ? Colors.black
                            : Colors.white,
                      ),
                    )).toList(),
              ),
            ],
          ),
        ),
        
        const Spacer(),
        
        // Recording visualization
        if (_isRecordingVoiceover)
          Container(
            height: 100,
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.mic,
                    color: Colors.red,
                    size: 30,
                  ),
                  const SizedBox(width: 10),
                  Text(
                    _formatTime(_voiceoverSeconds),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        
        const Spacer(),
        
        // Record button
        Padding(
          padding: const EdgeInsets.all(20),
          child: GestureDetector(
            onTap: _toggleVoiceoverRecording,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _isRecordingVoiceover ? Colors.red : const Color(0xFF00CED1),
              ),
              child: Icon(
                _isRecordingVoiceover ? Icons.stop : Icons.mic,
                color: Colors.white,
                size: 40,
              ),
            ),
          ),
        ),
        
        const SizedBox(height: 20),
      ],
    );
  }
  
  Widget _buildMyAudioTab(CreationStateProvider creationState) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.library_music,
            color: Colors.white54,
            size: 64,
          ),
          const SizedBox(height: 16),
          const Text(
            'Your original sounds will appear here',
            style: TextStyle(
              color: Colors.white54,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () {
              // TODO: Record original sound
            },
            icon: const Icon(Icons.add),
            label: const Text('Create Sound'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00CED1),
              foregroundColor: Colors.black,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildVolumeMixer(CreationStateProvider creationState) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8),
        border: Border(
          top: BorderSide(
            color: Colors.white.withOpacity(0.1),
          ),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Original sound volume
          Row(
            children: [
              const Icon(Icons.videocam, color: Colors.white54, size: 20),
              const SizedBox(width: 10),
              const Text('Original', style: TextStyle(color: Colors.white)),
              Expanded(
                child: Slider(
                  value: creationState.originalVolume,
                  onChanged: creationState.setOriginalVolume,
                  activeColor: const Color(0xFF00CED1),
                  inactiveColor: Colors.white.withOpacity(0.2),
                ),
              ),
              Text(
                '${(creationState.originalVolume * 100).toInt()}%',
                style: const TextStyle(color: Colors.white54, fontSize: 12),
              ),
            ],
          ),
          
          // Music volume
          if (creationState.backgroundMusicPath != null)
            Row(
              children: [
                const Icon(Icons.music_note, color: Colors.white54, size: 20),
                const SizedBox(width: 10),
                const Text('Music', style: TextStyle(color: Colors.white)),
                Expanded(
                  child: Slider(
                    value: creationState.musicVolume,
                    onChanged: creationState.setMusicVolume,
                    activeColor: const Color(0xFF00CED1),
                    inactiveColor: Colors.white.withOpacity(0.2),
                  ),
                ),
                Text(
                  '${(creationState.musicVolume * 100).toInt()}%',
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
              ],
            ),
          
          const SizedBox(height: 16),
          
          // Beat sync toggle
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: const [
                    Icon(Icons.sync, color: Color(0xFF00CED1), size: 20),
                    SizedBox(width: 10),
                    Text(
                      'Beat Sync',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                Switch(
                  value: _beatSyncEnabled,
                  onChanged: (value) {
                    setState(() {
                      _beatSyncEnabled = value;
                    });
                    if (value) {
                      _startBeatSync();
                    } else {
                      _stopBeatSync();
                    }
                  },
                  activeColor: const Color(0xFF00CED1),
                ),
              ],
            ),
          ),
          
          if (_beatSyncEnabled)
            Container(
              margin: const EdgeInsets.only(top: 8),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF00CED1).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: const [
                  Icon(Icons.info_outline, color: Color(0xFF00CED1), size: 16),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Cuts will snap to the beat',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildMusicTile({
    required MusicTrack track,
    required bool isSelected,
    required VoidCallback onTap,
    required VoidCallback onTrim,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isSelected 
            ? const Color(0xFF00CED1).withOpacity(0.2)
            : Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(10),
        border: isSelected 
            ? Border.all(color: const Color(0xFF00CED1))
            : null,
      ),
      child: ListTile(
        onTap: onTap,
        leading: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(
            Icons.music_note,
            color: Colors.white,
          ),
        ),
        title: Text(
          track.title,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Text(
          '${track.artist} • ${_formatDuration(track.duration)} • ${track.bpm} BPM',
          style: const TextStyle(
            color: Colors.white54,
            fontSize: 12,
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isSelected)
              IconButton(
                onPressed: onTrim,
                icon: const Icon(
                  Icons.content_cut,
                  color: Color(0xFF00CED1),
                ),
              ),
            Icon(
              isSelected ? Icons.check_circle : Icons.play_circle,
              color: isSelected ? const Color(0xFF00CED1) : Colors.white54,
            ),
          ],
        ),
      ),
    );
  }
  
  void _showMusicTrimmer(MusicTrack track) {
    double startTime = 0;
    double endTime = track.duration.inSeconds.toDouble();
    
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => Container(
          height: 400,
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Text(
                'Trim "${track.title}"',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              
              // Visual waveform placeholder
              Container(
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Stack(
                  children: [
                    // Waveform visualization
                    CustomPaint(
                      size: const Size(double.infinity, 80),
                      painter: WaveformPainter(),
                    ),
                    
                    // Trim handles
                    Positioned(
                      left: (startTime / track.duration.inSeconds) * 
                            (MediaQuery.of(context).size.width - 40),
                      top: 0,
                      bottom: 0,
                      child: Container(
                        width: 3,
                        color: const Color(0xFF00CED1),
                      ),
                    ),
                    Positioned(
                      left: (endTime / track.duration.inSeconds) * 
                            (MediaQuery.of(context).size.width - 40),
                      top: 0,
                      bottom: 0,
                      child: Container(
                        width: 3,
                        color: const Color(0xFF00CED1),
                      ),
                    ),
                    
                    // Selected region
                    Positioned(
                      left: (startTime / track.duration.inSeconds) * 
                            (MediaQuery.of(context).size.width - 40),
                      right: ((track.duration.inSeconds - endTime) / track.duration.inSeconds) * 
                             (MediaQuery.of(context).size.width - 40),
                      top: 0,
                      bottom: 0,
                      child: Container(
                        color: const Color(0xFF00CED1).withOpacity(0.2),
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 20),
              
              // Time display
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    _formatDuration(Duration(seconds: startTime.toInt())),
                    style: const TextStyle(color: Color(0xFF00CED1)),
                  ),
                  Text(
                    'Duration: ${_formatDuration(Duration(seconds: (endTime - startTime).toInt()))}',
                    style: const TextStyle(color: Colors.white),
                  ),
                  Text(
                    _formatDuration(Duration(seconds: endTime.toInt())),
                    style: const TextStyle(color: Color(0xFF00CED1)),
                  ),
                ],
              ),
              
              const SizedBox(height: 30),
              
              // Start time slider
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Start Time',
                    style: TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                  Slider(
                    value: startTime,
                    max: endTime - 1,
                    activeColor: const Color(0xFF00CED1),
                    inactiveColor: Colors.white.withOpacity(0.2),
                    onChanged: (value) {
                      setState(() {
                        startTime = value;
                      });
                    },
                  ),
                ],
              ),
              
              // End time slider
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'End Time',
                    style: TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                  Slider(
                    value: endTime,
                    min: startTime + 1,
                    max: track.duration.inSeconds.toDouble(),
                    activeColor: const Color(0xFF00CED1),
                    inactiveColor: Colors.white.withOpacity(0.2),
                    onChanged: (value) {
                      setState(() {
                        endTime = value;
                      });
                    },
                  ),
                ],
              ),
              
              const Spacer(),
              
              // Action buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white54),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        // Apply trim
                        final creationState = context.read<CreationStateProvider>();
                        // Store trim data with the music selection
                        Navigator.pop(context);
                        ScaffoldMessenger.of(this.context).showSnackBar(
                          const SnackBar(
                            content: Text('Music trimmed successfully'),
                            backgroundColor: Color(0xFF00CED1),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF00CED1),
                        foregroundColor: Colors.black,
                      ),
                      child: const Text('Apply'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _toggleVoiceoverRecording() {
    if (_isRecordingVoiceover) {
      // Stop recording
      _voiceoverTimer?.cancel();
      setState(() {
        _isRecordingVoiceover = false;
      });
      
      // TODO: Save voiceover
      final creationState = context.read<CreationStateProvider>();
      creationState.setVoiceover('voiceover_path');
    } else {
      // Start recording
      setState(() {
        _isRecordingVoiceover = true;
        _voiceoverSeconds = 0;
      });
      
      _voiceoverTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() {
          _voiceoverSeconds++;
        });
      });
    }
  }
  
  List<MusicTrack> get _filteredMusic {
    return _musicLibrary.where((track) {
      final matchesSearch = track.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          track.artist.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesGenre = _selectedGenre == 'All' || track.genre == _selectedGenre;
      return matchesSearch && matchesGenre;
    }).toList();
  }
  
  String _formatTime(int seconds) {
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }
  
  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes}:${seconds.toString().padLeft(2, '0')}';
  }
  
  void _startBeatSync() {
    // Get current track's BPM
    final selectedTrack = _musicLibrary.firstWhere(
      (track) => track.id == context.read<CreationStateProvider>().backgroundMusicPath,
      orElse: () => _musicLibrary.first,
    );
    
    // Calculate beat interval
    final beatInterval = Duration(milliseconds: (60000 / selectedTrack.bpm).round());
    
    _beatTimer?.cancel();
    _beatTimer = Timer.periodic(beatInterval, (timer) {
      setState(() {
        _currentBeat++;
      });
      
      // Notify the video editor about the beat
      // This can be used to auto-cut or add effects on beat
      context.read<CreationStateProvider>().notifyListeners();
    });
  }
  
  void _stopBeatSync() {
    _beatTimer?.cancel();
    _beatTimer = null;
    setState(() {
      _currentBeat = 0;
    });
  }
  
}

// Data models
class MusicTrack {
  final String id;
  final String title;
  final String artist;
  final Duration duration;
  final String genre;
  final int bpm;
  
  MusicTrack({
    required this.id,
    required this.title,
    required this.artist,
    required this.duration,
    required this.genre,
    required this.bpm,
  });
}

class SoundEffectItem {
  final String id;
  final String name;
  final String category;
  
  SoundEffectItem({
    required this.id,
    required this.name,
    required this.category,
  });
}

// Custom painter for waveform visualization
class WaveformPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.3)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;
    
    final path = Path();
    final amplitude = size.height / 2;
    final frequency = 0.02;
    
    // Draw a simple sine wave as placeholder
    for (double x = 0; x <= size.width; x++) {
      final y = amplitude + amplitude * 0.7 * 
                (x / size.width) * // Fade in/out
                math.sin(x * frequency);
      
      if (x == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    
    canvas.drawPath(path, paint);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}