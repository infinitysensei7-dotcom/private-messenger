import { ConversationPage } from "@/pages/Conversation";
import { type Message, MessageStatus, UserRole } from "@/types";
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

// Radix Popover does not open reliably in jsdom (its floating-ui measurement
// crashes the tree). Render the popover content inline so the reaction buttons
// are always visible to the test.
vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  PopoverAnchor: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const ALICE = Principal.fromText("aaaaa-aa");
const BOB = Principal.fromText("2vxsx-fae");

function makeActor() {
  return {
    listMessages: vi.fn(async (): Promise<Message[]> => []),
    getCallerUserRole: vi.fn(async () => UserRole.user),
    getAuthorizedUsers: vi.fn(async () => [ALICE, BOB]),
    getPartner: vi.fn(async () => BOB),
    getPresence: vi.fn(async () => null),
    getTyping: vi.fn(async () => null),
    sendMessage: vi.fn(async () => 1n),
    deleteMessage: vi.fn(async () => true),
    reactToMessage: vi.fn(async () => true),
    markRead: vi.fn(async () => undefined),
    setPresence: vi.fn(async () => undefined),
    setTyping: vi.fn(async () => undefined),
    searchMessages: vi.fn(async () => []),
  };
}

type Actor = ReturnType<typeof makeActor>;

let actor: Actor;
let identity: { isAuthenticated: boolean; getPrincipal: () => Principal };

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor, isFetching: false }),
  useInternetIdentity: () => ({
    isAuthenticated: identity.isAuthenticated,
    identity: identity.isAuthenticated
      ? { getPrincipal: () => ALICE }
      : undefined,
    login: vi.fn(),
    clear: vi.fn(),
    isInitializing: false,
    isLoggingIn: false,
  }),
  InternetIdentityProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

function renderConversation() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConversationPage />
    </QueryClientProvider>,
  );
}

async function enterPin(user: ReturnType<typeof userEvent.setup>, pin: string) {
  for (const digit of pin) {
    await user.click(screen.getByRole("button", { name: `Digit ${digit}` }));
  }
}

beforeEach(() => {
  actor = makeActor();
  identity = { isAuthenticated: true, getPrincipal: () => ALICE };
  window.localStorage.clear();
});

describe("Conversation privacy lock", () => {
  it("shows the identity lock screen when signed out", () => {
    identity.isAuthenticated = false;
    renderConversation();
    expect(screen.getByRole("button", { name: /unlock/i })).toBeInTheDocument();
  });

  it("shows access denied for a caller who is not authorized", async () => {
    actor.getCallerUserRole.mockResolvedValue(UserRole.guest);
    renderConversation();
    expect(await screen.findByText(/access denied/i)).toBeInTheDocument();
  });

  it("shows access denied for a registered user who is not on the allow-list", async () => {
    // The caller has the #user role but is NOT one of the two pre-authorized
    // accounts. The allow-list gate must reject them even though the backend
    // grants them the user role.
    actor.getAuthorizedUsers.mockResolvedValue([BOB]);
    renderConversation();
    expect(await screen.findByText(/access denied/i)).toBeInTheDocument();
  });

  it("walks through PIN setup, lock, and unlock to reach the thread", async () => {
    const user = userEvent.setup();
    renderConversation();

    // No PIN set yet → setup screen.
    expect(
      await screen.findByRole("heading", { name: /set a privacy pin/i }),
    ).toBeInTheDocument();

    // Enter a 4-digit PIN; the lock screen auto-submits at 4 digits.
    await enterPin(user, "1234");

    // The thread appears once unlocked.
    expect(
      await screen.findByPlaceholderText(/type a message/i),
    ).toBeInTheDocument();

    // Lock now → back to the unlock screen.
    await user.click(
      screen.getByRole("button", { name: /lock the private channel now/i }),
    );
    expect(
      await screen.findByRole("heading", { name: /private channel/i }),
    ).toBeInTheDocument();

    // Wrong PIN is rejected.
    await enterPin(user, "9999");
    expect(await screen.findByText(/incorrect pin/i)).toBeInTheDocument();

    // Correct PIN unlocks again.
    await enterPin(user, "1234");
    expect(
      await screen.findByPlaceholderText(/type a message/i),
    ).toBeInTheDocument();
  });
});

describe("Conversation thread", () => {
  async function unlockToThread(user: ReturnType<typeof userEvent.setup>) {
    renderConversation();
    await screen.findByRole("heading", { name: /set a privacy pin/i });
    await enterPin(user, "1234");
    await screen.findByPlaceholderText(/type a message/i);
  }

  it("sends a message through the actor and shows it in the thread", async () => {
    const user = userEvent.setup();
    await unlockToThread(user);

    await user.type(
      screen.getByPlaceholderText(/type a message/i),
      "hello bob",
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(actor.sendMessage).toHaveBeenCalledWith("hello bob", null, null);
    });
  });

  it("renders an own message with status and timestamp", async () => {
    actor.listMessages.mockResolvedValue([
      {
        id: 7n,
        status: MessageStatus.read,
        text: "from alice",
        sender: ALICE,
        timestamp: 1_700_000_000_000_000_000n,
        reactions: [],
      },
    ]);
    const user = userEvent.setup();
    await unlockToThread(user);

    expect(await screen.findByText("from alice")).toBeInTheDocument();
    expect(screen.getByText("read")).toBeInTheDocument();
  });

  it("reacts to a message via the actor", async () => {
    actor.listMessages.mockResolvedValue([
      {
        id: 7n,
        status: MessageStatus.sent,
        text: "from bob",
        sender: BOB,
        timestamp: 1_700_000_000_000_000_000n,
        reactions: [],
      },
    ]);
    const user = userEvent.setup();
    await unlockToThread(user);

    await screen.findByText("from bob");
    await user.click(screen.getByRole("button", { name: /react to message/i }));
    await user.click(screen.getByRole("button", { name: /react with 👍/i }));

    await waitFor(() => {
      expect(actor.reactToMessage).toHaveBeenCalledWith(7n, "👍");
    });
  });
});
