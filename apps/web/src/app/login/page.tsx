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

  const title = surface === "client" ? "Sign in" : "Staff sign in";

  if (surface === "client") {
    return (
      <ClientLayout guest>
        <div className="w-100" style={{ maxWidth: "28rem" }}>
          <h1 className="h4 mb-4">{title}</h1>
          <LoginForm surface={surface} errorFromQuery={errorFromQuery} />
        </div>
      </ClientLayout>
    );
  }

  return (
    <StaffLayout guest>
      <div className="w-100" style={{ maxWidth: "28rem" }}>
        <h1 className="h4 mb-4">{title}</h1>
        <LoginForm surface={surface} errorFromQuery={errorFromQuery} />
      </div>
    </StaffLayout>
  );
}
