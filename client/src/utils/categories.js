// Default and common category icon keys (using lucide-react names)
export const CATEGORY_ICONS = {
  Food: 'UtensilsCrossed',
  Travel: 'Plane',
  Shopping: 'ShoppingBag',
  Bills: 'FileText',
  Rent: 'Home',
  Entertainment: 'Tv',
  Health: 'Heart',
  Education: 'BookOpen',
  Subscription: 'RefreshCw',
  Other: 'Tag',
  Salary: 'Briefcase',
  Freelance: 'Laptop',
  Business: 'Building2',
  Investment: 'TrendingUp',
  Gift: 'Gift',
};

export function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || 'Tag';
}

export const EXPENSE_CATEGORIES = [
  'Food', 'Travel', 'Shopping', 'Bills', 'Rent',
  'Entertainment', 'Health', 'Education', 'Subscription', 'Other',
];

export const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other',
];
