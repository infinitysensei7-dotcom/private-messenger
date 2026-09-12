import { CallPage } from "@/pages/Call";
import { type Call, CallStatus } from "@/types";
import { Principal } from "@icp-sdk/core/principal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

const ALICE = Principal.fromText("aaaaa-aa");
const BOB = Principal.fromText("2vxsx-fae");

function makeActor() {
  return {
    listCalls: vi.fn(async (): Promise<Call[]> => []),
    getCallerUserRole: vi.fn(async () => "user"),
    getAuthorizedUsers: vi.fn(async () => [ALICE, BOB]),
    getPartner: vi.fn(async () => BOB),
    startCall: vi.fn(async () => 1n),
    acceptCall: vi.fn(async () => true),
    endCall: vi.fn(async () => true),
    setOffer: vi.fn(async () => undefined),
    getOffer: vi.fn(async () => null),
    setAnswer: vi.fn(async () => undefined),
    getAnswer: vi.fn(async () => null),
    addIceCandidate: vi.fn(async () => undefined),
    getIceCandidates: vi.fn(async () => []),
  };
}

type Actor = ReturnType<typeof makeActor>;

let actor: Actor;

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor, isFetching: false }),
  useInternetIdentity: () => ({
    isAuthenticated: true,
    identity: { getPrincipal: () => ALICE },
    login: vi.fn(),
    clear: vi.fn(),
    isInitializing: false,
    isLoggingIn: false,
  }),
  InternetIdentityProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

function renderCall() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CallPage />
    </QueryClientProvider>,
  );
}

async function unlockToCall(user: ReturnType<typeof userEvent.setup>) {
  renderCall();
  await screen.findByRole("heading", { name: /set a privacy pin/i });
  for (const digit of "1234") {
    await user.click(screen.getByRole("button", { name: `Digit ${digit}` }));
  }
  await screen.findByRole("heading", { name: /call history/i });
}

beforeEach(() => {
  actor = makeActor();
  window.localStorage.clear();
});

describe("Call page", () => {
  it("shows access denied for a registered user who is not on the allow-list", async () => {
    // The caller has the #user role but is NOT one of the two pre-authorized
    // accounts. The allow-list gate must reject them before any call UI shows.
    actor.getAuthorizedUsers.mockResolvedValue([BOB]);
    renderCall();
    expect(await screen.findByText(/access denied/i)).toBeInTheDocument();
  });

  it("shows an empty call history state", async () => {
    const user = userEvent.setup();
    await unlockToCall(user);
    expect(screen.getByText(/no calls yet/i)).toBeInTheDocument();
  });

  it("renders call history with status and an end control for ongoing calls", async () => {
    actor.listCalls.mockResolvedValue([
      {
        id: 1n,
        status: CallStatus.ongoing,
        startedAt: 1_700_000_000_000_000_000n,
        caller: ALICE,
        callee: BOB,
      },
      {
        id: 2n,
        status: CallStatus.ended,
        startedAt: 1_690_000_000_000_000_000n,
        caller: ALICE,
        callee: BOB,
      },
    ]);
    const user = userEvent.setup();
    await unlockToCall(user);

    expect(await screen.findByText("Ongoing")).toBeInTheDocument();
    expect(screen.getByText("Ended")).toBeInTheDocument();

    // Ending the ongoing call calls the backend.
    await user.click(screen.getByRole("button", { name: /end call/i }));
    await waitFor(() => {
      expect(actor.endCall).toHaveBeenCalledWith(1n);
    });
  });

  it("starts a voice call to the partner", async () => {
    const user = userEvent.setup();
    await unlockToCall(user);

    await user.click(screen.getByRole("button", { name: /start voice call/i }));
    await waitFor(() => {
      expect(actor.startCall).toHaveBeenCalledWith(BOB);
    });
  });
});
