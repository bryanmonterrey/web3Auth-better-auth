"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import { Monitor, Smartphone, Tablet, Globe, Clock, Shield, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface Session {
    id: string;
    token: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
}

export default function SessionManager() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState<string | null>(null);
    const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadSessions = async () => {
        try {
            setLoading(true);
            setError(null);

            // Use Better Auth's listSessions method
            const { data, error: sessionsError } = await authClient.listSessions();

            console.log("Sessions response:", { data, sessionsError });

            if (sessionsError) {
                throw new Error(sessionsError.message || "Failed to load sessions");
            }

            // Better Auth returns sessions array directly
            const sessionsList = Array.isArray(data) ? data : (data?.sessions || []);
            console.log("Sessions list:", sessionsList);
            setSessions(sessionsList);
        } catch (err) {
            console.error("Failed to load sessions:", err);
            setError(err instanceof Error ? err.message : "Failed to load sessions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
        // Refresh every 30 seconds
        const interval = setInterval(loadSessions, 30000);
        return () => clearInterval(interval);
    }, []);

    const revokeSession = async (sessionToken: string) => {
        try {
            setRevoking(sessionToken);
            setError(null);

            // Use Better Auth's revokeSession method
            const { error: revokeError } = await authClient.revokeSession({
                token: sessionToken,
            });

            if (revokeError) {
                throw new Error(revokeError.message || "Failed to revoke session");
            }

            // Reload sessions
            await loadSessions();
        } catch (err) {
            console.error("Failed to revoke session:", err);
            setError(err instanceof Error ? err.message : "Failed to revoke session");
        } finally {
            setRevoking(null);
        }
    };

    const revokeAllOtherSessions = async () => {
        try {
            setLoading(true);
            setError(null);

            // Use Better Auth's revokeOtherSessions method
            const { error: revokeError } = await authClient.revokeOtherSessions();

            if (revokeError) {
                throw new Error(revokeError.message || "Failed to revoke sessions");
            }

            setShowRevokeAllDialog(false);
            await loadSessions();
        } catch (err) {
            console.error("Failed to revoke all sessions:", err);
            setError(err instanceof Error ? err.message : "Failed to revoke all sessions");
        } finally {
            setLoading(false);
        }
    };

    const getDeviceIcon = (userAgent?: string) => {
        if (!userAgent) return Monitor;
        const ua = userAgent.toLowerCase();
        if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
            return Smartphone;
        }
        if (ua.includes("tablet") || ua.includes("ipad")) {
            return Tablet;
        }
        return Monitor;
    };

    const getDeviceName = (userAgent?: string) => {
        if (!userAgent) return "Unknown Device";

        const ua = userAgent.toLowerCase();
        let browser = "Unknown Browser";
        let os = "Unknown OS";

        // Detect browser
        if (ua.includes("chrome")) browser = "Chrome";
        else if (ua.includes("firefox")) browser = "Firefox";
        else if (ua.includes("safari")) browser = "Safari";
        else if (ua.includes("edge")) browser = "Edge";

        // Detect OS
        if (ua.includes("windows")) os = "Windows";
        else if (ua.includes("mac")) os = "macOS";
        else if (ua.includes("linux")) os = "Linux";
        else if (ua.includes("android")) os = "Android";
        else if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

        return `${browser} on ${os}`;
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const currentSessionId = authClient.$store.session.data?.session?.id;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    {loading ? (
                        <Skeleton className="h-7 w-48 rounded-full" />
                    ) : (
                        <h2 className="text-xl font-bold">Active Sessions</h2>
                    )}
                </div>
                {sessions.length > 1 && (
                    <Button
                        onClick={() => setShowRevokeAllDialog(true)}
                        variant="destructive"
                        size="sm"
                        disabled={loading}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Revoke All Others
                    </Button>
                )}
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Sessions List */}
            {loading && sessions.length === 0 ? (
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-neutral-800/40 rounded-3xl p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4 flex-1">
                                    <Skeleton className="w-12 h-12 rounded-2xl" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-48" />
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                </div>
                                <Skeleton className="w-20 h-9 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No active sessions found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sessions.map((session) => {
                        const DeviceIcon = getDeviceIcon(session.userAgent);
                        const isCurrentSession = session.id === currentSessionId;

                        return (
                            <div
                                key={session.id}
                                className={`bg-neutral-800/40 rounded-3xl p-4 ${isCurrentSession
                                    ? "border-blue-500/50 bg-blue-500/5"
                                    : "border-neutral-900"
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4 flex-1">
                                        <div className={`p-3 rounded-2xl justify-center my-auto items-center ${isCurrentSession ? "bg-blue-500/20" : "bg-neutral-900/50"
                                            }`}>
                                            <DeviceIcon className={`w-6 h-6 my-auto ${isCurrentSession ? "text-blue-500" : "text-neutral-400"
                                                }`} />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium text-neutral-400">
                                                    {getDeviceName(session.userAgent)}
                                                </h3>
                                                {isCurrentSession && (
                                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                                                        Current
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-1 text-sm text-neutral-400">
                                                {session.ipAddress && (
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="w-4 h-4" />
                                                        <span>{session.ipAddress}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span>Last active {formatTimeAgo(session.updatedAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {!isCurrentSession && (
                                        <Button
                                            onClick={() => revokeSession(session.token)}
                                            variant="outline"
                                            size="sm"
                                            disabled={revoking === session.token}
                                            className="ml-4 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-neutral-300 border-none"
                                        >
                                            {revoking === session.token ? (
                                                "Revoking..."
                                            ) : (
                                                <>
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Revoke
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Revoke All Dialog */}
            <Dialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
                <DialogContent className="bg-neutral-950 border-neutral-800">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            Revoke All Other Sessions?
                        </DialogTitle>
                        <DialogDescription>
                            This will sign you out from all other devices. You will remain signed in on this device.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex gap-3 mt-4">
                        <Button
                            onClick={() => setShowRevokeAllDialog(false)}
                            variant="outline"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={revokeAllOtherSessions}
                            variant="destructive"
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading ? "Revoking..." : "Revoke All"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
