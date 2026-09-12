import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Calls "../types/calls";
import CallsLib "../lib/calls";
import MessagingLib "../lib/messaging";

mixin (
  accessControlState : AccessControl.AccessControlState,
  authorizedUsers : Common.AuthorizedUsers,
  calls : Map.Map<Common.CallId, Calls.Call>,
  offers : Map.Map<Common.CallId, Text>,
  answers : Map.Map<Common.CallId, Text>,
  iceCandidates : Map.Map<Common.CallId, [Text]>,
  state : Common.AppState,
) {
  public shared ({ caller }) func startCall(callee : Common.UserId) : async Common.CallId {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    CallsLib.startCall(calls, state, caller, callee);
  };

  public shared ({ caller }) func acceptCall(id : Common.CallId) : async Bool {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    CallsLib.acceptCall(calls, id);
  };

  public shared ({ caller }) func endCall(id : Common.CallId) : async Bool {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    CallsLib.endCall(calls, id, caller);
  };

  public query ({ caller }) func listCalls() : async [Calls.Call] {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    CallsLib.listCalls(calls);
  };

  public query ({ caller }) func getCall(id : Common.CallId) : async ?Calls.Call {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    CallsLib.getCall(calls, id);
  };

  public shared ({ caller }) func setOffer(callId : Common.CallId, sdp : Text) : async () {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    CallsLib.setOffer(offers, callId, sdp);
  };

  public query ({ caller }) func getOffer(callId : Common.CallId) : async ?Text {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    CallsLib.getOffer(offers, callId);
  };

  public shared ({ caller }) func setAnswer(callId : Common.CallId, sdp : Text) : async () {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    CallsLib.setAnswer(answers, callId, sdp);
  };

  public query ({ caller }) func getAnswer(callId : Common.CallId) : async ?Text {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    CallsLib.getAnswer(answers, callId);
  };

  public shared ({ caller }) func addIceCandidate(callId : Common.CallId, candidate : Text) : async () {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    CallsLib.addIceCandidate(iceCandidates, callId, candidate);
  };

  public query ({ caller }) func getIceCandidates(callId : Common.CallId) : async [Text] {
    MessagingLib.requireUser(accessControlState, authorizedUsers.users, caller);
    CallsLib.getIceCandidates(iceCandidates, callId);
  };
};
