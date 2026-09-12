import Map "mo:core/Map";
import Time "mo:core/Time";
import Common "../types/common";
import Calls "../types/calls";

module {
  public func startCall(
    calls : Map.Map<Common.CallId, Calls.Call>,
    state : Common.AppState,
    caller : Common.UserId,
    callee : Common.UserId,
  ) : Common.CallId {
    let id = state.nextCallId;
    state.nextCallId += 1;
    calls.add(id, {
      id;
      caller;
      callee;
      startedAt = Time.now();
      endedAt = null;
      status = #ringing;
    });
    id;
  };

  public func acceptCall(calls : Map.Map<Common.CallId, Calls.Call>, id : Common.CallId) : Bool {
    switch (calls.get(id)) {
      case (?call) {
        if (call.status == #ringing) {
          calls.add(id, { call with status = #ongoing });
          true;
        } else {
          false;
        };
      };
      case null { false };
    };
  };

  public func endCall(calls : Map.Map<Common.CallId, Calls.Call>, id : Common.CallId, caller : Common.UserId) : Bool {
    switch (calls.get(id)) {
      case (?call) {
        switch (call.status) {
          case (#ongoing) {
            calls.add(id, { call with endedAt = ?Time.now(); status = #ended });
            true;
          };
          case (#ringing) {
            let status = if (call.caller == caller) { #missed } else { #declined };
            calls.add(id, { call with endedAt = ?Time.now(); status });
            true;
          };
          case (_) { false };
        };
      };
      case null { false };
    };
  };

  public func listCalls(calls : Map.Map<Common.CallId, Calls.Call>) : [Calls.Call] {
    calls.values().toArray();
  };

  public func getCall(calls : Map.Map<Common.CallId, Calls.Call>, id : Common.CallId) : ?Calls.Call {
    calls.get(id);
  };

  public func setOffer(offers : Map.Map<Common.CallId, Text>, callId : Common.CallId, sdp : Text) : () {
    offers.add(callId, sdp);
  };

  public func getOffer(offers : Map.Map<Common.CallId, Text>, callId : Common.CallId) : ?Text {
    offers.get(callId);
  };

  public func setAnswer(answers : Map.Map<Common.CallId, Text>, callId : Common.CallId, sdp : Text) : () {
    answers.add(callId, sdp);
  };

  public func getAnswer(answers : Map.Map<Common.CallId, Text>, callId : Common.CallId) : ?Text {
    answers.get(callId);
  };

  public func addIceCandidate(iceCandidates : Map.Map<Common.CallId, [Text]>, callId : Common.CallId, candidate : Text) : () {
    let existing = iceCandidates.get(callId) ?? [];
    iceCandidates.add(callId, existing.concat([candidate]));
  };

  public func getIceCandidates(iceCandidates : Map.Map<Common.CallId, [Text]>, callId : Common.CallId) : [Text] {
    iceCandidates.get(callId) ?? [];
  };
};
