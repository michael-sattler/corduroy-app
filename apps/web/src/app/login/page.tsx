import { LoginForm } from "@/components/login-form";
import { Shell } from "@/components/shell";
import { requireSurface } from "@/lib/require-surface";

const ERROR_MESSAGES: Record<string, string> = {
  wrong_surface:
    "That account belongs to the other portal. Please sign in on the correct site.",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const surface = await requireSurface();
  const params = await searchParams;
  const errorFromQuery = params.error
    ? (ERROR_MESSAGES[params.error] ?? "Unable to sign in.")
    : undefined;

  const title = surface === "client" ? "Sign in" : "Staff sign in";

  return (
    <Shell surface={surface} title={title}>
      <LoginForm surface={surface} errorFromQuery={errorFromQuery} />
    </Shell>
  );
}
