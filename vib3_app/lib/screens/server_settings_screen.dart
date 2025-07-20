import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_adapter.dart';
import '../services/auth_service_v2.dart';
import '../config/api_config.dart';

class ServerSettingsScreen extends StatefulWidget {
  @override
  _ServerSettingsScreenState createState() => _ServerSettingsScreenState();
}

class _ServerSettingsScreenState extends State<ServerSettingsScreen> {
  final _ipController = TextEditingController();
  bool _useMicroservices = ApiConfig.useMicroservices;
  bool _isTestingConnection = false;
  String? _connectionStatus;
  
  @override
  void initState() {
    super.initState();
    _loadSettings();
  }
  
  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    final savedIp = prefs.getString('server_ip');
    final useMicroservices = prefs.getBool('use_microservices') ?? true;
    
    setState(() {
      _ipController.text = savedIp ?? '';
      _useMicroservices = useMicroservices;
    });
  }
  
  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    
    if (_ipController.text.isNotEmpty) {
      await prefs.setString('server_ip', _ipController.text);
      ApiAdapter().setServerIp(_ipController.text);
      AuthServiceV2().setServerIp(_ipController.text);
    }
    
    await prefs.setBool('use_microservices', _useMicroservices);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Settings saved successfully')),
    );
  }
  
  Future<void> _testConnection() async {
    setState(() {
      _isTestingConnection = true;
      _connectionStatus = null;
    });
    
    try {
      final api = ApiAdapter();
      if (_ipController.text.isNotEmpty) {
        api.setServerIp(_ipController.text);
      }
      
      // Test API Gateway health endpoint
      final response = await api.get('health').timeout(Duration(seconds: 5));
      
      if (response.statusCode == 200) {
        setState(() {
          _connectionStatus = '✅ Connection successful!';
        });
      } else {
        setState(() {
          _connectionStatus = '❌ Server responded with: ${response.statusCode}';
        });
      }
    } catch (e) {
      setState(() {
        _connectionStatus = '❌ Connection failed: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isTestingConnection = false;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: Text('Server Settings'),
        actions: [
          TextButton(
            onPressed: _saveSettings,
            child: Text('Save', style: TextStyle(color: Color(0xFFFF0080))),
          ),
        ],
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Server Configuration',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 20),
            
            // Architecture toggle
            SwitchListTile(
              title: Text('Use Microservices', style: TextStyle(color: Colors.white)),
              subtitle: Text(
                _useMicroservices 
                  ? 'Using new high-performance architecture' 
                  : 'Using legacy monolith',
                style: TextStyle(color: Colors.grey),
              ),
              value: _useMicroservices,
              activeColor: Color(0xFFFF0080),
              onChanged: (value) {
                setState(() {
                  _useMicroservices = value;
                });
              },
            ),
            
            SizedBox(height: 20),
            
            // Server IP input
            if (_useMicroservices) ...[
              Text(
                'Server IP Address',
                style: TextStyle(color: Colors.white, fontSize: 16),
              ),
              SizedBox(height: 8),
              TextField(
                controller: _ipController,
                style: TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'e.g., vib3app.net or 192.168.1.100',
                  hintStyle: TextStyle(color: Colors.grey),
                  filled: true,
                  fillColor: Colors.grey[900],
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide.none,
                  ),
                  prefixIcon: Icon(Icons.computer, color: Colors.grey),
                ),
                keyboardType: TextInputType.url,
              ),
              SizedBox(height: 8),
              Text(
                'Enter your server domain or IP address',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
              
              SizedBox(height: 20),
              
              // Test connection button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isTestingConnection ? null : _testConnection,
                  icon: _isTestingConnection 
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Icon(Icons.network_check),
                  label: Text(_isTestingConnection ? 'Testing...' : 'Test Connection'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(0xFF00F0FF),
                    foregroundColor: Colors.black,
                    padding: EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
              
              if (_connectionStatus != null) ...[
                SizedBox(height: 16),
                Container(
                  padding: EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _connectionStatus!.startsWith('✅') 
                      ? Colors.green.withOpacity(0.2)
                      : Colors.red.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: _connectionStatus!.startsWith('✅') 
                        ? Colors.green 
                        : Colors.red,
                    ),
                  ),
                  child: Text(
                    _connectionStatus!,
                    style: TextStyle(
                      color: _connectionStatus!.startsWith('✅') 
                        ? Colors.green 
                        : Colors.red,
                    ),
                  ),
                ),
              ],
            ],
            
            Spacer(),
            
            // Info section
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[900],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'ℹ️ Information',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    _useMicroservices
                      ? 'Microservices architecture provides:\n'
                        '• 80% faster response times\n'
                        '• Better scalability\n'
                        '• Redis caching\n'
                        '• Load balancing'
                      : 'Legacy monolith is stable but slower.\n'
                        'Switch to microservices for better performance.',
                    style: TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  @override
  void dispose() {
    _ipController.dispose();
    super.dispose();
  }
}