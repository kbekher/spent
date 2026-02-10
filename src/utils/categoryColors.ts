// Category color palette
export const CATEGORY_COLORS = [
  'rgba(189, 253, 0, 1)',   // Lime green
  'rgba(51, 119, 255, 1)',  // Blue
  'rgba(247, 75, 0, 1)',    // Orange
  'rgba(68, 165, 226, 1)',  // Light blue
  'rgba(255, 152, 0, 1)',   // Amber
  'rgba(156, 39, 176, 1)',  // Purple
  'rgba(0, 188, 212, 1)',   // Cyan
  'rgba(239, 243, 169, 1)', // Yellow
  'rgba(76, 175, 80, 1)',   // Green
  'rgba(233, 30, 99, 1)',   // Pink
];

// Get a random color from the palette
export const getRandomCategoryColor = (): string => {
  return CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];
};

// Get a color by index (for consistent assignment)
export const getCategoryColorByIndex = (index: number): string => {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
};
