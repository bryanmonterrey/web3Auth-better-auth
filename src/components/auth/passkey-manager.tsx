"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import { Key, Trash2, Edit, Plus, Shield, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Passkey {
    id: string;
    name: string;
    deviceType: string;
    backedUp: boolean;
    createdAt: Date;
}

export default function PasskeyManager() {
    const [passkeys, setPasskeys] = useState<Passkey[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showRenameDialog, setShowRenameDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedPasskey, setSelectedPasskey] = useState<Passkey | null>(null);
    const [newName, setNewName] = useState("");
    const [addingPasskey, setAddingPasskey] = useState(false);

    useEffect(() => {
        loadPasskeys();
    }, []);

    const loadPasskeys = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/passkeys/list");

            if (response.ok) {
                const data = await response.json();
                setPasskeys(data.passkeys || []);
            } else {
                throw new Error("Failed to load passkeys");
            }
        } catch (error) {
            console.error("Failed to load passkeys:", error);
            setPasskeys([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPasskey = async () => {
        try {
            setAddingPasskey(true);

            // Add passkey with optional name
            const name = newName.trim() || `Passkey ${passkeys.length + 1} `;
            await authClient.passkey.addPasskey({
                name: name,
            });

            await loadPasskeys();
            setShowAddDialog(false);
            setNewName("");
        } catch (error) {
            console.error("Failed to add passkey:", error);
            alert(error instanceof Error ? error.message : "Failed to add passkey");
        } finally {
            setAddingPasskey(false);
        }
    };

    const handleRenamePasskey = async () => {
        if (!selectedPasskey || !newName.trim()) return;

        try {
            const response = await fetch("/api/passkeys/rename", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    passkeyId: selectedPasskey.id,
                    name: newName.trim(),
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to rename passkey");
            }

            await loadPasskeys();
            setShowRenameDialog(false);
            setNewName("");
            setSelectedPasskey(null);
        } catch (error) {
            console.error("Failed to rename passkey:", error);
            alert(error instanceof Error ? error.message : "Failed to rename passkey");
        }
    };

    const handleDeletePasskey = async () => {
        if (!selectedPasskey) return;

        // Prevent deleting last passkey
        if (passkeys.length <= 1) {
            alert("Cannot delete your last passkey");
            return;
        }

        try {
            const response = await fetch("/api/passkeys/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    passkeyId: selectedPasskey.id,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete passkey");
            }

            setShowDeleteDialog(false);
            setSelectedPasskey(null);
            await loadPasskeys();
        } catch (error) {
            console.error("Failed to delete passkey:", error);
            alert(error instanceof Error ? error.message : "Failed to delete passkey");
        }
    };

    const openRenameDialog = (passkey: Passkey) => {
        setSelectedPasskey(passkey);
        setNewName(passkey.name || "");
        setShowRenameDialog(true);
    };

    const openDeleteDialog = (passkey: Passkey) => {
        setSelectedPasskey(passkey);
        setShowDeleteDialog(true);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Passkey Management</h2>
                </div>
                
            </div>

            {/* Passkeys List */}
            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <Skeleton className="w-10 h-10 rounded-2xl" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-4 w-48" />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="w-5 h-5 rounded-lg" />
                                    <Skeleton className="w-5 h-5 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : passkeys.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 text-center">
                    <Smartphone className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Passkeys Yet</h3>
                    <p className="text-neutral-400 text-sm mb-4">
                        Add a passkey to enable biometric authentication
                    </p>
                    <Button
                        onClick={() => setShowAddDialog(true)}
                        variant="outline"
                        className="bg-neutral-800 border-neutral-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Passkey
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                    {passkeys.map((passkey) => (
                        <div
                            key={passkey.id}
                            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                    <Smartphone className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="font-medium">
                                        {passkey.name || `Passkey ${passkey.id.slice(0, 8)} `}
                                    </h3>
                                    <p className="text-sm text-neutral-400">
                                        {passkey.deviceType} • Added{" "}
                                        {new Date(passkey.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => openRenameDialog(passkey)}
                                    variant="outline"
                                    size="sm"
                                    className="bg-neutral-800 border-neutral-700"
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                    onClick={() => openDeleteDialog(passkey)}
                                    variant="outline"
                                    size="sm"
                                    className="bg-neutral-800 border-neutral-700 text-red-400 hover:text-red-300"
                                    disabled={passkeys.length <= 1}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-end items-end w-full">
                        <Button
                        onClick={() => setShowAddDialog(true)}
                        className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-200"
                        >
                        Add Passkey
                        </Button>
                    </div>
                </div>
            )}

            {/* Add Passkey Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="bg-neutral-950 border-neutral-800">
                    <DialogHeader>
                        <DialogTitle>Add New Passkey</DialogTitle>
                        <DialogDescription>
                            Follow the prompts to register a new biometric authentication method
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-neutral-400">
                            Your device will prompt you to use Face ID, Touch ID, or Windows Hello
                            to create a new passkey.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setShowAddDialog(false)}
                                variant="outline"
                                className="flex-1 bg-neutral-900 border-neutral-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddPasskey}
                                disabled={addingPasskey}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                {addingPasskey ? "Adding..." : "Add Passkey"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Rename Passkey Dialog */}
            <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
                <DialogContent className="bg-neutral-950 border-neutral-800">
                    <DialogHeader>
                        <DialogTitle>Rename Passkey</DialogTitle>
                        <DialogDescription>
                            Give this passkey a memorable name
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g., iPhone 15 Pro, MacBook Air"
                            className="bg-neutral-900 border-neutral-800"
                        />
                        <div className="flex gap-2">
                            <Button
                                onClick={() => {
                                    setShowRenameDialog(false);
                                    setNewName("");
                                }}
                                variant="outline"
                                className="flex-1 bg-neutral-900 border-neutral-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleRenamePasskey}
                                disabled={!newName.trim()}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Passkey Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="bg-neutral-950 border-neutral-800">
                    <DialogHeader>
                        <DialogTitle>Delete Passkey</DialogTitle>
                        <DialogDescription className="text-red-400">
                            Are you sure you want to delete this passkey?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-neutral-400">
                            You won't be able to use this device for biometric authentication anymore.
                            {passkeys.length <= 1 && (
                                <span className="block mt-2 text-red-400">
                                    ⚠️ This is your last passkey. Deleting it will disable passkey authentication.
                                </span>
                            )}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setShowDeleteDialog(false)}
                                variant="outline"
                                className="flex-1 bg-neutral-900 border-neutral-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDeletePasskey}
                                className="flex-1 bg-red-600 hover:bg-red-700"
                                disabled={passkeys.length <= 1}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
