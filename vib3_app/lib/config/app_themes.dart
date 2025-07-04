import 'package:flutter/material.dart';

class AppThemes {
  // Theme identifiers
  static const String vib3Classic = 'vib3_classic';
  static const String neonCity = 'neon_city';
  static const String cosmicVoid = 'cosmic_void';
  static const String sunsetVibes = 'sunset_vibes';
  static const String oceanDepth = 'ocean_depth';
  static const String retroWave = 'retro_wave';
  static const String darkPurple = 'dark_purple';
  static const String goldenHour = 'golden_hour';
  static const String cyberpunk = 'cyberpunk';
  static const String mintFresh = 'mint_fresh';

  // Get all available themes
  static List<VIB3Theme> getAllThemes() {
    return [
      vib3ClassicTheme,
      neonCityTheme,
      cosmicVoidTheme,
      sunsetVibesTheme,
      oceanDepthTheme,
      retroWaveTheme,
      darkPurpleTheme,
      goldenHourTheme,
      cyberpunkTheme,
      mintFreshTheme,
    ];
  }

  // VIB3 Classic (Original)
  static const VIB3Theme vib3ClassicTheme = VIB3Theme(
    id: vib3Classic,
    name: 'VIB3 Classic',
    description: 'The original VIB3 experience',
    primaryColor: Color(0xFFFF0080),
    secondaryColor: Color(0xFF00F0FF),
    backgroundColor: Color(0xFF000000),
    surfaceColor: Color(0xFF1A1A1A),
    gradients: {
      'like': [Color(0xFFFF0080), Color(0xFF00F0FF)],
      'follow': [Color(0xFF00F0FF), Color(0xFF40E0D0)],
      'profile': [Color(0xFF00F0FF), Color(0xFF80F8FF)],
      'comment': [Color(0xFF00F0FF), Color(0xFF00CED1)],
      'share': [Color(0xFFFF0080), Color(0xFFFF4DA6)],
    },
    icon: '🎵',
  );

  // Neon City - Electric blues and magentas
  static const VIB3Theme neonCityTheme = VIB3Theme(
    id: neonCity,
    name: 'Neon City',
    description: 'Electric nights in the city',
    primaryColor: Color(0xFF00FFFF),
    secondaryColor: Color(0xFFFF00FF),
    backgroundColor: Color(0xFF0A0A0F),
    surfaceColor: Color(0xFF1A1A2E),
    gradients: {
      'like': [Color(0xFFFF00FF), Color(0xFF8A2BE2)],
      'follow': [Color(0xFF00FFFF), Color(0xFF0080FF)],
      'profile': [Color(0xFF00FFFF), Color(0xFF40E0D0)],
      'comment': [Color(0xFF00FFFF), Color(0xFF1E90FF)],
      'share': [Color(0xFFFF00FF), Color(0xFFFF1493)],
    },
    icon: '🌃',
  );

  // Cosmic Void - Deep space purples and blues
  static const VIB3Theme cosmicVoidTheme = VIB3Theme(
    id: cosmicVoid,
    name: 'Cosmic Void',
    description: 'Journey through the stars',
    primaryColor: Color(0xFF9400D3),
    secondaryColor: Color(0xFF4169E1),
    backgroundColor: Color(0xFF000011),
    surfaceColor: Color(0xFF1A0F2E),
    gradients: {
      'like': [Color(0xFF9400D3), Color(0xFF4B0082)],
      'follow': [Color(0xFF4169E1), Color(0xFF6495ED)],
      'profile': [Color(0xFF8A2BE2), Color(0xFF9370DB)],
      'comment': [Color(0xFF4169E1), Color(0xFF0000FF)],
      'share': [Color(0xFF9400D3), Color(0xFFDA70D6)],
    },
    icon: '🌌',
  );

  // Sunset Vibes - Warm oranges and pinks
  static const VIB3Theme sunsetVibesTheme = VIB3Theme(
    id: sunsetVibes,
    name: 'Sunset Vibes',
    description: 'Golden hour energy',
    primaryColor: Color(0xFFFF6B35),
    secondaryColor: Color(0xFFFFD23F),
    backgroundColor: Color(0xFF1A0F0A),
    surfaceColor: Color(0xFF2E1A1A),
    gradients: {
      'like': [Color(0xFFFF6B35), Color(0xFFFF1744)],
      'follow': [Color(0xFFFFD23F), Color(0xFFFFA726)],
      'profile': [Color(0xFFFF8A50), Color(0xFFFFAB40)],
      'comment': [Color(0xFFFFD23F), Color(0xFFFF9800)],
      'share': [Color(0xFFFF6B35), Color(0xFFFF5722)],
    },
    icon: '🌅',
  );

  // Ocean Depth - Deep blues and teals
  static const VIB3Theme oceanDepthTheme = VIB3Theme(
    id: oceanDepth,
    name: 'Ocean Depth',
    description: 'Deep sea mysteries',
    primaryColor: Color(0xFF006994),
    secondaryColor: Color(0xFF00BCD4),
    backgroundColor: Color(0xFF0A1621),
    surfaceColor: Color(0xFF1A252F),
    gradients: {
      'like': [Color(0xFF006994), Color(0xFF0277BD)],
      'follow': [Color(0xFF00BCD4), Color(0xFF26C6DA)],
      'profile': [Color(0xFF00ACC1), Color(0xFF4DD0E1)],
      'comment': [Color(0xFF00BCD4), Color(0xFF00E5FF)],
      'share': [Color(0xFF006994), Color(0xFF0288D1)],
    },
    icon: '🌊',
  );

