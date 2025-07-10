import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class QAScreen extends StatefulWidget {
  final String? creatorId;
  final bool isCreatorView;
  
  const QAScreen({
    super.key,
    this.creatorId,
    this.isCreatorView = false,
  });
  
  @override
  State<QAScreen> createState() => _QAScreenState();
}

class _QAScreenState extends State<QAScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _questionController = TextEditingController();
  
  // Sample Q&A data
  final List<Question> _questions = [
    Question(
      id: '1',
      text: 'What camera do you use for filming?',
      userId: 'user123',
      username: '@curious_fan',
      timestamp: DateTime.now().subtract(const Duration(hours: 2)),
      likes: 45,
      isAnswered: true,
      answer: Answer(
        text: 'I use the iPhone 14 Pro Max with a gimbal for stabilization! The quality is amazing.',
        timestamp: DateTime.now().subtract(const Duration(hours: 1)),
        likes: 120,
        videoResponse: null,
      ),
    ),
    Question(
      id: '2',
      text: 'How did you get started on VIB3?',
      userId: 'user456',
      username: '@newbie_creator',
      timestamp: DateTime.now().subtract(const Duration(days: 1)),
      likes: 32,
      isAnswered: true,
      answer: Answer(
        text: 'Started just for fun with dance videos, then found my niche in comedy skits!',
        timestamp: DateTime.now().subtract(const Duration(hours: 18)),
        likes: 89,
        videoResponse: 'video_id_123',
      ),
    ),
    Question(
      id: '3',
      text: 'Any tips for growing followers?',
      userId: 'user789',
      username: '@aspiring_star',
      timestamp: DateTime.now().subtract(const Duration(hours: 5)),
      likes: 67,
      isAnswered: false,
    ),
  ];
  
  final List<String> _categories = [
    'All',
    'Content Creation',
    'Personal',
    'Career',
    'Advice',
    'Technical',
  ];
  
  String _selectedCategory = 'All';
  String _sortBy = 'popular';
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: widget.isCreatorView ? 3 : 2,
      vsync: this,
    );
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    _questionController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: Text(
          widget.isCreatorView ? 'Manage Q&A' : 'Q&A',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          if (widget.isCreatorView)
            IconButton(
              icon: const Icon(Icons.settings, color: Colors.white),
              onPressed: _showQASettings,
            ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF00CED1),
          labelColor: const Color(0xFF00CED1),
          unselectedLabelColor: Colors.white54,
          tabs: [
            const Tab(text: 'Questions'),
            const Tab(text: 'Answered'),
            if (widget.isCreatorView) const Tab(text: 'Analytics'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildQuestionsTab(),
          _buildAnsweredTab(),
          if (widget.isCreatorView) _buildAnalyticsTab(),
        ],
      ),
      floatingActionButton: !widget.isCreatorView
          ? FloatingActionButton(
              onPressed: _showAskQuestionModal,
              backgroundColor: const Color(0xFF00CED1),
              child: const Icon(Icons.add, color: Colors.black),
            )
          : null,
    );
  }
  
  Widget _buildQuestionsTab() {
    final unansweredQuestions = _questions.where((q) => !q.isAnswered).toList();
    
    return Column(
      children: [
        // Filters
        Container(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Category filter
              Expanded(
                child: SizedBox(
                  height: 35,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _categories.length,
                    itemBuilder: (context, index) {
                      final category = _categories[index];
                      final isSelected = _selectedCategory == category;
                      
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(category),
                          selected: isSelected,
                          onSelected: (selected) {
                            setState(() {
                              _selectedCategory = category;
                            });
                          },
                          backgroundColor: Colors.white.withOpacity(0.1),
                          selectedColor: const Color(0xFF00CED1),
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.black : Colors.white,
                            fontSize: 12,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
              
              // Sort button
              PopupMenuButton<String>(
                initialValue: _sortBy,
                onSelected: (value) {
                  setState(() {
                    _sortBy = value;
                  });
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'popular',
                    child: Text('Most Popular'),
                  ),
                  const PopupMenuItem(
                    value: 'recent',
                    child: Text('Most Recent'),
                  ),
                  const PopupMenuItem(
                    value: 'trending',
                    child: Text('Trending'),
                  ),
                ],
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.white30),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.sort, color: Colors.white54, size: 16),
                      SizedBox(width: 4),
                      Icon(Icons.arrow_drop_down, color: Colors.white54, size: 16),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        
        // Questions list
        Expanded(
          child: unansweredQuestions.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.help_outline,
                        size: 64,
                        color: Colors.white.withOpacity(0.3),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        widget.isCreatorView 
                            ? 'No pending questions'
                            : 'No questions yet',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.5),
                          fontSize: 16,
                        ),
                      ),
                      if (!widget.isCreatorView) ...[
                        const SizedBox(height: 8),
                        const Text(
                          'Be the first to ask!',
                          style: TextStyle(
                            color: Color(0xFF00CED1),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: unansweredQuestions.length,
                  itemBuilder: (context, index) {
                    final question = unansweredQuestions[index];
                    return _buildQuestionCard(question);
                  },
                ),
        ),
      ],
    );
  }
  
  Widget _buildAnsweredTab() {
    final answeredQuestions = _questions.where((q) => q.isAnswered).toList();
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: answeredQuestions.length,
      itemBuilder: (context, index) {
        final question = answeredQuestions[index];
        return _buildAnsweredQuestionCard(question);
      },
    );
  }
  
  Widget _buildAnalyticsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stats cards
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  title: 'Total Questions',
                  value: '156',
                  icon: Icons.help_outline,
                  color: const Color(0xFF00CED1),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  title: 'Answered',
                  value: '89%',
                  icon: Icons.check_circle_outline,
                  color: Colors.green,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  title: 'Avg Response Time',
                  value: '2.5h',
                  icon: Icons.schedule,
                  color: Colors.orange,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  title: 'Engagement',
                  value: '4.8K',
                  icon: Icons.favorite_outline,
                  color: Colors.pink,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Top questions
          const Text(
            'Top Questions This Week',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          ..._questions.take(3).map((q) => _buildTopQuestionItem(q)),
        ],
      ),
    );
  }
  
  Widget _buildQuestionCard(Question question) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User info
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: const Color(0xFF00CED1),
                child: Text(
                  question.username[1].toUpperCase(),
                  style: const TextStyle(
                    color: Colors.black,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      question.username,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      _formatTime(question.timestamp),
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              if (widget.isCreatorView)
                Row(
                  children: [
                    IconButton(
                      onPressed: () => _answerQuestion(question),
                      icon: const Icon(
                        Icons.reply,
                        color: Color(0xFF00CED1),
                        size: 20,
                      ),
                    ),
                    IconButton(
                      onPressed: () => _deleteQuestion(question),
                      icon: const Icon(
                        Icons.delete_outline,
                        color: Colors.red,
                        size: 20,
                      ),
                    ),
                  ],
                ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Question text
          Text(
            question.text,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
            ),
          ),
          
          const SizedBox(height: 12),
          
          // Engagement
          Row(
            children: [
              GestureDetector(
                onTap: () => _likeQuestion(question),
                child: Row(
                  children: [
                    Icon(
                      Icons.favorite_outline,
                      color: Colors.white54,
                      size: 20,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      question.likes.toString(),
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              if (!widget.isCreatorView)
                TextButton(
                  onPressed: () => _reportQuestion(question),
                  child: const Text(
                    'Report',
                    style: TextStyle(
                      color: Colors.white54,
                      fontSize: 12,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildAnsweredQuestionCard(Question question) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Question
          _buildQuestionCard(question),
          
          // Answer
          if (question.answer != null) ...[
            const SizedBox(height: 8),
            Container(
              margin: const EdgeInsets.only(left: 40),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF00CED1).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: const Color(0xFF00CED1).withOpacity(0.3),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(
                        Icons.verified,
                        color: Color(0xFF00CED1),
                        size: 16,
                      ),
                      SizedBox(width: 4),
                      Text(
                        'Creator answered',
                        style: TextStyle(
                          color: Color(0xFF00CED1),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    question.answer!.text,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                    ),
                  ),
                  if (question.answer!.videoResponse != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: const [
                          Icon(
                            Icons.play_circle_filled,
                            color: Color(0xFF00CED1),
                            size: 24,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'Video Response',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        Icons.favorite,
                        color: Colors.pink,
                        size: 16,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        question.answer!.likes.toString(),
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Text(
                        _formatTime(question.answer!.timestamp),
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
  
  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            title,
            style: const TextStyle(
              color: Colors.white54,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildTopQuestionItem(Question question) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              question.text,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.favorite,
                    color: Colors.pink,
                    size: 16,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    question.likes.toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              if (question.isAnswered)
                const Icon(
                  Icons.check_circle,
                  color: Colors.green,
                  size: 16,
                ),
            ],
          ),
        ],
      ),
    );
  }
  
  void _showAskQuestionModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        decoration: const BoxDecoration(
          color: Color(0xFF1A1A1A),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Ask a Question',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              
              TextField(
                controller: _questionController,
                maxLines: 3,
                maxLength: 200,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'What would you like to know?',
                  hintStyle: const TextStyle(color: Colors.white54),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.1),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  counterStyle: const TextStyle(color: Colors.white54),
                ),
              ),
              
              const SizedBox(height: 20),
              
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text(
                        'Cancel',
                        style: TextStyle(color: Colors.white54),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        if (_questionController.text.isNotEmpty) {
                          _submitQuestion();
                          Navigator.pop(context);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF00CED1),
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: const Text(
                        'Ask',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _showQASettings() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Color(0xFF1A1A1A),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Q&A Settings',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            
            SwitchListTile(
              title: const Text(
                'Allow Questions',
                style: TextStyle(color: Colors.white),
              ),
              subtitle: const Text(
                'Let followers ask you questions',
                style: TextStyle(color: Colors.white54, fontSize: 12),
              ),
              value: true,
              onChanged: (value) {},
              activeColor: const Color(0xFF00CED1),
            ),
            
            SwitchListTile(
              title: const Text(
                'Auto-filter Spam',
                style: TextStyle(color: Colors.white),
              ),
              subtitle: const Text(
                'Automatically hide spam questions',
                style: TextStyle(color: Colors.white54, fontSize: 12),
              ),
              value: true,
              onChanged: (value) {},
              activeColor: const Color(0xFF00CED1),
            ),
            
            SwitchListTile(
              title: const Text(
                'Notify New Questions',
                style: TextStyle(color: Colors.white),
              ),
              subtitle: const Text(
                'Get notified when you receive questions',
                style: TextStyle(color: Colors.white54, fontSize: 12),
              ),
              value: false,
              onChanged: (value) {},
              activeColor: const Color(0xFF00CED1),
            ),
          ],
        ),
      ),
    );
  }
  
  void _answerQuestion(Question question) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AnswerQuestionModal(question: question),
    );
  }
  
  void _deleteQuestion(Question question) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Delete Question?',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          'This action cannot be undone.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Cancel',
              style: TextStyle(color: Colors.white54),
            ),
          ),
          TextButton(
            onPressed: () {
              setState(() {
                _questions.remove(question);
              });
              Navigator.pop(context);
            },
            child: const Text(
              'Delete',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }
  
  void _likeQuestion(Question question) {
    setState(() {
      question.likes++;
    });
    HapticFeedback.lightImpact();
  }
  
  void _reportQuestion(Question question) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Question reported'),
        backgroundColor: Colors.orange,
      ),
    );
  }
  
  void _submitQuestion() {
    setState(() {
      _questions.insert(
        0,
        Question(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          text: _questionController.text,
          userId: 'current_user',
          username: '@current_user',
          timestamp: DateTime.now(),
          likes: 0,
          isAnswered: false,
        ),
      );
    });
    _questionController.clear();
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Question submitted!'),
        backgroundColor: Color(0xFF00CED1),
      ),
    );
  }
  
  String _formatTime(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);
    
    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${timestamp.day}/${timestamp.month}';
    }
  }
}

