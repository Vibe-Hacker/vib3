import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class CameraButton extends StatelessWidget {
  const CameraButton({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.camera_alt_outlined, size: 26),
      onPressed: () => context.push('/camera'),
    );
  }
}