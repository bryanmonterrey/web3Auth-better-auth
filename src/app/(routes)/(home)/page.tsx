import { getServerSession } from "@/lib/auth/get-session";
import * as React from "react"

export default async function Home() {
  const me = await getServerSession();

  return (
    <div className="grid h-full grid-rows-[20px_1fr_20px] flex items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
   
   <div className="w-full h-full mt-48 flex gap-4 px-4 justify-center items-center">

   </div>
    </div>
  );
}
