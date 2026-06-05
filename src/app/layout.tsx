import "./globals.css";

import { Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "./providers";
import { APP_META_DESCRIPTION, APP_NAME, APP_URL } from "@/constants/app";
import { mc } from "@/utils/mc";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata = {
  title: APP_NAME,
  description: APP_META_DESCRIPTION,
  metadataBase: new URL(APP_URL),
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id" className={mc(plusJakartaSans.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
