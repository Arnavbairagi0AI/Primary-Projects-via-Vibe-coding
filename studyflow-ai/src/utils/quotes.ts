/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Quote {
  text: string;
  author: string;
}

export const MOTIVATIONAL_QUOTES: Quote[] = [
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain"
  },
  {
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela"
  },
  {
    text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi"
  },
  {
    text: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin"
  },
  {
    text: "Quality is not an act, it is a habit.",
    author: "Aristotle"
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt"
  },
  {
    text: "The beautiful thing about learning is that nobody can take it away from you.",
    author: "B.B. King"
  }
];

export function getRandomQuote(): Quote {
  const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[index];
}
