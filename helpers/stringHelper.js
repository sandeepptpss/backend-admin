export function generateRandomString(length = 4) {
  const chars = '1234567890';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
