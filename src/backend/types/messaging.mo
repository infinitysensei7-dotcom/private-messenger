import Common "common";

module {
  public type MessageStatus = {
    #sent;
    #delivered;
    #read;
  };

  public type Reaction = {
    emoji : Text;
    author : Common.UserId;
  };

  public type Attachment = {
    id : Nat;
    kind : Text;
    url : Text;
    name : Text;
    size : Nat;
  };

  public type Message = {
    id : Common.MessageId;
    sender : Common.UserId;
    text : Text;
    timestamp : Common.Timestamp;
    status : MessageStatus;
    replyTo : ?Common.MessageId;
    reactions : [Reaction];
    attachment : ?Attachment;
  };

  public type Presence = {
    userId : Common.UserId;
    online : Bool;
    updatedAt : Common.Timestamp;
  };

  public type TypingStatus = {
    userId : Common.UserId;
    isTyping : Bool;
    updatedAt : Common.Timestamp;
  };
};
