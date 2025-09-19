// Levenshtein distance algorithm for fuzzy string matching
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  // Create matrix
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Calculate similarity score between two strings
function calculateSimilarity(str1, str2) {
  // Ensure both inputs are strings
  const s1 = String(str1 || '');
  const s2 = String(str2 || '');
  
  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(s1.toLowerCase(), s2.toLowerCase());
  return 1 - distance / maxLength;
}

// Check if query matches the start of the string
function startsWithMatch(query, text) {
  const q = String(query || '').toLowerCase();
  const t = String(text || '').toLowerCase();
  return t.startsWith(q);
}

// Check if query is contained within the string
function containsMatch(query, text) {
  const q = String(query || '').toLowerCase();
  const t = String(text || '').toLowerCase();
  return t.includes(q);
}

// Check if query words match any words in the text
function wordMatch(query, text) {
  const q = String(query || '').toLowerCase();
  const t = String(text || '').toLowerCase();
  const queryWords = q.split(/\s+/);
  const textWords = t.split(/\s+/);
  
  return queryWords.some(queryWord => 
    textWords.some(textWord => 
      textWord.startsWith(queryWord) || textWord.includes(queryWord)
    )
  );
}

// Main fuzzy search function - Google-like behavior
export function fuzzySearch(query, items, options = {}) {
  const {
    key = null,
    threshold = 0.0, // Always show results, no minimum threshold
    limit = 10
  } = options;
  
  if (!query || query.trim() === '') {
    return items.slice(0, limit).map(item => ({
      item,
      score: 1,
      similarity: 1,
      matchType: 'all',
      text: key ? String((item && item[key]) || '') : String(item || '')
    }));
  }
  
  const queryLower = query.toLowerCase().trim();
  
  const results = items.map(item => {
    const text = key ? (item && item[key]) : item;
    const textStr = String(text || '');
    const textLower = textStr.toLowerCase();
    
    // Calculate base similarity
    const similarity = calculateSimilarity(queryLower, textLower);
    
    let matchType = 'similar';
    let score = similarity;
    
    // Google-like scoring with heavy preference for intuitive matches
    if (textLower === queryLower) {
      // Exact match - highest priority
      matchType = 'exact';
      score = 10;
    } else if (textLower.startsWith(queryLower)) {
      // Starts with - very high priority
      matchType = 'starts_with';
      score = 5 + similarity;
    } else if (textLower.includes(queryLower)) {
      // Contains exact substring - high priority
      matchType = 'contains';
      score = 3 + similarity;
    } else if (wordMatch(queryLower, textLower)) {
      // Word boundary matches - medium-high priority
      matchType = 'word_match';
      score = 2 + similarity;
    } else {
      // Fuzzy similarity only - lower priority but still shown
      matchType = 'similar';
      score = similarity;
    }
    
    // Additional boost for shorter strings (more precise matches)
    const lengthBoost = Math.max(0, (50 - textStr.length) / 100);
    score += lengthBoost;
    
    return {
      item,
      score,
      similarity,
      matchType,
      text: textStr
    };
  });
  
  // Always return results, sorted by score (Google-like behavior)
  return results
    .sort((a, b) => {
      // Primary sort by score (descending)
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Secondary sort by text length (shorter first for ties)
      return a.text.length - b.text.length;
    })
    .slice(0, limit);
}

// Get match type display info
export function getMatchTypeInfo(matchType) {
  switch (matchType) {
    case 'exact':
      return { label: 'Exact match', color: 'text-green-700' };
    case 'starts_with':
      return { label: 'Starts with', color: 'text-green-600' };
    case 'contains':
      return { label: 'Contains', color: 'text-blue-600' };
    case 'word_match':
      return { label: 'Word match', color: 'text-purple-600' };
    case 'similar':
      return { label: 'Similar', color: 'text-yellow-600' };
    case 'all':
      return { label: 'All products', color: 'text-gray-500' };
    default:
      return { label: 'Match', color: 'text-gray-600' };
  }
}

// Get score color based on similarity
export function getScoreColor(score) {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-blue-600';
  if (score >= 0.4) return 'text-yellow-600';
  return 'text-gray-600';
}