class AnswerQuestionModal extends StatefulWidget {
  final Question question;
  
  const AnswerQuestionModal({
    super.key,
    required this.question,
  });
  
  @override
  State<AnswerQuestionModal> createState() => _AnswerQuestionModalState();
}

class _AnswerQuestionModalState extends State<AnswerQuestionModal> {
  final TextEditingController _answerController = TextEditingController();
  bool _isVideoResponse = false;
  
  @override
  void dispose() {
    _answerController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A1A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Answer Question',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            // Question
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                widget.question.text,
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                ),
              ),
            ),
            
            const SizedBox(height: 20),
            
            // Response type
            Row(
              children: [
                ChoiceChip(
                  label: const Text('Text'),
                  selected: !_isVideoResponse,
                  onSelected: (selected) {
                    setState(() {
                      _isVideoResponse = false;
                    });
                  },
                  backgroundColor: Colors.white.withOpacity(0.1),
                  selectedColor: const Color(0xFF00CED1),
                  labelStyle: TextStyle(
                    color: !_isVideoResponse ? Colors.black : Colors.white,
                  ),
                ),
                const SizedBox(width: 12),
                ChoiceChip(
                  label: const Text('Video'),
                  selected: _isVideoResponse,
                  onSelected: (selected) {
                    setState(() {
                      _isVideoResponse = true;
                    });
                  },
                  backgroundColor: Colors.white.withOpacity(0.1),
                  selectedColor: const Color(0xFF00CED1),
                  labelStyle: TextStyle(
                    color: _isVideoResponse ? Colors.black : Colors.white,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 20),
            
            // Answer input
            if (!_isVideoResponse)
              TextField(
                controller: _answerController,
                maxLines: 3,
                maxLength: 500,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Type your answer...',
                  hintStyle: const TextStyle(color: Colors.white54),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.1),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  counterStyle: const TextStyle(color: Colors.white54),
                ),
              )
            else
              GestureDetector(
                onTap: () {
                  Navigator.pushNamed(context, '/video-creator', arguments: {
                    'isQAResponse': true,
                    'questionId': widget.question.id,
                  });
                },
                child: Container(
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFF00CED1).withOpacity(0.5),
                    ),
                  ),
                  child: const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.videocam,
                          color: Color(0xFF00CED1),
                          size: 32,
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Record Video Response',
                          style: TextStyle(
                            color: Color(0xFF00CED1),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            
            const SizedBox(height: 20),
            
            // Actions
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text(
                      'Cancel',
                      style: TextStyle(color: Colors.white54),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: !_isVideoResponse && _answerController.text.isEmpty
                        ? null
                        : () {
                            // Submit answer
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Answer posted!'),
                                backgroundColor: Color(0xFF00CED1),
                              ),
                            );
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00CED1),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                    ),
                    child: const Text(
                      'Post Answer',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// Data models
class Question {
  final String id;
  final String text;
  final String userId;
  final String username;
  final DateTime timestamp;
  int likes;
  final bool isAnswered;
  final Answer? answer;
  
  Question({
    required this.id,
    required this.text,
    required this.userId,
    required this.username,
    required this.timestamp,
    required this.likes,
    required this.isAnswered,
    this.answer,
  });
}

class Answer {
  final String text;
  final DateTime timestamp;
  final int likes;
  final String? videoResponse;
  
  Answer({
    required this.text,
    required this.timestamp,
    required this.likes,
    this.videoResponse,
  });
}