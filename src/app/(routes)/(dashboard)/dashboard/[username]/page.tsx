import ProfileSettings from "@/components/auth/profile-settings";

export default function DashboardPage() {
    return (
        <div className="flex flex-col w-full items-center justify-start text-white/90 p-6">
            <div className="w-full max-w-sm mx-auto space-y-8 flex flex-col items-center justify-start">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">Profile</h1>
                    <p className="text-neutral-400">Manage your profile information</p>
                </div>

                {/* Profile Settings Component */}
                <ProfileSettings />
            </div>
        </div>
    );
}
