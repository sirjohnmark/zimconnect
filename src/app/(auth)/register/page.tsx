import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <Card padding="lg" shadow="sm">
      <Card.Header>
        <Card.Title>Create an account</Card.Title>
        <Card.Description>Join ZimConnect today — it&apos;s free</Card.Description>
      </Card.Header>

      <form className="space-y-4">
        <Input
          type="text"
          label="Full Name"
          placeholder="John Doe"
          required
        />
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          required
        />
        <Input
          type="password"
          label="Password"
          placeholder="Min. 8 characters"
          hint="Use at least 8 characters with a mix of letters and numbers."
          required
        />
        <Button type="submit" fullWidth>
          Create Account
        </Button>
      </form>

      <Card.Footer>
        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-600 hover:underline">
            Sign in
          </Link>
        </p>
      </Card.Footer>
    </Card>
  );
}
