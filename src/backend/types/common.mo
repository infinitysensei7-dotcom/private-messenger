module {
  public type UserId = Principal;
  public type Timestamp = Int;
  public type MessageId = Nat;
  public type CallId = Nat;
  public type AppState = {
    var nextMessageId : MessageId;
    var nextCallId : CallId;
  };

  public type AuthorizedUsers = {
    var users : [UserId];
  };
};
