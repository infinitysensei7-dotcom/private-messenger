import Map "mo:core/Map";
import Common "types/common";
import Messaging "types/messaging";
import Calls "types/calls";

module {
  type NewActor = {
    messages : Map.Map<Common.MessageId, Messaging.Message>;
    calls : Map.Map<Common.CallId, Calls.Call>;
    presence : Map.Map<Common.UserId, Messaging.Presence>;
    typing : Map.Map<Common.UserId, Messaging.TypingStatus>;
    state : Common.AppState;
  };

  public func run(_old : {}) : NewActor {
    {
      messages = Map.empty();
      calls = Map.empty();
      presence = Map.empty();
      typing = Map.empty();
      state = { var nextMessageId = 0; var nextCallId = 0 };
    };
  };
};
