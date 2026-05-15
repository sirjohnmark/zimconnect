import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Profile" };

const PROFILE_FIELDS = [
  { label: "Display Name", value: "Your Name" },
  { label: "Email", value: "you@example.com" },
  { label: "Phone", value: "+263 77 000 0000" },
  { label: "Location", value: "Harare, Zimbabwe" },
];

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Profile</h1>

      <Card padding="lg">
        <Card.Header>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-apple-blue/10 flex items-center justify-center text-2xl font-bold text-apple-blue">
              Y
            </div>
            <div className="flex-1">
              <Card.Title>Your Name</Card.Title>
              <Card.Description>you@example.com · Member since 2024</Card.Description>
            </div>
            <Button variant="outline" size="sm">Edit Profile</Button>
          </div>
        </Card.Header>

        <div className="grid gap-5 sm:grid-cols-2">
          {PROFILE_FIELDS.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {label}
              </p>
              <p className="mt-1 text-sm text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        <Card.Footer>
          <div className="flex gap-3">
            <Button variant="primary" size="sm">Save Changes</Button>
            <Button variant="secondary" size="sm">Cancel</Button>
          </div>
        </Card.Footer>
      </Card>
    </div>
  );
}
