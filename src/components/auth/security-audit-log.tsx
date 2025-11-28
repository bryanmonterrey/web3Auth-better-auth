"use client";

import { useState, useEffect } from "react";
import { Shield, Eye, Key, UserPlus, UserMinus, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const actionIcons = {
    reveal_phrase: Eye,
    export_key: Key,
    passkey_added: UserPlus,
    passkey_removed: UserMinus,
    passkey_renamed: Edit,
};

const actionLabels = {
    reveal_phrase: "Recovery Phrase Revealed",
    export_key: "Private Key Exported",
    passkey_added: "Passkey Added",
    passkey_removed: "Passkey Removed",
    passkey_renamed: "Passkey Renamed",
};

interface AuditLog {
    id: string;
    action: keyof typeof actionIcons;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    createdAt: string;
    metadata?: any;
}

export default function SecurityAuditLog() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch("/api/audit-logs");
                if (response.ok) {
                    const data = await response.json();
                    setLogs(data.logs || []);
                }
            } catch (error) {
                console.error("Failed to fetch audit logs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    const getDeviceInfo = (userAgent: string) => {
        if (userAgent.includes("Mobile")) return "📱 Mobile";
        if (userAgent.includes("Tablet")) return "📲 Tablet";
        return "💻 Desktop";
    };

    if (loading) {
        return (
            <div className="space-y-4 flex flex-col items-start justify-center">
                {/* Header Skeleton */}
                <div className="w-full">
                    <Skeleton className="h-7 w-64 mb-2 rounded-full" />
                </div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-neutral-800/40 rounded-3xl p-4">
                            <Skeleton className="h-4 w-20 mb-2 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                    ))}
                </div>

                {/* Card List Skeleton */}
                <div className="w-full space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="bg-neutral-800/40 rounded-3xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                                <Skeleton className="w-10 h-10 rounded-lg" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-5 w-32 rounded-full" />
                                    <Skeleton className="h-4 w-48 rounded-full" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 flex flex-col items-start justify-center">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold">Security & Audit Log</h2>
                </div>

            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 w-full">
                <div className="bg-neutral-800/40  col-span-1 rounded-3xl p-4">
                    <p className="text-neutral-400 text-sm">Events</p>
                    <p className="text-2xl font-bold text-white mt-1">{logs.length}</p>
                </div>
                <div className="bg-neutral-800/40 col-span-1 rounded-3xl p-4">
                    <p className="text-neutral-400 text-sm">Reveals</p>
                    <p className="text-2xl font-bold text-white mt-1">
                        {logs.filter((l) => l.action === "reveal_phrase").length}
                    </p>
                </div>
                <div className="bg-neutral-800/40 col-span-1 rounded-3xl p-4">
                    <p className="text-neutral-400 text-sm">Exports</p>
                    <p className="text-2xl font-bold text-white mt-1">
                        {logs.filter((l) => l.action === "export_key").length}
                    </p>
                </div>
            </div>

            {/* Audit Log Cards */}
            <div className="w-full space-y-2">
                {logs.length === 0 ? (
                    <div className="bg-neutral-800/40 rounded-3xl p-8 text-center">
                        <Shield className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Security Events</h3>
                        <p className="text-neutral-400 text-sm">
                            No security events have been recorded yet.
                        </p>
                    </div>
                ) : (
                    logs.map((log) => {
                        const Icon = actionIcons[log.action];
                        return (
                            <div
                                key={log.id}
                                className="bg-neutral-800/40 rounded-3xl p-4 flex items-center justify-between transition-colors hover:bg-neutral-800/60"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                        <Icon className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white">
                                            {actionLabels[log.action]}
                                        </h3>
                                        <p className="text-sm text-neutral-400">
                                            {getDeviceInfo(log.userAgent)} • {log.ipAddress} • {formatDate(log.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <span
                                        className={`px-2 py-1 text-xs rounded-full ${log.success
                                            ? "bg-green-500/20 text-green-400"
                                            : "bg-red-500/20 text-red-400"
                                            }`}
                                    >
                                        {log.success ? "Success" : "Failed"}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
