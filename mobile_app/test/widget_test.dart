// This is a basic Flutter widget test for VIB3 app.

import 'package:flutter_test/flutter_test.dart';

import 'package:vib3/main.dart';

void main() {
  testWidgets('VIB3 app smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const VIB3App());

    // Verify that the splash screen loads
    expect(find.text('VIB3'), findsOneWidget);
    expect(find.text('Express Your Vibe'), findsOneWidget);
  });
}