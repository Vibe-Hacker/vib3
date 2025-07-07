import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Grok AI Development Assistant for VIB3
/// This helps developers build features faster by generating code, fixing bugs, and providing solutions
class GrokDevAssistant {
  static const String _baseUrl = 'https://api.x.ai/v1';
  static String get _apiKey => dotenv.env['GROK_API_KEY'] ?? '';

  /// Generate Flutter widget code based on description
  static Future<String> generateFlutterWidget(String widgetDescription) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/chat/completions'),
        headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'messages': [
            {
              'role': 'system',
              'content': '''You are an expert Flutter developer. Generate clean, efficient Flutter widget code.
Follow these rules:
- Use const constructors where possible
- Include proper imports
- Follow Flutter best practices
- Add helpful comments
- Make code reusable and maintainable'''
            },
            {
              'role': 'user',
              'content': 'Generate Flutter widget code for: $widgetDescription',
            }
          ],
          'model': 'grok-beta',
          'stream': false,
          'temperature': 0.3,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['choices'][0]['message']['content'];
      } else {
        throw Exception('Failed to generate widget: ${response.statusCode}');
      }
    } catch (e) {
      print('Grok error generating widget: $e');
      return '// Error generating widget code';
    }
  }

  /// Fix Flutter/Dart errors
  static Future<String> fixError(String errorMessage, String codeContext) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/chat/completions'),
        headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'messages': [
            {
              'role': 'system',
              'content': '''You are a Flutter debugging expert. Analyze the error and provide a fix.
Return:
1. Explanation of the error
2. Fixed code
3. Prevention tips'''
            },
            {
              'role': 'user',
              'content': '''Error: $errorMessage
              
Code context:
$codeContext''',
            }
          ],
          'model': 'grok-beta',
          'stream': false,
          'temperature': 0.2,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['choices'][0]['message']['content'];
      } else {
        throw Exception('Failed to fix error: ${response.statusCode}');
      }
    } catch (e) {
      print('Grok error fixing code: $e');
      return '// Error getting fix';
    }
  }

  /// Generate API integration code
  static Future<String> generateApiIntegration(String apiEndpoint, String functionality) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/chat/completions'),
        headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'messages': [
            {
              'role': 'system',
              'content': '''Generate Flutter/Dart code for API integration.
Include:
- HTTP request with error handling
- Model classes if needed
- Service class with proper methods
- Loading states
- Error handling'''
            },
            {
              'role': 'user',
              'content': 'Create API integration for endpoint: $apiEndpoint to $functionality',
            }
          ],
          'model': 'grok-beta',
          'stream': false,
          'temperature': 0.3,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['choices'][0]['message']['content'];
      } else {
        throw Exception('Failed to generate API code: ${response.statusCode}');
      }
    } catch (e) {
      print('Grok error generating API code: $e');
      return '// Error generating API integration';
    }
  }

  /// Optimize existing code for performance
  static Future<String> optimizeCode(String code, String optimizationGoal) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/chat/completions'),
        headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'messages': [
            {
              'role': 'system',
              'content': '''You are a Flutter performance expert. Optimize the given code.
Focus on:
- Reducing rebuilds
- Improving efficiency
- Memory management
- Best practices
- Clear explanations of changes'''
            },
            {
              'role': 'user',
              'content': '''Optimize this code for $optimizationGoal:
              
$code''',
            }
          ],
          'model': 'grok-beta',
          'stream': false,
          'temperature': 0.3,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['choices'][0]['message']['content'];
      } else {
        throw Exception('Failed to optimize code: ${response.statusCode}');
      }
    } catch (e) {
      print('Grok error optimizing code: $e');
      return '// Error optimizing code';
    }
  }

  /// Generate test cases for a function/widget
  static Future<String> generateTests(String code, String testType) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/chat/completions'),
        headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'messages': [
            {
              'role': 'system',
              'content': '''Generate comprehensive Flutter tests.
Include:
- Unit tests for functions
- Widget tests for UI
- Integration tests if needed
- Edge cases
- Mock data setup'''
            },
            {
              'role': 'user',
              'content': '''Generate $testType tests for:
              
$code''',
            }
          ],
          'model': 'grok-beta',
          'stream': false,
          'temperature': 0.3,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['choices'][0]['message']['content'];
      } else {
        throw Exception('Failed to generate tests: ${response.statusCode}');
      }
    } catch (e) {
      print('Grok error generating tests: $e');
      return '// Error generating tests';
    }
  }

  /// Convert design description to Flutter UI code
  static Future<String> designToCode(String designDescription) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/chat/completions'),
        headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'messages': [
            {
              'role': 'system',
              'content': '''Convert design descriptions to Flutter UI code.
Create:
- Responsive layouts
- Custom widgets
- Animations if mentioned
- Theme-aware colors
- Proper styling'''
            },
            {
              'role': 'user',
              'content': 'Convert this design to Flutter code: $designDescription',
            }
          ],
          'model': 'grok-beta',
          'stream': false,
          'temperature': 0.4,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['choices'][0]['message']['content'];
      } else {
        throw Exception('Failed to convert design: ${response.statusCode}');
      }
    } catch (e) {
      print('Grok error converting design: $e');
      return '// Error converting design';
    }
  }

  /// Generate complete feature implementation plan
  static Future<String> planFeature(String featureDescription) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/chat/completions'),
        headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'messages': [
            {
              'role': 'system',
              'content': '''Create a detailed implementation plan for Flutter features.
Include:
- Architecture decisions
- File structure
- State management approach
- API requirements
- UI/UX considerations
- Step-by-step implementation
- Code snippets for key parts'''
            },
            {
              'role': 'user',
              'content': 'Plan implementation for: $featureDescription',
            }
          ],
          'model': 'grok-beta',
          'stream': false,
          'temperature': 0.5,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['choices'][0]['message']['content'];
      } else {
        throw Exception('Failed to plan feature: ${response.statusCode}');
      }
    } catch (e) {
      print('Grok error planning feature: $e');
      return '// Error planning feature';
    }
  }
}

// Example usage in development:
/*
// Generate a widget
final widgetCode = await GrokDevAssistant.generateFlutterWidget(
  "animated circular progress indicator with gradient colors"
);

// Fix an error
final fix = await GrokDevAssistant.fixError(
  "The method 'setState' isn't defined",
  "class MyWidget extends StatelessWidget { ... }"
);

// Generate API integration
final apiCode = await GrokDevAssistant.generateApiIntegration(
  "/api/videos/:id/analytics",
  "fetch and display video analytics with charts"
);

// Plan a feature
final plan = await GrokDevAssistant.planFeature(
  "live streaming feature with chat and reactions"
);
*/