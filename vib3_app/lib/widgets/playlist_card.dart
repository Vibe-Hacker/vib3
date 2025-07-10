import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/playlist.dart';
import '../utils/format_utils.dart';

class PlaylistCard extends StatelessWidget {
  final Playlist playlist;
  final VoidCallback onTap;
  final VoidCallback onDelete;
  
  const PlaylistCard({
    super.key,
    required this.playlist,
    required this.onTap,
    required this.onDelete,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF1A1A1A),
            const Color(0xFF2A2A2A),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: playlist.isPrivate 
              ? const Color(0xFFFF0080).withOpacity(0.3)
              : Colors.transparent,
        ),
      ),
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Thumbnail
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  image: playlist.thumbnailUrl != null
                      ? DecorationImage(
                          image: NetworkImage(playlist.thumbnailUrl!),
                          fit: BoxFit.cover,
                        )
                      : null,
                  gradient: playlist.thumbnailUrl == null
                      ? LinearGradient(
                          colors: [
                            _getPlaylistColor(playlist.type),
                            _getPlaylistColor(playlist.type).withOpacity(0.7),
                          ],
                        )
                      : null,
                ),
                child: playlist.thumbnailUrl == null
                    ? Icon(
                        _getPlaylistIcon(playlist.type),
                        color: Colors.white,
                        size: 32,
                      )
                    : null,
              ),
              const SizedBox(width: 16),
              
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            playlist.name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (playlist.isPrivate)
                          const Icon(
                            Icons.lock,
                            color: Color(0xFFFF0080),
                            size: 16,
                          ),
                        if (playlist.isCollaborative)
                          const Icon(
                            Icons.people,
                            color: Color(0xFF00CED1),
                            size: 16,
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      playlist.description,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.play_arrow,
                          color: Colors.white54,
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${playlist.videoCount} videos',
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Icon(
                          Icons.access_time,
                          color: Colors.white54,
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          FormatUtils.formatDuration(playlist.totalDuration),
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (playlist.tags.isNotEmpty)
                      Wrap(
                        spacing: 4,
                        children: playlist.tags.take(3).map((tag) {
                          return Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: _getPlaylistColor(playlist.type).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '#$tag',
                              style: TextStyle(
                                color: _getPlaylistColor(playlist.type),
                                fontSize: 10,
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                  ],
                ),
              ),
              
              // Actions
              PopupMenuButton(
                icon: const Icon(Icons.more_vert, color: Colors.white54),
                color: const Color(0xFF1A1A1A),
                itemBuilder: (context) => [
                  PopupMenuItem(
                    child: const Row(
                      children: [
                        Icon(Icons.edit, color: Colors.white, size: 20),
                        SizedBox(width: 12),
                        Text('Edit', style: TextStyle(color: Colors.white)),
                      ],
                    ),
                    onTap: () {
                      // Edit playlist
                    },
                  ),
                  PopupMenuItem(
                    child: const Row(
                      children: [
                        Icon(Icons.share, color: Colors.white, size: 20),
                        SizedBox(width: 12),
                        Text('Share', style: TextStyle(color: Colors.white)),
                      ],
                    ),
                    onTap: () {
                      // Share playlist
                    },
                  ),
                  if (playlist.type == PlaylistType.custom)
                    PopupMenuItem(
                      child: const Row(
                        children: [
                          Icon(Icons.delete, color: Colors.red, size: 20),
                          SizedBox(width: 12),
                          Text('Delete', style: TextStyle(color: Colors.red)),
                        ],
                      ),
                      onTap: () {
                        // Confirm deletion
                        Future.delayed(Duration.zero, () {
                          showDialog(
                            context: context,
                            builder: (context) => AlertDialog(
                              backgroundColor: const Color(0xFF1A1A1A),
                              title: const Text(
                                'Delete Playlist',
                                style: TextStyle(color: Colors.white),
                              ),
                              content: Text(
                                'Are you sure you want to delete "${playlist.name}"? This action cannot be undone.',
                                style: const TextStyle(color: Colors.white70),
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(context),
                                  child: const Text('Cancel'),
                                ),
                                TextButton(
                                  onPressed: () {
                                    Navigator.pop(context);
                                    onDelete();
                                  },
                                  child: const Text(
                                    'Delete',
                                    style: TextStyle(color: Colors.red),
                                  ),
                                ),
                              ],
                            ),
                          );
                        });
                      },
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Color _getPlaylistColor(PlaylistType type) {
    switch (type) {
      case PlaylistType.favorites:
        return const Color(0xFFFF0080);
      case PlaylistType.watchLater:
        return const Color(0xFF00CED1);
      case PlaylistType.liked:
        return const Color(0xFFFF1493);
      case PlaylistType.shared:
        return const Color(0xFF9370DB);
      case PlaylistType.collaborative:
        return const Color(0xFFFFD700);
      default:
        return const Color(0xFF40E0D0);
    }
  }
  
  IconData _getPlaylistIcon(PlaylistType type) {
    switch (type) {
      case PlaylistType.favorites:
        return Icons.favorite;
      case PlaylistType.watchLater:
        return Icons.watch_later;
      case PlaylistType.liked:
        return Icons.thumb_up;
      case PlaylistType.shared:
        return Icons.share;
      case PlaylistType.collaborative:
        return Icons.people;
      default:
        return Icons.playlist_play;
    }
  }
}