import 'package:flutter/material.dart';

class SearchBarWidget extends StatefulWidget {
  final TextEditingController controller;
  final Function(String) onSearch;
  final String hintText;

  const SearchBarWidget({
    super.key,
    required this.controller,
    required this.onSearch,
    this.hintText = '搜索应用名称或包名...',
  });

  @override
  State<SearchBarWidget> createState() => _SearchBarWidgetState();
}

class _SearchBarWidgetState extends State<SearchBarWidget> {
  final _focusNode = FocusNode();

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  void _handleSearch() {
    final keyword = widget.controller.text.trim();
    if (keyword.isNotEmpty) {
      widget.onSearch(keyword);
      _focusNode.unfocus();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: theme.inputDecorationTheme.fillColor,
        border: Border.all(
          color: theme.inputDecorationTheme.border?.borderSide.color ??
              Colors.grey.shade300,
        ),
      ),
      child: Row(
        children: [
          const SizedBox(width: 12),
          Icon(
            Icons.search,
            color: theme.colorScheme.onSurface.withOpacity(0.5),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: widget.controller,
              focusNode: _focusNode,
              decoration: InputDecoration(
                hintText: widget.hintText,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onSubmitted: (_) => _handleSearch(),
              textInputAction: TextInputAction.search,
            ),
          ),
          if (widget.controller.text.isNotEmpty)
            IconButton(
              icon: Icon(
                Icons.clear,
                color: theme.colorScheme.onSurface.withOpacity(0.5),
              ),
              onPressed: () {
                widget.controller.clear();
                setState(() {});
              },
            ),
          const SizedBox(width: 4),
          Container(
            margin: const EdgeInsets.all(4),
            child: ElevatedButton(
              onPressed: _handleSearch,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                minimumSize: Size.zero,
              ),
              child: const Text('搜索'),
            ),
          ),
        ],
      ),
    );
  }
}
