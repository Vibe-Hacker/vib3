import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class CreatorFundScreen extends StatefulWidget {
  const CreatorFundScreen({super.key});
  
  @override
  State<CreatorFundScreen> createState() => _CreatorFundScreenState();
}

class _CreatorFundScreenState extends State<CreatorFundScreen> 
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  // Creator earnings data
  final CreatorEarnings _earnings = CreatorEarnings(
    balance: 2456.78,
    pendingPayout: 543.21,
    totalEarned: 12345.67,
    videoFundEarnings: 8234.56,
    giftEarnings: 2345.67,
    brandPartnerships: 1765.44,
    monthlyViews: 2500000,
    engagementRate: 8.5,
  );
  
  // Payment methods
  final List<PaymentMethod> _paymentMethods = [
    PaymentMethod(
      id: '1',
      type: PaymentType.bankAccount,
      name: 'Bank of America',
      last4: '1234',
      isDefault: true,
    ),
    PaymentMethod(
      id: '2',
      type: PaymentType.paypal,
      name: 'PayPal',
      last4: 'user@email.com',
      isDefault: false,
    ),
  ];
  
  // Transaction history
  final List<Transaction> _transactions = [
    Transaction(
      id: '1',
      type: TransactionType.payout,
      amount: 1000.00,
      status: TransactionStatus.completed,
      date: DateTime.now().subtract(const Duration(days: 3)),
      description: 'Monthly payout',
    ),
    Transaction(
      id: '2',
      type: TransactionType.videoFund,
      amount: 234.56,
      status: TransactionStatus.pending,
      date: DateTime.now().subtract(const Duration(days: 1)),
      description: 'Video fund earnings',
    ),
    Transaction(
      id: '3',
      type: TransactionType.gift,
      amount: 45.67,
      status: TransactionStatus.completed,
      date: DateTime.now().subtract(const Duration(hours: 12)),
      description: 'Gift from @username',
    ),
  ];
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text(
          'Creator Fund',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF00CED1),
          labelColor: const Color(0xFF00CED1),
          unselectedLabelColor: Colors.white54,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Analytics'),
            Tab(text: 'History'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildOverviewTab(),
          _buildAnalyticsTab(),
          _buildHistoryTab(),
        ],
      ),
    );
  }
  
  Widget _buildOverviewTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Balance card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [
                  Color(0xFF00CED1),
                  Color(0xFF00A8A8),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Available Balance',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '\$${_earnings.balance.toStringAsFixed(2)}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _showWithdrawModal,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF00CED1),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text(
                          'Withdraw',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _showPaymentMethods,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: Colors.white),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text('Payment Methods'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Pending payout
          if (_earnings.pendingPayout > 0)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.orange.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.schedule,
                    color: Colors.orange,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Pending Payout',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          '\$${_earnings.pendingPayout.toStringAsFixed(2)}',
                          style: const TextStyle(
                            color: Colors.orange,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Text(
                    'Processing',
                    style: TextStyle(
                      color: Colors.orange,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          
          const SizedBox(height: 20),
          
          // Earnings breakdown
          const Text(
            'Earnings Breakdown',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          _buildEarningItem(
            icon: Icons.play_circle_outline,
            title: 'Video Fund',
            amount: _earnings.videoFundEarnings,
            percentage: (_earnings.videoFundEarnings / _earnings.totalEarned * 100),
            color: const Color(0xFF00CED1),
          ),
          _buildEarningItem(
            icon: Icons.card_giftcard,
            title: 'Gifts',
            amount: _earnings.giftEarnings,
            percentage: (_earnings.giftEarnings / _earnings.totalEarned * 100),
            color: Colors.pink,
          ),
          _buildEarningItem(
            icon: Icons.handshake,
            title: 'Brand Partnerships',
            amount: _earnings.brandPartnerships,
            percentage: (_earnings.brandPartnerships / _earnings.totalEarned * 100),
            color: Colors.purple,
          ),
          
          const SizedBox(height: 30),
          
          // Eligibility requirements
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(
                      Icons.info_outline,
                      color: Color(0xFF00CED1),
                      size: 20,
                    ),
                    SizedBox(width: 8),
                    Text(
                      'Creator Fund Requirements',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildRequirement('10,000+ followers', true),
                _buildRequirement('100,000+ video views in last 30 days', true),
                _buildRequirement('Posted 3+ videos in last 30 days', true),
                _buildRequirement('18+ years old', true),
                _buildRequirement('Community guidelines compliance', true),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildAnalyticsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Performance metrics
          Row(
            children: [
              Expanded(
                child: _buildMetricCard(
                  title: 'Monthly Views',
                  value: _formatNumber(_earnings.monthlyViews),
                  icon: Icons.visibility,
                  color: const Color(0xFF00CED1),
                  trend: '+23%',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildMetricCard(
                  title: 'Engagement Rate',
                  value: '${_earnings.engagementRate}%',
                  icon: Icons.favorite,
                  color: Colors.pink,
                  trend: '+5%',
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // Earnings chart
          Container(
            height: 200,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Earnings Trend',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: List.generate(7, (index) {
                      final height = (index + 1) * 20.0;
                      return Container(
                        width: 30,
                        height: height,
                        decoration: BoxDecoration(
                          color: const Color(0xFF00CED1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      );
                    }),
                  ),
                ),
                const SizedBox(height: 8),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Mon', style: TextStyle(color: Colors.white54, fontSize: 10)),
                    Text('Tue', style: TextStyle(color: Colors.white54, fontSize: 10)),
                    Text('Wed', style: TextStyle(color: Colors.white54, fontSize: 10)),
                    Text('Thu', style: TextStyle(color: Colors.white54, fontSize: 10)),
                    Text('Fri', style: TextStyle(color: Colors.white54, fontSize: 10)),
                    Text('Sat', style: TextStyle(color: Colors.white54, fontSize: 10)),
                    Text('Sun', style: TextStyle(color: Colors.white54, fontSize: 10)),
                  ],
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Top performing content
          const Text(
            'Top Performing Content',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          _buildTopContentItem(
            rank: 1,
            title: 'Dance Challenge Video',
            views: 850000,
            earnings: 234.56,
          ),
          _buildTopContentItem(
            rank: 2,
            title: 'Comedy Skit',
            views: 620000,
            earnings: 156.78,
          ),
          _buildTopContentItem(
            rank: 3,
            title: 'Tutorial Video',
            views: 480000,
            earnings: 98.45,
          ),
        ],
      ),
    );
  }
  
  Widget _buildHistoryTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _transactions.length,
      itemBuilder: (context, index) {
        final transaction = _transactions[index];
        return _buildTransactionItem(transaction);
      },
    );
  }
  
  Widget _buildEarningItem({
    required IconData icon,
    required String title,
    required double amount,
    required double percentage,
    required Color color,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                LinearProgressIndicator(
                  value: percentage / 100,
                  backgroundColor: Colors.white.withOpacity(0.1),
                  valueColor: AlwaysStoppedAnimation<Color>(color),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '\$${amount.toStringAsFixed(2)}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${percentage.toStringAsFixed(1)}%',
                style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildRequirement(String text, bool isMet) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(
            isMet ? Icons.check_circle : Icons.cancel,
            color: isMet ? Colors.green : Colors.red,
            size: 16,
          ),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(
              color: isMet ? Colors.white70 : Colors.white54,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildMetricCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required String trend,
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 24),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  trend,
                  style: const TextStyle(
                    color: Colors.green,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
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
  
  Widget _buildTopContentItem({
    required int rank,
    required String title,
    required int views,
    required double earnings,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: const Color(0xFF00CED1).withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '#$rank',
                style: const TextStyle(
                  color: Color(0xFF00CED1),
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  '${_formatNumber(views)} views',
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Text(
            '\$${earnings.toStringAsFixed(2)}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildTransactionItem(Transaction transaction) {
    IconData icon;
    Color color;
    
    switch (transaction.type) {
      case TransactionType.payout:
        icon = Icons.account_balance;
        color = Colors.green;
        break;
      case TransactionType.videoFund:
        icon = Icons.play_circle_outline;
        color = const Color(0xFF00CED1);
        break;
      case TransactionType.gift:
        icon = Icons.card_giftcard;
        color = Colors.pink;
        break;
      case TransactionType.brandDeal:
        icon = Icons.handshake;
        color = Colors.purple;
        break;
    }
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  transaction.description,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  _formatDate(transaction.date),
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${transaction.type == TransactionType.payout ? '-' : '+'}\$${transaction.amount.toStringAsFixed(2)}',
                style: TextStyle(
                  color: transaction.type == TransactionType.payout 
                      ? Colors.red 
                      : Colors.green,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: transaction.status == TransactionStatus.completed
                      ? Colors.green.withOpacity(0.2)
                      : Colors.orange.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  transaction.status == TransactionStatus.completed 
                      ? 'Completed' 
                      : 'Pending',
                  style: TextStyle(
                    color: transaction.status == TransactionStatus.completed
                        ? Colors.green
                        : Colors.orange,
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  void _showWithdrawModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
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
                'Withdraw Funds',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              
              // Amount input
              TextField(
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Amount',
                  labelStyle: const TextStyle(color: Colors.white54),
                  prefixText: '\$',
                  prefixStyle: const TextStyle(color: Colors.white),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.1),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  helperText: 'Min: \$50.00, Max: \$${_earnings.balance.toStringAsFixed(2)}',
                  helperStyle: const TextStyle(color: Colors.white54),
                ),
              ),
              
              const SizedBox(height: 20),
              
              // Payment method
              const Text(
                'Payment Method',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 12),
              
              ..._paymentMethods.map((method) => 
                RadioListTile<String>(
                  value: method.id,
                  groupValue: '1',
                  onChanged: (value) {},
                  title: Text(
                    method.name,
                    style: const TextStyle(color: Colors.white),
                  ),
                  subtitle: Text(
                    method.last4,
                    style: const TextStyle(color: Colors.white54),
                  ),
                  activeColor: const Color(0xFF00CED1),
                ),
              ),
              
              const SizedBox(height: 20),
              
              // Withdraw button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _showSuccessMessage();
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
                    'Withdraw',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _showPaymentMethods() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const PaymentMethodsScreen(),
      ),
    );
  }
  
  void _showSuccessMessage() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Withdrawal request submitted'),
        backgroundColor: Colors.green,
      ),
    );
  }
  
  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toString();
  }
  
  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays == 0) {
      return 'Today';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}

// Placeholder screen for payment methods
class PaymentMethodsScreen extends StatelessWidget {
  const PaymentMethodsScreen({super.key});
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Payment Methods'),
      ),
      body: const Center(
        child: Text(
          'Payment Methods Management',
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }
}

// Data models
class CreatorEarnings {
  final double balance;
  final double pendingPayout;
  final double totalEarned;
  final double videoFundEarnings;
  final double giftEarnings;
  final double brandPartnerships;
  final int monthlyViews;
  final double engagementRate;
  
  CreatorEarnings({
    required this.balance,
    required this.pendingPayout,
    required this.totalEarned,
    required this.videoFundEarnings,
    required this.giftEarnings,
    required this.brandPartnerships,
    required this.monthlyViews,
    required this.engagementRate,
  });
}

enum PaymentType { bankAccount, paypal, stripe }

class PaymentMethod {
  final String id;
  final PaymentType type;
  final String name;
  final String last4;
  final bool isDefault;
  
  PaymentMethod({
    required this.id,
    required this.type,
    required this.name,
    required this.last4,
    required this.isDefault,
  });
}

enum TransactionType { payout, videoFund, gift, brandDeal }
enum TransactionStatus { pending, completed, failed }

class Transaction {
  final String id;
  final TransactionType type;
  final double amount;
  final TransactionStatus status;
  final DateTime date;
  final String description;
  
  Transaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.status,
    required this.date,
    required this.description,
  });
}