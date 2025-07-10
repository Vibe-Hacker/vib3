import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/creation_state_provider.dart';

class ShoppingModule extends StatefulWidget {
  const ShoppingModule({super.key});
  
  @override
  State<ShoppingModule> createState() => _ShoppingModuleState();
}

class _ShoppingModuleState extends State<ShoppingModule> {
  final TextEditingController _searchController = TextEditingController();
  final List<Product> _selectedProducts = [];
  
  // Sample product catalog
  final List<Product> _productCatalog = [
    Product(
      id: '1',
      name: 'Wireless Headphones',
      brand: 'TechBrand',
      price: 79.99,
      imageUrl: 'headphones.jpg',
      category: 'Electronics',
      commission: 5.0,
    ),
    Product(
      id: '2',
      name: 'Yoga Mat Premium',
      brand: 'FitLife',
      price: 34.99,
      imageUrl: 'yoga_mat.jpg',
      category: 'Fitness',
      commission: 8.0,
    ),
    Product(
      id: '3',
      name: 'Skincare Set',
      brand: 'GlowBeauty',
      price: 124.99,
      imageUrl: 'skincare.jpg',
      category: 'Beauty',
      commission: 12.0,
    ),
    Product(
      id: '4',
      name: 'LED Ring Light',
      brand: 'CreatorGear',
      price: 49.99,
      imageUrl: 'ring_light.jpg',
      category: 'Photography',
      commission: 10.0,
    ),
    Product(
      id: '5',
      name: 'Protein Powder',
      brand: 'FitFuel',
      price: 39.99,
      imageUrl: 'protein.jpg',
      category: 'Nutrition',
      commission: 15.0,
    ),
  ];
  
  // Affiliate programs
  final List<AffiliateProgram> _affiliatePrograms = [
    AffiliateProgram(
      id: '1',
      name: 'VIB3 Shop',
      description: 'Official VIB3 marketplace',
      commissionRate: '5-15%',
      isJoined: true,
    ),
    AffiliateProgram(
      id: '2',
      name: 'Fashion Forward',
      description: 'Trendy clothing and accessories',
      commissionRate: '10-20%',
      isJoined: true,
    ),
    AffiliateProgram(
      id: '3',
      name: 'Tech Deals',
      description: 'Electronics and gadgets',
      commissionRate: '3-8%',
      isJoined: false,
    ),
  ];
  
