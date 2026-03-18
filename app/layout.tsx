import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Local Side Quest — AI Travel Planner",
  description:
    "Plan your trip like a local would. Hotels, restaurants, essential apps, YouTube guides, and day-by-day itineraries powered by AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
