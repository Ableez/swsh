"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SubmitButton from "@/components/auth/submit-button";
import { registerAction } from "@/lib/actions/register-action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password");

    try {
      const resp = await registerAction(formData);

      if (!resp?.success) {
        toast.error(resp.error);
      } else {
        toast.success("Registered successfully, Signing you in...");
      }

      console.log("RESP", resp);
      await signIn("credentials", {
        email: resp.user?.email,
        password: password,
        redirect: true,
        callbackUrl: "/",
      }).catch((e) => console.log(e));

      console.log(resp);
    } catch (error) {
      console.error(error);
    } finally {
      toast.dismiss("loading-spinner");
    }
  };

  return (
    <Card className="mx-auto h-fit max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Register</CardTitle>
        <CardDescription>Create an account to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-8">
          <Input name="username" placeholder="Username" />
          <Input name="email" placeholder="Email" />
          <Input name="phoneNumber" placeholder="Phone Number" />
          <Input name="password" placeholder="Password" />
          <SubmitButton />
        </form>
        <Button variant="outline" className="mt-4 w-full">
          Register with Google
        </Button>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="#" className="underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
