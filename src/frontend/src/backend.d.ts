import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export interface TypingStatus {
    userId: UserId;
    updatedAt: Timestamp;
    isTyping: boolean;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type UserId = Principal;
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface Call {
    id: CallId;
    status: CallStatus;
    startedAt: Timestamp;
    endedAt?: Timestamp;
    callee: UserId;
    caller: UserId;
}
export type MessageId = bigint;
export interface Cell {
    value: Value;
    name: string;
}
export interface Presence {
    userId: UserId;
    updatedAt: Timestamp;
    online: boolean;
}
export interface Message {
    id: MessageId;
    status: MessageStatus;
    text: string;
    sender: UserId;
    timestamp: Timestamp;
    replyTo?: MessageId;
    attachment?: Attachment;
    reactions: Array<Reaction>;
}
export interface Attachment {
    id: bigint;
    url: string;
    kind: string;
    name: string;
    size: bigint;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export type CallId = bigint;
export interface Reaction {
    emoji: string;
    author: UserId;
}
export enum CallStatus {
    ringing = "ringing",
    missed = "missed",
    ended = "ended",
    ongoing = "ongoing",
    declined = "declined"
}
export enum MessageStatus {
    read = "read",
    sent = "sent",
    delivered = "delivered"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptCall(id: CallId): Promise<boolean>;
    addIceCandidate(callId: CallId, candidate: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteMessage(id: MessageId): Promise<boolean>;
    endCall(id: CallId): Promise<boolean>;
    execute(qJson: string): Promise<Result>;
    getAnswer(callId: CallId): Promise<string | null>;
    getApiDoc(): Promise<string>;
    getAuthorizedUsers(): Promise<Array<UserId>>;
    getCall(id: CallId): Promise<Call | null>;
    getCallerUserRole(): Promise<UserRole>;
    getIceCandidates(callId: CallId): Promise<Array<string>>;
    getMessage(id: MessageId): Promise<Message | null>;
    getOffer(callId: CallId): Promise<string | null>;
    getPartner(): Promise<UserId | null>;
    getPresence(userId: UserId): Promise<Presence | null>;
    getTyping(userId: UserId): Promise<TypingStatus | null>;
    isCallerAdmin(): Promise<boolean>;
    listCalls(): Promise<Array<Call>>;
    listMessages(): Promise<Array<Message>>;
    markRead(): Promise<void>;
    reactToMessage(id: MessageId, emoji: string): Promise<boolean>;
    schema(): Promise<string>;
    searchMessages(term: string): Promise<Array<Message>>;
    sendMessage(text: string, replyTo: MessageId | null, attachment: Attachment | null): Promise<MessageId>;
    setAnswer(callId: CallId, sdp: string): Promise<void>;
    setAuthorizedUsers(users: Array<UserId>): Promise<void>;
    setOffer(callId: CallId, sdp: string): Promise<void>;
    setPresence(online: boolean): Promise<void>;
    setTyping(isTyping: boolean): Promise<void>;
    startCall(callee: UserId): Promise<CallId>;
}
