export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};