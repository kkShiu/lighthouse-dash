import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main style={{ maxWidth: 400, margin: "80px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Lighthouse Dashboard</h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>Log in to continue.</p>
      <LoginForm />
    </main>
  );
}
