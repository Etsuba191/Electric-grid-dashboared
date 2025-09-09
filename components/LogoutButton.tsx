"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      // Clear any local storage or session storage if needed
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out with NextAuth
      await signOut({ 
        callbackUrl: "/login",
        redirect: true 
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect to login if signOut fails
      window.location.href = "/login";
    }
  };

  return (
    <button
      className="flex items-center gap-2 mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
}
