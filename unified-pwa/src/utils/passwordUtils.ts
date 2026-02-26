
// Password utility functions
export const hashPassword = async (password: string): Promise<string> => {
  // This is a simple implementation - in production, you should use a proper
  // password hashing library like bcrypt on the server side
  // For now, we'll just return the password as is since the backend will handle hashing
  return password;
};
