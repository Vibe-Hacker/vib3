import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_theme.dart';

class MessageButton extends StatelessWidget {
  const MessageButton({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        IconButton(
          icon: const Icon(Icons.send_outlined, size: 26),
          onPressed: () => context.push('/messages'),
        ),
        // Unread indicator
        Positioned(
          right: 8,
          top: 8,
          child: Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor,
              shape: BoxShape.circle,
              border: Border.all(
                color: AppTheme.backgroundColor,
                width: 2,
              ),
            ),
          ),
        ),
      ],
    );
  }
}