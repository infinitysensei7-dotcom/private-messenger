import { createIdentity, PocketIc } from "@dfinity/pic";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

// `@icp-sdk/core` is not a dependency of the root `app` package, so it cannot
// be imported from a lane file under `app/test/`. `@dfinity/pic` (a root
// dependency) re-exports `createIdentity`, whose `getPrincipal()` yields the
// same self-authenticating principals the old `Principal.selfAuthenticating`
// calls produced. The admin must be non-anonymous: `AccessControl.initialize`
// ignores an anonymous caller, so an anonymous admin would never be granted the
// `#admin` role and `setAuthorizedUsers` would trap.
const ADMIN = createIdentity("admin-seed").getPrincipal();
const ALICE = createIdentity("alice-seed").getPrincipal();
const BOB = createIdentity("bob-seed").getPrincipal();
const INTRUDER = createIdentity("intruder-seed").getPrincipal();

let pic: PocketIc | undefined;
let actor: _SERVICE;

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  const installed = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
    sender: ADMIN,
  });
  actor = installed.actor;

  // The first non-anonymous caller to initialize becomes the admin.
  actor.setPrincipal(ADMIN);
  await actor._initialize_access_control();

  // Authorize exactly the two pre-authorized accounts.
  await actor.setAuthorizedUsers([ALICE, BOB]);

  // `requireUser` also checks `AccessControl.hasPermission(..., #user)`, which
  // traps "User is not registered" for any caller absent from the role map.
  // `setAuthorizedUsers` only fills the authorized list, so register both
  // accounts as users through the admin-only role assignment.
  await actor.assignCallerUserRole(ALICE, { user: null });
  await actor.assignCallerUserRole(BOB, { user: null });
});

afterAll(async () => {
  await pic?.tearDown();
});

describe("messaging", () => {
  it("answers an empty-state read instead of trapping", async () => {
    actor.setPrincipal(ALICE);
    await expect(actor.listMessages()).resolves.toEqual([]);
  });

  it("round-trips a message through the real canister", async () => {
    actor.setPrincipal(ALICE);
    const id = await actor.sendMessage("hello bob", [], []);
    const messages = await actor.listMessages();
    expect(messages).toContainEqual(
      expect.objectContaining({ id, text: "hello bob", sender: ALICE }),
    );
  });

  it("marks a partner's message as read", async () => {
    actor.setPrincipal(ALICE);
    const id = await actor.sendMessage("read me", [], []);
    actor.setPrincipal(BOB);
    await actor.markRead();
    const messages = await actor.listMessages();
    const msg = messages.find((m) => m.id === id);
    expect(msg?.status).toEqual({ read: null });
  });

  it("reacts to a message and searches it", async () => {
    actor.setPrincipal(ALICE);
    const id = await actor.sendMessage("needle in the haystack", [], []);
    await expect(actor.reactToMessage(id, "👍")).resolves.toBe(true);
    const results = await actor.searchMessages("needle");
    expect(results.map((m) => m.id)).toContain(id);
  });

  it("rejects a caller who is not one of the two authorized accounts", async () => {
    actor.setPrincipal(INTRUDER);
    await expect(actor.listMessages()).rejects.toThrow();
  });
});

describe("calls", () => {
  it("round-trips a call through start, accept, end, and history", async () => {
    actor.setPrincipal(ALICE);
    const callId = await actor.startCall(BOB);
    await expect(actor.acceptCall(callId)).resolves.toBe(true);
    await expect(actor.endCall(callId)).resolves.toBe(true);

    actor.setPrincipal(BOB);
    const calls = await actor.listCalls();
    const call = calls.find((c) => c.id === callId);
    expect(call).toMatchObject({
      id: callId,
      caller: ALICE,
      callee: BOB,
      status: { ended: null },
    });
  });

  it("stores and retrieves WebRTC signaling", async () => {
    actor.setPrincipal(ALICE);
    const callId = await actor.startCall(BOB);
    await actor.setOffer(callId, "offer-sdp");
    await actor.setAnswer(callId, "answer-sdp");
    await actor.addIceCandidate(callId, "candidate-1");

    actor.setPrincipal(BOB);
    await expect(actor.getOffer(callId)).resolves.toEqual(["offer-sdp"]);
    await expect(actor.getAnswer(callId)).resolves.toEqual(["answer-sdp"]);
    await expect(actor.getIceCandidates(callId)).resolves.toEqual([
      "candidate-1",
    ]);
  });
});