  // Retro Wave - 80s inspired synthwave
  static const VIB3Theme retroWaveTheme = VIB3Theme(
    id: retroWave,
    name: 'Retro Wave',
    description: '80s synthwave nostalgia',
    primaryColor: Color(0xFFFF073A),
    secondaryColor: Color(0xFF39FF14),
    backgroundColor: Color(0xFF0D0221),
    surfaceColor: Color(0xFF1A0B3A),
    gradients: {
      'like': [Color(0xFFFF073A), Color(0xFFFF6B9D)],
      'follow': [Color(0xFF39FF14), Color(0xFF76FF03)],
      'profile': [Color(0xFFFF073A), Color(0xFF39FF14)],
      'comment': [Color(0xFF39FF14), Color(0xFF00E676)],
      'share': [Color(0xFFFF073A), Color(0xFFE91E63)],
    },
    icon: '🕹️',
  );

  // Dark Purple - Elegant purple tones
  static const VIB3Theme darkPurpleTheme = VIB3Theme(
    id: darkPurple,
    name: 'Dark Purple',
    description: 'Mysterious and elegant',
    primaryColor: Color(0xFF7B1FA2),
    secondaryColor: Color(0xFFBA68C8),
    backgroundColor: Color(0xFF0F0A1A),
    surfaceColor: Color(0xFF1E1A2E),
    gradients: {
      'like': [Color(0xFF7B1FA2), Color(0xFF9C27B0)],
      'follow': [Color(0xFFBA68C8), Color(0xFFCE93D8)],
      'profile': [Color(0xFF8E24AA), Color(0xFFAB47BC)],
      'comment': [Color(0xFFBA68C8), Color(0xFFE1BEE7)],
      'share': [Color(0xFF7B1FA2), Color(0xFF8E24AA)],
    },
    icon: '🔮',
  );

  // Golden Hour - Warm golds and yellows
  static const VIB3Theme goldenHourTheme = VIB3Theme(
    id: goldenHour,
    name: 'Golden Hour',
    description: 'Luxurious golden tones',
    primaryColor: Color(0xFFFFB300),
    secondaryColor: Color(0xFFFFC107),
    backgroundColor: Color(0xFF1A1511),
    surfaceColor: Color(0xFF2E2318),
    gradients: {
      'like': [Color(0xFFFFB300), Color(0xFFFFA000)],
      'follow': [Color(0xFFFFC107), Color(0xFFFFD54F)],
      'profile': [Color(0xFFFFCA28), Color(0xFFFFE082)],
      'comment': [Color(0xFFFFC107), Color(0xFFFFEB3B)],
      'share': [Color(0xFFFFB300), Color(0xFFFF8F00)],
    },
    icon: '✨',
  );

  // Cyberpunk - Neon greens and hot pinks
  static const VIB3Theme cyberpunkTheme = VIB3Theme(
    id: cyberpunk,
    name: 'Cyberpunk',
    description: 'Future tech vibes',
    primaryColor: Color(0xFF00FF41),
    secondaryColor: Color(0xFFFF0080),
    backgroundColor: Color(0xFF0A0A0A),
    surfaceColor: Color(0xFF1A1A1A),
    gradients: {
      'like': [Color(0xFFFF0080), Color(0xFFFF1744)],
      'follow': [Color(0xFF00FF41), Color(0xFF76FF03)],
      'profile': [Color(0xFF00FF41), Color(0xFF64DD17)],
      'comment': [Color(0xFF00FF41), Color(0xFF00E676)],
      'share': [Color(0xFFFF0080), Color(0xFFE91E63)],
    },
    icon: '🤖',
  );

  // Mint Fresh - Cool mint and fresh greens
  static const VIB3Theme mintFreshTheme = VIB3Theme(
    id: mintFresh,
    name: 'Mint Fresh',
    description: 'Cool and refreshing',
    primaryColor: Color(0xFF00E5A0),
    secondaryColor: Color(0xFF7FFFD4),
    backgroundColor: Color(0xFF0A1A15),
    surfaceColor: Color(0xFF1A2E25),
    gradients: {
      'like': [Color(0xFF00E5A0), Color(0xFF26A69A)],
      'follow': [Color(0xFF7FFFD4), Color(0xFFB2DFDB)],
      'profile': [Color(0xFF4DB6AC), Color(0xFF80CBC4)],
      'comment': [Color(0xFF7FFFD4), Color(0xFF64FFDA)],
      'share': [Color(0xFF00E5A0), Color(0xFF1DE9B6)],
    },
    icon: '🌿',
  );
}

// Theme data class
class VIB3Theme {
  final String id;
  final String name;
  final String description;
  final Color primaryColor;
  final Color secondaryColor;
  final Color backgroundColor;
  final Color surfaceColor;
  final Map<String, List<Color>> gradients;
  final String icon;

  const VIB3Theme({
    required this.id,
    required this.name,
    required this.description,
    required this.primaryColor,
    required this.secondaryColor,
    required this.backgroundColor,
    required this.surfaceColor,
    required this.gradients,
    required this.icon,
  });

  // Get gradient for specific button type
  List<Color> getGradient(String type) {
    return gradients[type] ?? [primaryColor, secondaryColor];
  }

  // Convert to Flutter ThemeData
  ThemeData toThemeData() {
    return ThemeData(
      primaryColor: primaryColor,
      scaffoldBackgroundColor: backgroundColor,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.dark(
        primary: primaryColor,
        secondary: secondaryColor,
        background: backgroundColor,
        surface: surfaceColor,
      ),
    );
  }
}