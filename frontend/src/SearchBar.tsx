import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 4 }}>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索函数、类、文件..."
        style={{
          padding: '6px 12px', borderRadius: 4, border: '1px solid #444',
          background: '#16213e', color: '#fff', fontSize: 13, width: 240,
          outline: 'none',
        }}
      />
      <button type="submit" style={{
        padding: '6px 12px', background: '#4361ee', color: '#fff',
        border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13,
      }}>
        搜索
      </button>
    </form>
  );
};

export default SearchBar;
