export interface FoodItem {
  name: string;
  calories: number; // per 100g or per serving
  protein: number;  // g
  carbs: number;    // g
  fat: number;      // g
  fiber: number;    // g
  sugar: number;    // g
  servingSize: string;
}

export const COMMON_FOOD_DATABASE: FoodItem[] = [
  { name: "Oatmeal (Cooked)", calories: 120, protein: 4, carbs: 21, fat: 2, fiber: 4, sugar: 1, servingSize: "1 bowl (230g)" },
  { name: "Whole Egg (Boiled)", calories: 78, protein: 6, carbs: 0.6, fat: 5, fiber: 0, sugar: 0.6, servingSize: "1 large (50g)" },
  { name: "Chicken Breast (Grilled)", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, servingSize: "1 fillet (100g)" },
  { name: "Brown Rice (Cooked)", calories: 111, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8, sugar: 0.4, servingSize: "1 cup (195g)" },
  { name: "White Rice (Cooked)", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0.1, servingSize: "1 cup (158g)" },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, servingSize: "1 medium (118g)" },
  { name: "Apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, servingSize: "1 medium (182g)" },
  { name: "Whey Protein Powder", calories: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0, sugar: 1, servingSize: "1 scoop (30g)" },
  { name: "Greek Yogurt (Plain 0%)", calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.2, servingSize: "1 container (150g)" },
  { name: "Almonds", calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12, sugar: 4.3, servingSize: "1 handful (30g)" },
  { name: "Avocado", calories: 160, protein: 2, carbs: 8.5, fat: 15, fiber: 6.7, sugar: 0.7, servingSize: "1 half (100g)" },
  { name: "Whole Wheat Bread", calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7, sugar: 5.7, servingSize: "1 slice (28g)" },
  { name: "Salmon (Grilled)", calories: 206, protein: 22, carbs: 0, fat: 12, fiber: 0, sugar: 0, servingSize: "1 fillet (100g)" },
  { name: "Mixed Green Salad", calories: 15, protein: 1.2, carbs: 2.8, fat: 0.2, fiber: 1.3, sugar: 0.8, servingSize: "1 cup (100g)" },
  { name: "Broccoli (Steamed)", calories: 35, protein: 2.4, carbs: 7, fat: 0.4, fiber: 3.3, sugar: 1.4, servingSize: "1 cup (150g)" },
  { name: "Sweet Potato (Baked)", calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, sugar: 4.2, servingSize: "1 medium (150g)" },
  { name: "Peanut Butter", calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, sugar: 9, servingSize: "1 tbsp (16g)" },
  { name: "Skimmed Milk", calories: 34, protein: 3.4, carbs: 5, fat: 0.1, fiber: 0, sugar: 5, servingSize: "1 glass (200ml)" },
  { name: "Whole Milk", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sugar: 4.8, servingSize: "1 glass (200ml)" },
  { name: "Cottage Cheese (Paneer)", calories: 265, protein: 18, carbs: 1.2, fat: 20, fiber: 0, sugar: 1.2, servingSize: "100g" }
];

export function searchFoods(query: string): FoodItem[] {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) return [];
  return COMMON_FOOD_DATABASE.filter(item => 
    item.name.toLowerCase().includes(cleanQuery)
  );
}
