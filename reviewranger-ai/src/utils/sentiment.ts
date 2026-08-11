/**
 * Helper to analyze the sentiment of a review text.
 * Supports English, Hindi, and Hinglish keywords commonly found in Indian local business reviews.
 */
export function analyzeSentiment(text: string): 'Positive' | 'Neutral' | 'Negative' {
  if (!text) return 'Neutral';
  
  const lowerText = text.toLowerCase();

  // Weighted keywords for positive sentiment
  const positiveWords = [
    'good', 'great', 'excellent', 'awesome', 'superb', 'delicious', 'nice', 
    'friendly', 'polite', 'love', 'loved', 'best', 'amazing', 'wonderful', 
    'satisfied', 'happy', 'fast', 'clean', 'perfect', 'helpful', 'highly recommend', 
    'tasty', 'yummy', 'fantastic', 'outstanding', 'satisfying', 'prompt', 'quick',
    'value for money', 'affordable', 'hygienic', 'cozy', 'delightful', 'fresh',
    'badhiya', 'accha', 'achha', 'swadist', 'badiya', 'mast', 'sundar', 'dhanyawad', 
    'sukriya', 'shukriya', 'maza', 'maaza', 'mazza', 'maja', 'behtarin', 'behtar', 
    'khas', 'pasand', 'uttam', 'saaf', 'swachh', 'ekdum', 'shandar', 'gazab'
  ];

  // Weighted keywords for negative sentiment
  const negativeWords = [
    'bad', 'worst', 'terrible', 'poor', 'hate', 'unprofessional', 'rude', 'slow', 
    'dirty', 'expensive', 'waste', 'disappointed', 'disappointing', 'avoid', 'never', 
    'careless', 'cheap', 'cold', 'delay', 'scam', 'horrible', 'disgusting', 'useless', 
    'pathetic', 'substandard', 'broken', 'rude staff', 'worst service', 'waste of money', 
    'stale', 'overpriced', 'worst', 'undercooked', 'burned', 'unhygienic', 'disaster',
    'kharab', 'ganda', 'bura', 'bakwas', 'bekar', 'ghatiya', 'gussa', 'loot', 
    'mahanga', 'mehanga', 'deri', 'badbu', 'kachha', 'kachra', 'thanda', 'bakwaas',
    'bekaar', 'faisu', 'faltu', 'flavourless', 'tasteless'
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  // Simple token matching
  positiveWords.forEach(word => {
    // Count occurrences of word in text
    const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'g');
    const matches = lowerText.match(regex);
    if (matches) {
      positiveScore += matches.length;
    } else if (lowerText.includes(word)) {
      // Fallback for non-boundary matches (especially for Hindi/Hinglish sub-words)
      positiveScore += 0.5;
    }
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'g');
    const matches = lowerText.match(regex);
    if (matches) {
      negativeScore += matches.length;
    } else if (lowerText.includes(word)) {
      negativeScore += 0.5;
    }
  });

  // Adjust scores depending on negation words near positive words
  const negations = ['not', 'no', 'never', 'dont', "don't", 'neither', 'nor', 'nahi', 'nahin', 'mat'];
  negations.forEach(neg => {
    if (lowerText.includes(neg)) {
      // If there are negation words, slightly boost negative score if there are positive words
      if (positiveScore > 0) {
        positiveScore -= 1;
        negativeScore += 0.5;
      }
    }
  });

  if (positiveScore > negativeScore) {
    return 'Positive';
  } else if (negativeScore > positiveScore) {
    return 'Negative';
  } else {
    // Fallback if score is identical but non-zero, let's look at star hints or default to Neutral
    return 'Neutral';
  }
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
