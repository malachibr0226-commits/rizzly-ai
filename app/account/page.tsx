import { useUser } from "@clerk/nextjs";
import ProfileCard from "../components/ProfileCard";

export default function AccountPage() {
  const { user } = useUser();
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(120deg, #1a1022 0%, #2d1a4a 100%)" }}>
      <ProfileCard
        name={user?.fullName || "User"}
        email={user?.primaryEmailAddress?.emailAddress || ""}
        image={user?.imageUrl || undefined}
        googleConnected={Boolean(user?.externalAccounts?.some(acc => acc.provider === "google"))}
      />
    </div>
  );
}
