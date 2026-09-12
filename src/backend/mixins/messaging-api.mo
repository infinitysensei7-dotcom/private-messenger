import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Messaging "../types/messaging";
import MessagingLib "../lib/messaging";

mixin (
  accessControlState : AccessControl.AccessControlState,
  authorizedUsers : Common.AuthorizedUsers,
  messages : Map.Map<Common.MessageId, Messaging.Message>,
  presence : Map.Map<Common.UserId, Messaging.Presence>,
  typing : Map.Map<Common.UserId, Messaging.TypingStatus>,
  state : Common.AppState,
) {
  public shared ({ caller }) func setAuthorizedUsers(users : [Common.UserId]) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only the admin can set the authorized users");
    };
    if (users.size() != 2) {
      Runtime.trap("Authorized users must be exactly two principals");
    };
    authorizedUsers.users := users;
  };

  public query ({ caller }) func getAuthorizedUsers() : async [Common.UserId] {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    authorizedUsers.users;
  };

  public query ({ caller }) func getPartner() : async ?Common.UserId {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    MessagingLib.getPartner(authorizedUsers.users, caller);
  };

  public shared ({ caller }) func sendMessage(
    text : Text,
    replyTo : ?Common.MessageId,
    attachment : ?Messaging.Attachment,
  ) : async Common.MessageId {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    MessagingLib.sendMessage(messages, state, caller, text, replyTo, attachment);
  };

  public shared ({ caller }) func listMessages() : async [Messaging.Message] {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    MessagingLib.markDelivered(messages, caller);
    MessagingLib.listMessages(messages);
  };

  public query ({ caller }) func getMessage(id : Common.MessageId) : async ?Messaging.Message {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    MessagingLib.getMessage(messages, id);
  };

  public shared ({ caller }) func deleteMessage(id : Common.MessageId) : async Bool {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    MessagingLib.deleteMessage(messages, id);
  };

  public shared ({ caller }) func reactToMessage(id : Common.MessageId, emoji : Text) : async Bool {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    MessagingLib.reactToMessage(messages, id, caller, emoji);
  };

  public query ({ caller }) func searchMessages(term : Text) : async [Messaging.Message] {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    MessagingLib.searchMessages(messages, term);
  };

  public shared ({ caller }) func markRead() : async () {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    MessagingLib.markRead(messages, caller);
  };

  public shared ({ caller }) func setPresence(online : Bool) : async () {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    MessagingLib.setPresence(presence, caller, online);
  };

  public query ({ caller }) func getPresence(userId : Common.UserId) : async ?Messaging.Presence {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    MessagingLib.getPresence(presence, userId);
  };

  public shared ({ caller }) func setTyping(isTyping : Bool) : async () {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    MessagingLib.setTyping(typing, caller, isTyping);
  };

  public query ({ caller }) func getTyping(userId : Common.UserId) : async ?Messaging.TypingStatus {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    MessagingLib.getTyping(typing, userId);
  };
};
