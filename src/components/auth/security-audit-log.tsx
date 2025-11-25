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
            <div className="space-y-6 flex flex-col items-start justify-center">
                {/* Header Skeleton */}
                <div className="w-full">
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                    ))}
                </div>

                {/* Table Skeleton */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden w-full max-w-sm">
                    <div className="p-6 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="w-10 h-10 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <Skeleton className="h-6 w-16 rounded-full" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 flex flex-col items-start justify-center">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold">Security & Audit Log</h2>
                </div>
                
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4">
                    <p className="text-neutral-400 text-sm">Total Events</p>
                    <p className="text-2xl font-bold text-white mt-1">{logs.length}</p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4">
                    <p className="text-neutral-400 text-sm">Phrase Reveals</p>
                    <p className="text-2xl font-bold text-white mt-1">
                        {logs.filter((l) => l.action === "reveal_phrase").length}
                    </p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4">
                    <p className="text-neutral-400 text-sm">Key Exports</p>
                    <p className="text-2xl font-bold text-white mt-1">
                        {logs.filter((l) => l.action === "export_key").length}
                    </p>
                </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden max-w-sm">
                <div className="overflow-x-auto">
                    <table className="w-full max-w-sm">
                        <thead className="bg-neutral-800 border-b border-neutral-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                    Action
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                    Device
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                    IP Address
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                    Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-neutral-400">
                                        No security events recorded yet
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    const Icon = actionIcons[log.action];
                                    return (
                                        <tr key={log.id} className="hover:bg-neutral-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                                        <Icon className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                    <span className="text-sm font-medium text-white">
                                                        {actionLabels[log.action]}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                                                {getDeviceInfo(log.userAgent)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300 font-mono">
                                                {log.ipAddress}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs rounded-full ${log.success
                                                        ? "bg-green-500/20 text-green-400"
                                                        : "bg-red-500/20 text-red-400"
                                                        }`}
                                                >
                                                    {log.success ? "Success" : "Failed"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                                {formatDate(log.createdAt)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Security Tips */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-4">
                <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="space-y-1 text-sm">
                        <p className="text-blue-400 font-medium">Security Tips</p>
                        <ul className="text-neutral-300 space-y-1 list-disc list-inside">
                            <li>Review this log regularly for suspicious activity</li>
                            <li>If you see unfamiliar IP addresses, change your password immediately</li>
                            <li>Enable passkey authentication for additional security</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
