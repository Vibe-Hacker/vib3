import 'lib/dev/grok_dev_assistant.dart';
import 'dart:io';

void main() async {
  print('🤖 Using Grok AI to fix the syntax error...\n');
  
  // Read the problematic section
  final file = File('lib/widgets/video_feed.dart');
  final lines = await file.readAsLines();
  
  // Get the context around the error (lines 650-790)
  final codeContext = lines.sublist(650, 790).join('\n');
  
  final errorMessage = '''
lib/widgets/video_feed.dart:784:15: Error: Expected ';' after this.
              ),
              ^
lib/widgets/video_feed.dart:785:13: Error: Expected an identifier, but got ')'.
Try inserting an identifier before ')'.
            );
            ^
''';

  print('📋 Sending error to Grok AI for analysis...\n');
  
  final fix = await GrokDevAssistant.fixError(errorMessage, codeContext);
  
  print('💡 Grok AI Solution:');
  print('=' * 60);
  print(fix);
  print('=' * 60);
  
  // Also ask Grok to generate the correct closing structure
  print('\n🔧 Asking Grok to generate the correct widget closing structure...\n');
  
  final widgetStructure = await GrokDevAssistant.generateFlutterWidget(
    'Generate just the correct closing brackets for a PageView.builder itemBuilder that returns Container(child: Center(child: Container(child: Stack(children: [...])))) with proper Flutter syntax'
  );
  
  print('📝 Correct structure from Grok:');
  print(widgetStructure);
}