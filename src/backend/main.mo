import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Common "types/common";
import Messaging "types/messaging";
import Calls "types/calls";
import MessagingApi "mixins/messaging-api";
import CallsApi "mixins/calls-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let authorizedUsers : Common.AuthorizedUsers;
  let messages : Map.Map<Common.MessageId, Messaging.Message>;
  let calls : Map.Map<Common.CallId, Calls.Call>;
  let offers : Map.Map<Common.CallId, Text>;
  let answers : Map.Map<Common.CallId, Text>;
  let iceCandidates : Map.Map<Common.CallId, [Text]>;
  let presence : Map.Map<Common.UserId, Messaging.Presence>;
  let typing : Map.Map<Common.UserId, Messaging.TypingStatus>;
  let state : Common.AppState;

  transient let anyP = Principal.fromText("aaaaa-aa");

  func messageStatusText(s : Messaging.MessageStatus) : Text =
    switch s {
      case (#sent) "sent";
      case (#delivered) "delivered";
      case (#read) "read";
    };

  func callStatusText(s : Calls.CallStatus) : Text =
    switch s {
      case (#ringing) "ringing";
      case (#ongoing) "ongoing";
      case (#ended) "ended";
      case (#missed) "missed";
      case (#declined) "declined";
    };

  func optNatToNat(o : ?Nat) : Nat = switch o { case (?n) n; case null 0 };
  func optIntToInt(o : ?Int) : Int = switch o { case (?n) n; case null 0 };

  include MixinAuthorization(
    accessControlState,
    ?(func(caller : Principal, _attrs : { name : ?Text; email : ?Text; sso : ?Text }) {
      if (authorizedUsers.users.size() < 2 and not authorizedUsers.users.contains(caller)) {
        authorizedUsers.users := authorizedUsers.users.concat([caller]);
      };
    }),
  );
  include MessagingApi(accessControlState, authorizedUsers, messages, presence, typing, state);
  include CallsApi(accessControlState, authorizedUsers, calls, offers, answers, iceCandidates, state);
  include ApiDocMixin();
  include Expose({
    entities = [
      OQL.Entity.manual<Messaging.Message>("message", func () = messages.values(), "Message", "id")
        .sample({ id = 0; sender = anyP; text = ""; timestamp = 0; status = #sent; replyTo = null; reactions = []; attachment = null })
        .payload("id", func m = m.id)
        .payload("sender", func m = m.sender)
        .payload("text", func m = m.text)
        .payload("timestamp", func m = m.timestamp)
        .payload("status", func m = messageStatusText(m.status))
        .payload("replyTo", func m = optNatToNat(m.replyTo))
        .controllerOnly()
        .build(),
      OQL.Entity.manual<Calls.Call>("call", func () = calls.values(), "Call", "id")
        .sample({ id = 0; caller = anyP; callee = anyP; startedAt = 0; endedAt = null; status = #ringing })
        .payload("id", func c = c.id)
        .payload("caller", func c = c.caller)
        .payload("callee", func c = c.callee)
        .payload("startedAt", func c = c.startedAt)
        .payload("endedAt", func c = optIntToInt(c.endedAt))
        .payload("status", func c = callStatusText(c.status))
        .controllerOnly()
        .build(),
      OQL.Entity.manual<Messaging.Presence>("presence", func () = presence.values(), "Presence", "userId")
        .sample({ userId = anyP; online = false; updatedAt = 0 })
        .payload("userId", func p = p.userId)
        .payload("online", func p = p.online)
        .payload("updatedAt", func p = p.updatedAt)
        .controllerOnly()
        .build(),
      OQL.Entity.manual<Messaging.TypingStatus>("typing", func () = typing.values(), "TypingStatus", "userId")
        .sample({ userId = anyP; isTyping = false; updatedAt = 0 })
        .payload("userId", func t = t.userId)
        .payload("isTyping", func t = t.isTyping)
        .payload("updatedAt", func t = t.updatedAt)
        .controllerOnly()
        .build(),
    ];
  });
};
