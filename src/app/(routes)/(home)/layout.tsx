import React from "react";
import { getServerSession } from "@/lib/auth/get-session";
import BrowseLayoutClient from "./layout-client";

export default async function BrowseLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession();

    return (
        <BrowseLayoutClient initialSession={session}>
            {children}
        </BrowseLayoutClient>
    );
}
