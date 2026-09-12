import Common "common";

module {
  public type CallStatus = {
    #ringing;
    #ongoing;
    #ended;
    #missed;
    #declined;
  };

  public type Call = {
    id : Common.CallId;
    caller : Common.UserId;
    callee : Common.UserId;
    startedAt : Common.Timestamp;
    endedAt : ?Common.Timestamp;
    status : CallStatus;
  };
};
