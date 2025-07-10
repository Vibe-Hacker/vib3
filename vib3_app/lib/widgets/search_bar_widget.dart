import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class SearchBarWidget extends StatefulWidget {
  final String hintText;
  final Function(String) onSearch;
  final Function(String) onChanged;
  final VoidCallback? onFilterTap;
  final bool showFilters;
  final bool autoFocus;
  final List<String>? recentSearches;
  final Function(String)? onRecentSearchTap;
  final VoidCallback? onClearHistory;
  
  const SearchBarWidget({
    super.key,
    required this.hintText,
    required this.onSearch,
    required this.onChanged,
    this.onFilterTap,
    this.showFilters = true,
    this.autoFocus = false,
    this.recentSearches,
    this.onRecentSearchTap,
    this.onClearHistory,
  });
  
  @override
  State<SearchBarWidget> createState() => _SearchBarWidgetState();
}

class _SearchBarWidgetState extends State<SearchBarWidget> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  bool _showClear = false;
  bool _showHistory = false;
  
  @override
  void initState() {
    super.initState();
    _controller.addListener(_onTextChanged);
    _focusNode.addListener(_onFocusChanged);
    
    if (widget.autoFocus) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _focusNode.requestFocus();
      });
    }
  }
  
  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }
  
  void _onTextChanged() {
    setState(() {
      _showClear = _controller.text.isNotEmpty;
    });
    widget.onChanged(_controller.text);
  }
  
  void _onFocusChanged() {
    setState(() {
      _showHistory = _focusNode.hasFocus && 
                     _controller.text.isEmpty && 
                     (widget.recentSearches?.isNotEmpty ?? false);
    });
  }
  
  void _clearSearch() {
    HapticFeedback.lightImpact();
    _controller.clear();
    widget.onChanged('');
    _focusNode.requestFocus();
  }
  
  void _submitSearch() {
    final query = _controller.text.trim();
    if (query.isNotEmpty) {
      widget.onSearch(query);
      _focusNode.unfocus();
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          height: 48,
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: _focusNode.hasFocus 
                  ? const Color(0xFF00CED1)
                  : Colors.white.withOpacity(0.1),
              width: _focusNode.hasFocus ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              // Search icon
              Padding(
                padding: const EdgeInsets.only(left: 16, right: 8),
                child: Icon(
                  Icons.search,
                  color: _focusNode.hasFocus
                      ? const Color(0xFF00CED1)
                      : Colors.white54,
                  size: 22,
                ),
              ),
              
              // Text field
              Expanded(
                child: TextField(
                  controller: _controller,
                  focusNode: _focusNode,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                  ),
                  decoration: InputDecoration(
                    hintText: widget.hintText,
                    hintStyle: const TextStyle(
                      color: Colors.white54,
                      fontSize: 16,
                    ),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.zero,
                  ),
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _submitSearch(),
                ),
              ),
              
              // Clear button
              if (_showClear)
                IconButton(
                  onPressed: _clearSearch,
                  icon: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.close,
                      color: Colors.white70,
                      size: 16,
                    ),
                  ),
                ),
              
              // Filter button
              if (widget.showFilters && widget.onFilterTap != null)
                Container(
                  margin: const EdgeInsets.only(right: 8),
                  child: IconButton(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      widget.onFilterTap!();
                    },
                    icon: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF00CED1), Color(0xFF40E0D0)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.tune,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
        
        // Search history
        if (_showHistory && widget.recentSearches != null)
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.white.withOpacity(0.1),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 8, 0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Recent searches',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (widget.onClearHistory != null)
                        TextButton(
                          onPressed: () {
                            HapticFeedback.lightImpact();
                            widget.onClearHistory!();
                            setState(() {
                              _showHistory = false;
                            });
                          },
                          child: const Text(
                            'Clear',
                            style: TextStyle(
                              color: Color(0xFF00CED1),
                              fontSize: 12,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                ...widget.recentSearches!.take(5).map((search) => 
                  ListTile(
                    dense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                    leading: const Icon(
                      Icons.history,
                      color: Colors.white54,
                      size: 20,
                    ),
                    title: Text(
                      search,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                      ),
                    ),
                    trailing: const Icon(
                      Icons.north_west,
                      color: Colors.white54,
                      size: 18,
                    ),
                    onTap: () {
                      HapticFeedback.lightImpact();
                      _controller.text = search;
                      if (widget.onRecentSearchTap != null) {
                        widget.onRecentSearchTap!(search);
                      }
                      _submitSearch();
                    },
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}