  String _selectedCategory = 'All';
  final List<String> _categories = [
    'All',
    'Electronics',
    'Fashion',
    'Beauty',
    'Fitness',
    'Home',
    'Food',
  ];
  
  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A1A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[600],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Add Products',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Row(
                  children: [
                    if (_selectedProducts.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF00CED1).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '${_selectedProducts.length} selected',
                          style: const TextStyle(
                            color: Color(0xFF00CED1),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    const SizedBox(width: 8),
                    TextButton(
                      onPressed: _selectedProducts.isEmpty ? null : () {
                        _addProductsToVideo();
                        Navigator.pop(context);
                      },
                      child: Text(
                        'Done',
                        style: TextStyle(
                          color: _selectedProducts.isEmpty 
                              ? Colors.white30 
                              : const Color(0xFF00CED1),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Search bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _searchController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Search products or paste link',
                hintStyle: const TextStyle(color: Colors.white54),
                prefixIcon: const Icon(Icons.search, color: Colors.white54),
                filled: true,
                fillColor: Colors.white.withOpacity(0.1),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide.none,
                ),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Colors.white54),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {});
                        },
                      )
                    : IconButton(
                        icon: const Icon(Icons.qr_code_scanner, color: Colors.white54),
                        onPressed: _scanProductCode,
                      ),
              ),
              onChanged: (value) => setState(() {}),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Category filter
          SizedBox(
            height: 40,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
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
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                );
              },
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Products list
          Expanded(
            child: DefaultTabController(
              length: 3,
              child: Column(
                children: [
                  TabBar(
                    indicatorColor: const Color(0xFF00CED1),
                    labelColor: const Color(0xFF00CED1),
                    unselectedLabelColor: Colors.white54,
                    tabs: const [
                      Tab(text: 'Catalog'),
                      Tab(text: 'My Links'),
                      Tab(text: 'Programs'),
                    ],
                  ),
                  Expanded(
                    child: TabBarView(
                      children: [
                        _buildCatalogTab(),
                        _buildMyLinksTab(),
                        _buildProgramsTab(),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Selected products preview
          if (_selectedProducts.isNotEmpty)
            Container(
              height: 100,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black,
                border: Border(
                  top: BorderSide(color: Colors.white.withOpacity(0.1)),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Selected Products',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _selectedProducts.length,
                      itemBuilder: (context, index) {
                        final product = _selectedProducts[index];
                        return Container(
                          width: 60,
                          margin: const EdgeInsets.only(right: 8),
                          child: Stack(
                            children: [
                              Container(
                                decoration: BoxDecoration(
                                  color: Colors.grey[800],
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Center(
                                  child: Icon(
                                    Icons.shopping_bag,
                                    color: Colors.white.withOpacity(0.5),
                                  ),
                                ),
                              ),
                              Positioned(
                                top: 0,
                                right: 0,
                                child: GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      _selectedProducts.remove(product);
                                    });
                                  },
                                  child: Container(
                                    width: 20,
                                    height: 20,
                                    decoration: const BoxDecoration(
                                      color: Colors.red,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.close,
                                      color: Colors.white,
                                      size: 14,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildCatalogTab() {
    final filteredProducts = _productCatalog.where((product) {
      final matchesSearch = _searchController.text.isEmpty ||
          product.name.toLowerCase().contains(_searchController.text.toLowerCase()) ||
          product.brand.toLowerCase().contains(_searchController.text.toLowerCase());
      
      final matchesCategory = _selectedCategory == 'All' ||
          product.category == _selectedCategory;
      
      return matchesSearch && matchesCategory;
    }).toList();
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filteredProducts.length,
      itemBuilder: (context, index) {
        final product = filteredProducts[index];
        final isSelected = _selectedProducts.contains(product);
        
        return GestureDetector(
          onTap: () {
            setState(() {
              if (isSelected) {
                _selectedProducts.remove(product);
              } else {
                _selectedProducts.add(product);
              }
            });
            HapticFeedback.lightImpact();
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected 
                  ? const Color(0xFF00CED1).withOpacity(0.2)
                  : Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected 
                    ? const Color(0xFF00CED1)
                    : Colors.transparent,
              ),
            ),
            child: Row(
              children: [
                // Product image
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: Colors.grey[800],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.shopping_bag,
                    color: Colors.white54,
                  ),
                ),
                const SizedBox(width: 12),
                
                // Product info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        product.brand,
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            '\$${product.price.toStringAsFixed(2)}',
                            style: const TextStyle(
                              color: Color(0xFF00CED1),
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.green.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${product.commission}% commission',
                              style: const TextStyle(
                                color: Colors.green,
                                fontSize: 10,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // Selection indicator
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected 
                          ? const Color(0xFF00CED1)
                          : Colors.white30,
                      width: 2,
                    ),
                    color: isSelected 
                        ? const Color(0xFF00CED1)
                        : Colors.transparent,
                  ),
                  child: isSelected 
                      ? const Icon(
                          Icons.check,
                          color: Colors.black,
                          size: 16,
                        )
                      : null,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
  
  Widget _buildMyLinksTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Custom link input
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Add Custom Link',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Paste product URL',
                  hintStyle: const TextStyle(color: Colors.white54),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.1),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Product name',
                        hintStyle: const TextStyle(color: Colors.white54),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.1),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00CED1),
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text('Add'),
                  ),
                ],
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 20),
        
        // Saved links
        const Text(
          'Saved Links',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        
        // Empty state
        Center(
          child: Column(
            children: [
              Icon(
                Icons.link_off,
                size: 48,
                color: Colors.white.withOpacity(0.3),
              ),
              const SizedBox(height: 8),
              Text(
                'No saved links yet',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.5),
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
  
  Widget _buildProgramsTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _affiliatePrograms.length,
      itemBuilder: (context, index) {
        final program = _affiliatePrograms[index];
        
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: program.isJoined 
                  ? const Color(0xFF00CED1).withOpacity(0.3)
                  : Colors.transparent,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    program.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (program.isJoined)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00CED1).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        'Joined',
                        style: TextStyle(
                          color: Color(0xFF00CED1),
                          fontSize: 12,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                program.description,
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Commission: ${program.commissionRate}',
                    style: const TextStyle(
                      color: Color(0xFF00CED1),
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (!program.isJoined)
                    TextButton(
                      onPressed: () {
                        // Join program
                      },
                      child: const Text(
                        'Join Program',
                        style: TextStyle(
                          color: Color(0xFF00CED1),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
  
  void _scanProductCode() {
    // Implement barcode/QR code scanning
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Opening camera to scan product code'),
        backgroundColor: Color(0xFF00CED1),
      ),
    );
  }
  
  void _addProductsToVideo() {
    final creationState = context.read<CreationStateProvider>();
    
    // Add shopping tags to video
    for (final product in _selectedProducts) {
      creationState.addEffect(
        VideoEffect(
          type: 'shopping_tag',
          parameters: {
            'productId': product.id,
            'productName': product.name,
            'price': product.price,
            'commission': product.commission,
            'timestamp': 0, // Can be adjusted to specific video timestamp
          },
        ),
      );
    }
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Added ${_selectedProducts.length} products to video'),
        backgroundColor: const Color(0xFF00CED1),
      ),
    );
  }
}

// Data models
class Product {
  final String id;
  final String name;
  final String brand;
  final double price;
  final String imageUrl;
  final String category;
  final double commission;
  
  Product({
    required this.id,
    required this.name,
    required this.brand,
    required this.price,
    required this.imageUrl,
    required this.category,
    required this.commission,
  });
}

class AffiliateProgram {
  final String id;
  final String name;
  final String description;
  final String commissionRate;
  final bool isJoined;
  
  AffiliateProgram({
    required this.id,
    required this.name,
    required this.description,
    required this.commissionRate,
    required this.isJoined,
  });
}