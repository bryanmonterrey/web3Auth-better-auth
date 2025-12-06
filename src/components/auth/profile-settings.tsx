"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, User } from "lucide-react";
import AvatarUpload from "@/components/file-upload/avatar-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import { AnimatePresence, motion } from "framer-motion";
import { useUpdateProfile } from "@/hooks/use-update-profile";
import { useAuthSession } from "@/hooks/use-auth-session";

export default function ProfileSettings() {
    const { data: session } = useAuthSession();
    const [isLoading, setIsLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const [resetCount, setResetCount] = useState(0);

    const updateProfile = useUpdateProfile();

    useEffect(() => {
        if (session?.user) {
            setUsername(session.user.username || "");
            setDisplayName(session.user.name || "");
            setBio(session.user.bio || "");
            // Bio would come from session if it exists in the user object
            setIsLoading(false);
        }
    }, [session]);

    const handleAvatarChange = (file: FileWithPreview | null) => {
        if (file?.file instanceof File) {
            setAvatarFile(file.file);
        } else {
            setAvatarFile(null);
        }
    };

    const handleSubmit = () => {
        const updates: any = {};

        if (username !== session?.user?.username) {
            updates.username = username;
        }

        if (displayName !== session?.user?.name) {
            updates.displayName = displayName;
        }

        if (bio !== (session?.user?.bio || "")) {
            updates.bio = bio;
        }

        if (avatarFile) {
            updates.avatar = avatarFile;
        }

        updateProfile.mutate(updates, {
            onSuccess: (data) => {
                setAvatarFile(null);
                setResetCount(prev => prev + 1); // Reset avatar component
            },
        });
    };

    const hasChanges =
        username !== (session?.user?.username || "") ||
        displayName !== (session?.user?.name || "") ||
        bio !== (session?.user?.bio || "") ||
        avatarFile !== null;

    const handleReset = () => {
        if (session?.user) {
            setUsername(session.user.username || "");
            setDisplayName(session.user.name || "");
            setBio(session.user.bio || "");
            setAvatarFile(null);
            setResetCount(prev => prev + 1); // Reset avatar component
        }
    };

    if (isLoading || !session) {
        return (
            <div className="space-y-4 w-full">
                {/* Header Skeleton */}
                <Skeleton className="h-7 w-48 rounded-full" />

                {/* Avatar Section Skeleton */}
                <div className="bg-neutral-800/40 rounded-3xl p-6 space-y-4">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <div className="flex flex-col items-center gap-4">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="text-center space-y-2">
                            <Skeleton className="h-4 w-32 rounded-full mx-auto" />
                            <Skeleton className="h-3 w-40 rounded-full mx-auto" />
                        </div>
                    </div>
                </div>

                {/* Profile Information Skeleton */}
                <div className="bg-neutral-800/40 rounded-3xl p-6 space-y-4">
                    <Skeleton className="h-6 w-40 rounded-full" />
                    <div className="space-y-4">
                        <div>
                            <Skeleton className="h-4 w-20 rounded-full mb-2" />
                            <Skeleton className="h-12 w-full rounded-2xl" />
                        </div>
                        <div>
                            <Skeleton className="h-4 w-24 rounded-full mb-2" />
                            <Skeleton className="h-12 w-full rounded-2xl" />
                        </div>
                        <div>
                            <Skeleton className="h-4 w-16 rounded-full mb-2" />
                            <Skeleton className="h-24 w-full rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 w-full hidden-scrollbar pb-8">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold">Profile Settings</h2>
            </div>

            {/* Avatar Section */}
            <div className="bg-greyy/25 rounded-3xl p-6">
                <h3 className="font-medium text-white mb-4">Avatar</h3>
                <AvatarUpload
                    key={resetCount} // Only re-render when explicitly reset
                    onFileChange={handleAvatarChange}
                    defaultAvatar={session.user.avatar_url || session.user.image || undefined}
                />
            </div>

            {/* Profile Information */}
            <div className="bg-neutral-800/40 rounded-3xl p-6 space-y-4">
                <h3 className="font-medium text-white mb-2">Profile Information</h3>

                {/* Username */}
                <div>
                    <label className="text-sm text-neutral-400 mb-2 block">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-full text-white placeholder:text-neutral-500 focus:outline-none"
                    />
                </div>

                {/* Display Name */}
                <div>
                    <label className="text-sm text-neutral-400 mb-2 block">Display Name</label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter display name"
                        className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-full text-white placeholder:text-neutral-500 focus:outline-none"
                    />
                </div>

                {/* Bio */}
                <div>
                    <label className="text-sm text-neutral-400 mb-2 block">Bio</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself"
                        rows={4}
                        className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-3xl text-white placeholder:text-neutral-500 focus:outline-none resize-none"
                    />
                </div>
            </div>

            {/* Unsaved Changes Toast */}
            <AnimatePresence>
                {hasChanges && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-black/80 border border-white/10 p-4 rounded-3xl flex items-center justify-between gap-4 backdrop-blur-xl shadow-2xl z-50"
                    >
                        <p className="text-white font-medium pl-2">Careful — you have unsaved changes!</p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                onClick={handleReset}
                                className="text-neutral-400 hover:text-white bg-white/10 rounded-full"
                            >
                                Reset
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={updateProfile.isPending}
                                className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-6 rounded-full transition-all"
                            >
                                {updateProfile.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
