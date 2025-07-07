import 'dart:io';
import 'grok_dev_assistant.dart';

/// Command-line interface for Grok Dev Assistant
/// Run: dart lib/dev/grok_dev_cli.dart
void main(List<String> args) async {
  print('🤖 VIB3 Grok Dev Assistant');
  print('========================\n');
  
  while (true) {
    print('\nWhat would you like help with?');
    print('1. Generate Flutter widget');
    print('2. Fix an error');
    print('3. Generate API integration');
    print('4. Optimize code');
    print('5. Generate tests');
    print('6. Convert design to code');
    print('7. Plan a feature');
    print('8. Exit\n');
    
    stdout.write('Choose option (1-8): ');
    final choice = stdin.readLineSync();
    
    if (choice == '8') {
      print('\nGoodbye! Happy coding! 🚀');
      break;
    }
    
    await handleChoice(choice ?? '');
  }
}

Future<void> handleChoice(String choice) async {
  switch (choice) {
    case '1':
      await generateWidget();
      break;
    case '2':
      await fixError();
      break;
    case '3':
      await generateApi();
      break;
    case '4':
      await optimizeCode();
      break;
    case '5':
      await generateTests();
      break;
    case '6':
      await designToCode();
      break;
    case '7':
      await planFeature();
      break;
    default:
      print('Invalid choice. Please try again.');
  }
}

Future<void> generateWidget() async {
  stdout.write('\nDescribe the widget you need: ');
  final description = stdin.readLineSync() ?? '';
  
  print('\n⏳ Generating widget code...\n');
  final code = await GrokDevAssistant.generateFlutterWidget(description);
  
  print('Generated Widget Code:');
  print('=' * 50);
  print(code);
  print('=' * 50);
  
  stdout.write('\nSave to file? (y/n): ');
  if (stdin.readLineSync()?.toLowerCase() == 'y') {
    stdout.write('Filename (without .dart): ');
    final filename = stdin.readLineSync() ?? 'generated_widget';
    await File('lib/widgets/$filename.dart').writeAsString(code);
    print('✅ Saved to lib/widgets/$filename.dart');
  }
}

Future<void> fixError() async {
  stdout.write('\nPaste the error message: ');
  final error = stdin.readLineSync() ?? '';
  
  stdout.write('Paste the code context (press Enter twice when done):\n');
  final lines = <String>[];
  while (true) {
    final line = stdin.readLineSync() ?? '';
    if (line.isEmpty && lines.isNotEmpty && lines.last.isEmpty) break;
    lines.add(line);
  }
  
  print('\n⏳ Analyzing and fixing error...\n');
  final fix = await GrokDevAssistant.fixError(error, lines.join('\n'));
  
  print('Solution:');
  print('=' * 50);
  print(fix);
  print('=' * 50);
}

Future<void> generateApi() async {
  stdout.write('\nAPI endpoint (e.g., /api/videos): ');
  final endpoint = stdin.readLineSync() ?? '';
  
  stdout.write('What should this integration do?: ');
  final functionality = stdin.readLineSync() ?? '';
  
  print('\n⏳ Generating API integration code...\n');
  final code = await GrokDevAssistant.generateApiIntegration(endpoint, functionality);
  
  print('API Integration Code:');
  print('=' * 50);
  print(code);
  print('=' * 50);
}

Future<void> optimizeCode() async {
  stdout.write('\nOptimization goal (e.g., performance, memory, readability): ');
  final goal = stdin.readLineSync() ?? 'performance';
  
  stdout.write('Paste the code to optimize (press Enter twice when done):\n');
  final lines = <String>[];
  while (true) {
    final line = stdin.readLineSync() ?? '';
    if (line.isEmpty && lines.isNotEmpty && lines.last.isEmpty) break;
    lines.add(line);
  }
  
  print('\n⏳ Optimizing code...\n');
  final optimized = await GrokDevAssistant.optimizeCode(lines.join('\n'), goal);
  
  print('Optimized Code:');
  print('=' * 50);
  print(optimized);
  print('=' * 50);
}

Future<void> generateTests() async {
  stdout.write('\nTest type (unit/widget/integration): ');
  final testType = stdin.readLineSync() ?? 'unit';
  
  stdout.write('Paste the code to test (press Enter twice when done):\n');
  final lines = <String>[];
  while (true) {
    final line = stdin.readLineSync() ?? '';
    if (line.isEmpty && lines.isNotEmpty && lines.last.isEmpty) break;
    lines.add(line);
  }
  
  print('\n⏳ Generating tests...\n');
  final tests = await GrokDevAssistant.generateTests(lines.join('\n'), testType);
  
  print('Generated Tests:');
  print('=' * 50);
  print(tests);
  print('=' * 50);
}

Future<void> designToCode() async {
  stdout.write('\nDescribe the design (colors, layout, components): ');
  final design = stdin.readLineSync() ?? '';
  
  print('\n⏳ Converting design to Flutter code...\n');
  final code = await GrokDevAssistant.designToCode(design);
  
  print('Flutter UI Code:');
  print('=' * 50);
  print(code);
  print('=' * 50);
}

Future<void> planFeature() async {
  stdout.write('\nDescribe the feature you want to build: ');
  final feature = stdin.readLineSync() ?? '';
  
  print('\n⏳ Planning feature implementation...\n');
  final plan = await GrokDevAssistant.planFeature(feature);
  
  print('Feature Implementation Plan:');
  print('=' * 50);
  print(plan);
  print('=' * 50);
  
  stdout.write('\nSave plan to file? (y/n): ');
  if (stdin.readLineSync()?.toLowerCase() == 'y') {
    final filename = 'feature_plan_${DateTime.now().millisecondsSinceEpoch}.md';
    await File(filename).writeAsString(plan);
    print('✅ Saved to $filename');
  }
}