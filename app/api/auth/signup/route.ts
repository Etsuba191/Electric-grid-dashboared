import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields: name, email, and password are required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters long" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (existingUser) {
      return NextResponse.json({ message: "User already exists with this email" }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user in database (always as USER role for security)
    const user = await prisma.user.create({
      data: { 
        name: name.trim(), 
        email: email.toLowerCase(), 
        passwordHash, 
        role: 'USER' 
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ 
      message: "Account created successfully", 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
