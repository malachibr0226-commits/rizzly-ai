"use client";
import { useUser } from "@clerk/nextjs";
import ProfileCard from "../components/ProfileCard";

export default function AccountPage() {
  const { user } = useUser();
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "radial-gradient(circle at top, rgba(244,114,182,0.16) 0%, transparent 32%), radial-gradient(circle at 80% 20%, rgba(192,132,252,0.14) 0%, transparent 28%), linear-gradient(135deg, #140f1f 0%, #1d1430 46%, #10131c 100%)",
      }}
    >
      <ProfileCard
        name={user?.fullName || "User"}
        email={user?.primaryEmailAddress?.emailAddress || ""}
        image={user?.imageUrl || undefined}
        appleConnected={Boolean(
          user?.externalAccounts?.some((acc) => acc.provider === "apple"),
        )}
        googleConnected={Boolean(
          user?.externalAccounts?.some((acc) => acc.provider === "google"),
        )}
      />
    </div>
  );
}
