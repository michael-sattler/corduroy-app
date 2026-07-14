import { LoginForm } from "@/components/login-form";
import { ClientLayout, StaffLayout } from "@/components/layout";
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

  if (surface === "client") {
    return (
      <ClientLayout guest>
        <LoginForm surface={surface} errorFromQuery={errorFromQuery} />
      </ClientLayout>
    );
  }

  return (
    <StaffLayout guest>
      <LoginForm surface={surface} errorFromQuery={errorFromQuery} />
    </StaffLayout>
  );
}
