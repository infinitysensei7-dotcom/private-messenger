import App from "@/App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: null, isFetching: false }),
  useInternetIdentity: () => ({
    isAuthenticated: false,
    identity: undefined,
    login: vi.fn(),
    clear: vi.fn(),
    isInitializing: false,
    isLoggingIn: false,
  }),
  InternetIdentityProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

describe("Home page", () => {
  it("loads without a blank screen on the default route", async () => {
    renderApp();
    expect(
      await screen.findByRole("heading", { name: /a quiet channel/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open private channel/i }),
    ).toBeInTheDocument();
  });

  it("navigates to the private channel via the primary CTA", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(
      screen.getByRole("link", { name: /open private channel/i }),
    );
    // The conversation is gated behind the identity lock when signed out.
    expect(
      await screen.findByRole("heading", { name: /private channel/i }),
    ).toBeInTheDocument();
  });
});
