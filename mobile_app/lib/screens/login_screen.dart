import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _usernameController = TextEditingController();
  
  bool _isLogin = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _usernameController.dispose();
    super.dispose();
  }

  void _toggleAuthMode() {
    setState(() {
      _isLogin = !_isLogin;
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    bool success;
    if (_isLogin) {
      success = await authProvider.login(
        _emailController.text.trim(),
        _passwordController.text,
      );
    } else {
      success = await authProvider.signup(
        _usernameController.text.trim(),
        _emailController.text.trim(),
        _passwordController.text,
      );
    }

    if (success && mounted) {
      Navigator.of(context).pushReplacementNamed('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Consumer<AuthProvider>(
          builder: (context, authProvider, child) {
            return Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // VIB3 Logo
                      const Icon(
                        Icons.play_circle_filled,
                        size: 80,
                        color: Color(0xFFFF0080),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        _isLogin ? 'Welcome Back' : 'Join VIB3',
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 32),
                      
                      // Username field (signup only)
                      if (!_isLogin) ...[
                        TextFormField(
                          controller: _usernameController,
                          decoration: const InputDecoration(
                            labelText: 'Username',
                            filled: true,
                            fillColor: Color(0xFF1A1A1A),
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (!_isLogin && (value == null || value.isEmpty)) {
                              return 'Please enter a username';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                      ],
                      
                      // Email field
                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'Email',
                          filled: true,
                          fillColor: Color(0xFF1A1A1A),
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your email';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      
                      // Password field
                      TextFormField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Password',
                          filled: true,
                          fillColor: Color(0xFF1A1A1A),
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your password';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 24),
                      
                      // Submit button
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: authProvider.isLoading ? null : _submit,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFFF0080),
                          ),
                          child: authProvider.isLoading
                              ? const CircularProgressIndicator(color: Colors.white)
                              : Text(_isLogin ? 'Sign In' : 'Sign Up'),
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Toggle auth mode
                      TextButton(
                        onPressed: _toggleAuthMode,
                        child: Text(
                          _isLogin ? 'Create new account' : 'Already have an account?',
                          style: const TextStyle(color: Color(0xFF00F0FF)),
                        ),
                      ),
                      
                      // Error message
                      if (authProvider.error != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: Text(
                            authProvider.error!,
                            style: const TextStyle(color: Colors.red),
                            textAlign: TextAlign.center,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}