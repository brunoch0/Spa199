"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(
    searchParams.get("role") === "therapist" ? "therapist" : "customer"
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password: String(form.get("password")),
      options: {
        data: {
          full_name: String(form.get("full_name")),
          phone: String(form.get("phone")),
          role,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Account created!");
    router.push(role === "therapist" ? "/therapist" : "/");
    router.refresh();
  }

  return (
    <Card className="mx-auto mt-10 w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Create account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <RadioGroup value={role} onValueChange={setRole} className="grid grid-cols-2 gap-3">
            <Label
              htmlFor="r-customer"
              className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${role === "customer" ? "border-emerald-500 bg-emerald-50" : ""}`}
            >
              <RadioGroupItem value="customer" id="r-customer" />
              I need a massage
            </Label>
            <Label
              htmlFor="r-therapist"
              className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${role === "therapist" ? "border-emerald-500 bg-emerald-50" : ""}`}
            >
              <RadioGroupItem value="therapist" id="r-therapist" />
              I&apos;m a therapist
            </Label>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" required placeholder="John Carter" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (with country code)</Label>
            <Input id="phone" name="phone" placeholder="+971 50 123 4567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password (min. 6 characters)</Label>
            <Input id="password" name="password" type="password" minLength={6} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {loading ? "Creating account…" : "Sign up"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-neutral-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-700 hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
