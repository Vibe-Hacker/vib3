import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  final String? userId;
  
  const ProfileScreen({Key? key, this.userId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: Center(
        child: Text(userId != null 
          ? 'User Profile Screen - Coming Soon' 
          : 'My Profile Screen - Coming Soon'),
      ),
    );
  }
}