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
          "radial-gradient(circle at top, rgba(148,163,184,0.10) 0%, transparent 30%), linear-gradient(160deg, #0c1118 0%, #111827 55%, #0d141d 100%)",
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
