import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Messaging "../types/messaging";

module {
  public func sendMessage(
    messages : Map.Map<Common.MessageId, Messaging.Message>,
    state : Common.AppState,
    sender : Common.UserId,
    text : Text,
    replyTo : ?Common.MessageId,
    attachment : ?Messaging.Attachment,
  ) : Common.MessageId {
    let id = state.nextMessageId;
    state.nextMessageId += 1;
    let msg : Messaging.Message = {
      id;
      sender;
      text;
      timestamp = Time.now();
      status = #sent;
      replyTo;
      reactions = [];
      attachment;
    };
    messages.add(id, msg);
    id
  };

  public func listMessages(messages : Map.Map<Common.MessageId, Messaging.Message>) : [Messaging.Message] {
    messages.values().toArray()
  };

  public func getMessage(messages : Map.Map<Common.MessageId, Messaging.Message>, id : Common.MessageId) : ?Messaging.Message {
    messages.get(id)
  };

  public func deleteMessage(messages : Map.Map<Common.MessageId, Messaging.Message>, id : Common.MessageId) : Bool {
    switch (messages.get(id)) {
      case (?_) {
        messages.remove(id);
        true;
      };
      case null { false };
    };
  };

  public func reactToMessage(
    messages : Map.Map<Common.MessageId, Messaging.Message>,
    id : Common.MessageId,
    author : Common.UserId,
    emoji : Text,
  ) : Bool {
    switch (messages.get(id)) {
      case (?msg) {
        let hasExisting = msg.reactions.any(func r = r.author == author);
        let updated = if (hasExisting) {
          msg.reactions.map(func r = if (r.author == author) { { r with emoji } } else { r });
        } else {
          msg.reactions.concat([{ emoji; author }]);
        };
        messages.add(id, { msg with reactions = updated });
        true;
      };
      case null { false };
    };
  };

  public func searchMessages(messages : Map.Map<Common.MessageId, Messaging.Message>, term : Text) : [Messaging.Message] {
    let t = term.toLower();
    messages.values().toArray().filter(func m = m.text.toLower().contains(#text t))
  };

  public func markRead(messages : Map.Map<Common.MessageId, Messaging.Message>, reader : Common.UserId) : () {
    let toUpdate = messages.entries().toArray().filter(
      func((id, msg)) = msg.sender != reader and msg.status != #read
    );
    for ((id, msg) in toUpdate.values()) {
      messages.add(id, { msg with status = #read });
    };
  };

  public func markDelivered(messages : Map.Map<Common.MessageId, Messaging.Message>, reader : Common.UserId) : () {
    let toUpdate = messages.entries().toArray().filter(
      func((id, msg)) = msg.sender != reader and msg.status == #sent
    );
    for ((id, msg) in toUpdate.values()) {
      messages.add(id, { msg with status = #delivered });
    };
  };

  public func setPresence(presence : Map.Map<Common.UserId, Messaging.Presence>, userId : Common.UserId, online : Bool) : () {
    presence.add(userId, { userId; online; updatedAt = Time.now() });
  };

  public func getPresence(presence : Map.Map<Common.UserId, Messaging.Presence>, userId : Common.UserId) : ?Messaging.Presence {
    presence.get(userId);
  };

  public func setTyping(typing : Map.Map<Common.UserId, Messaging.TypingStatus>, userId : Common.UserId, isTyping : Bool) : () {
    typing.add(userId, { userId; isTyping; updatedAt = Time.now() });
  };

  public func getTyping(typing : Map.Map<Common.UserId, Messaging.TypingStatus>, userId : Common.UserId) : ?Messaging.TypingStatus {
    typing.get(userId);
  };

  public func isAuthorized(authorizedUsers : [Common.UserId], caller : Common.UserId) : Bool {
    authorizedUsers.contains(caller);
  };

  public func requireUser(
    accessControlState : AccessControl.AccessControlState,
    authorizedUsers : [Common.UserId],
    caller : Common.UserId,
  ) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authorized users can access the conversation");
    };
    if (not isAuthorized(authorizedUsers, caller)) {
      Runtime.trap("Unauthorized: Only the two pre-authorized accounts can access the conversation");
    };
  };

  public func getPartner(authorizedUsers : [Common.UserId], caller : Common.UserId) : ?Common.UserId {
    if (authorizedUsers.size() != 2) {
      null;
    } else if (authorizedUsers[0] == caller) {
      ?authorizedUsers[1];
    } else if (authorizedUsers[1] == caller) {
      ?authorizedUsers[0];
    } else {
      null;
    };
  };
};
