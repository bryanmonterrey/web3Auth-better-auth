import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { SolanaProvider } from "@/components/solana/solana-provider";
import { ClusterProvider } from "@/components/cluster/cluster-data-access";
import { ReactQueryProvider } from "@/components/react-query-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ReactQueryProvider>
        <ClusterProvider>
          <SolanaProvider>
            <NextTopLoader easing="ease" showSpinner={false} color="var(--primary)" />
            {children}
            <Toaster position="bottom-center" />
          </SolanaProvider>
        </ClusterProvider>
      </ReactQueryProvider>
    </ThemeProvider>
  );
}
