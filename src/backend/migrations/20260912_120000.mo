import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type MessageStatus = {
    #sent;
    #delivered;
    #read;
  };

  type Reaction = {
    emoji : Text;
    author : Principal;
  };

  type Attachment = {
    id : Nat;
    kind : Text;
    url : Text;
    name : Text;
    size : Nat;
  };

  type Message = {
    id : Nat;
    sender : Principal;
    text : Text;
    timestamp : Int;
    status : MessageStatus;
    replyTo : ?Nat;
    reactions : [Reaction];
    attachment : ?Attachment;
  };

  type Presence = {
    userId : Principal;
    online : Bool;
    updatedAt : Int;
  };

  type TypingStatus = {
    userId : Principal;
    isTyping : Bool;
    updatedAt : Int;
  };

  type CallStatus = {
    #ringing;
    #ongoing;
    #ended;
    #missed;
    #declined;
  };

  type Call = {
    id : Nat;
    caller : Principal;
    callee : Principal;
    startedAt : Int;
    endedAt : ?Int;
    status : CallStatus;
  };

  type AppState = {
    var nextMessageId : Nat;
    var nextCallId : Nat;
  };

  type AuthorizedUsers = {
    var users : [Principal];
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    authorizedUsers : AuthorizedUsers;
    messages : Map.Map<Nat, Message>;
    calls : Map.Map<Nat, Call>;
    presence : Map.Map<Principal, Presence>;
    typing : Map.Map<Principal, TypingStatus>;
    state : AppState;
    offers : Map.Map<Nat, Text>;
    answers : Map.Map<Nat, Text>;
    iceCandidates : Map.Map<Nat, [Text]>;
  };

  public func migration(_old : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      authorizedUsers = { var users = [] };
      messages = Map.empty();
      calls = Map.empty();
      presence = Map.empty();
      typing = Map.empty();
      state = { var nextMessageId = 0; var nextCallId = 0 };
      offers = Map.empty();
      answers = Map.empty();
      iceCandidates = Map.empty();
    };
  };
};
