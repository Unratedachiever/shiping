import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/layout/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailAuthForm, ProviderButtons } from "@/components/auth-form";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <Page>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Customer portal</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-3 max-w-md text-mist">
            Sign in to manage shipments, saved addresses, billing, and delivery notifications.
          </p>
        </div>
        <Card className="mx-auto w-full max-w-md rounded-xl">
          <CardHeader>
            <div className="mb-2 lg:hidden">
              <Logo />
            </div>
            <CardTitle>Log in</CardTitle>
            <CardDescription>Use Google, X, or email and password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProviderButtons />
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-mist">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>
            <EmailAuthForm mode="login" />
            <p className="text-sm text-mist">
              New to SwiftShip?{" "}
              <Link to="/register" className="font-medium text-teal hover:underline">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
