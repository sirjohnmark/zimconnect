import { NextResponse } from "next/server";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, recaptchaToken } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
    }

    if (!passwordPattern.test(password)) {
      return NextResponse.json({ success: false, message: "Weak password." }, { status: 400 });
    }

    // Placeholder: verify recaptchaToken server-side here in production.
    if (recaptchaToken && typeof recaptchaToken !== "string") {
      return NextResponse.json({ success: false, message: "Invalid captcha token." }, { status: 400 });
    }

    // TODO: Add real user creation logic (database, hashing, email unique check, etc.)

    return NextResponse.json({ success: true, message: "Signup successful" });
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request data." }, { status: 400 });
  }
}
