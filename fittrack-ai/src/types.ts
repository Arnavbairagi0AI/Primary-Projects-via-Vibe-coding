export interface UserProfile {
  uid: string;
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  height: number; // in cm
  weight: number; // in kg
  phoneNumber: string; // visitor's phone
  email?: string; // optional
  fitnessGoal: string; // Weight Loss, Muscle Gain, Maintenance, Tone Up, etc.
  activityLevel: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active';
  foodPreference: 'Any' | 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Diabetic' | 'High Protein' | 'Low Carb';
  medicalConditions: string;
  dailySleep: number; // in hours
  dailyWaterGoal: number; // in ml
  targetWeight: number; // in kg
  createdAt: string;
  isPro?: boolean; // subscription status
}

export interface BmiEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  bmi: number;
  height: number;
  weight: number;
  category: 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
  recommendation: string;
  timestamp: number;
}

export interface CalorieCalculation {
  id: string;
  date: string;
  time: string;
  maintenance: number;
  weightLoss: number;
  weightGain: number;
  age: number;
  gender: string;
  weight: number;
  height: number;
  activityLevel: string;
  goal: string;
  timestamp: number;
}

export interface MealEntry {
  id: string;
  date: string;
  time: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  timestamp: number;
}

export interface WaterEntry {
  id: string;
  date: string;
  time: string;
  amount: number; // in ml
  timestamp: number;
}

export interface WeightEntry {
  id: string;
  date: string;
  time: string;
  weight: number;
  goalWeight: number;
  bmi: number;
  timestamp: number;
}

export interface DietPlan {
  id: string;
  date: string;
  time: string;
  goal: string;
  preference: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
  };
  shoppingList: string;
  budgetFriendly: boolean;
  optionsText?: string;
  timestamp: number;
}

export interface WorkoutPlan {
  id: string;
  date: string;
  time: string;
  goal: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  workoutType: string; // Home, Gym, Yoga, Cardio, etc.
  exercises: string; // text detail
  warmup: string;
  cooldown: string;
  stretching: string;
  duration: string;
  timestamp: number;
}

export interface ChatHistoryEntry {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface VisitorLead {
  id?: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  fitnessGoal: string;
  date: string;
  time: string;
  deviceType: string;
  timestamp: number;
}

export interface RunActivity {
  id: string;
  date: string;
  time: string;
  distance: number; // raw value in chosen unit
  unit: 'km' | 'mile';
  duration: number; // in seconds
  pace: string; // "5:24 min/km"
  caption: string; // post-run message
  timestamp: number;
  routeCoords: { x: number; y: number }[]; // coordinates for route plot
}
