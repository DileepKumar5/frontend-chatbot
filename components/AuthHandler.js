// app/components/AuthHandler.js
"use client";

import useAuth from '../app/hooks/useAuth'; // Import the custom hook

const AuthHandler = () => {
  useAuth(); // Call useAuth to sign out the user

  return null; // No UI rendered, only side effects
};

export default AuthHandler;
