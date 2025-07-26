import 'package:flutter/material.dart';

class MessagesScreen extends StatelessWidget {
  final String? chatId;
  
  const MessagesScreen({Key? key, this.chatId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: Center(
        child: Text(chatId != null 
          ? 'Chat Screen - Coming Soon' 
          : 'Messages Screen - Coming Soon'),
      ),
    );
  }
}