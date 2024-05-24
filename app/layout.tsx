import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Neon Latency Benchmarks",
    description: "An open-source tool for understanding and benchmarking the connect, query and cold start timing of Neon projects.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏔️</text></svg>"></link>
            <body>{children}</body>
        </html>
    );
}
