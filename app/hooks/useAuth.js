"use client"; // Ensures this runs only on the client-side

import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const useAuth = () => {
  const [isClient, setIsClient] = useState(false); // Track whether it's running client-side
  const { signOut, isLoaded, user, clearSession } = useClerk();
  const router = useRouter();

  // Ensure this runs only after hydration on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && isLoaded && user) {
      // Clear Clerk session cookies manually
      document.cookie = 'clerk_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; // Clear Clerk session cookie

      // Clear session and log out
      clearSession();
      signOut();
      router.push(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL); // Redirect to the sign-in page
    }
  }, [isClient, isLoaded, user, clearSession, signOut, router]);
};

export default useAuth;
