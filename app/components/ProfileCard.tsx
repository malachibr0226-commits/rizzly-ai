import React from "react";
import styled from "@emotion/styled";
import { FaApple, FaEnvelope, FaGoogle } from "react-icons/fa";

const Card = styled.div`
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 18, 30, 0.98) 100%);
  border-radius: 24px;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.22);
  padding: 1.75rem;
  max-width: 440px;
  margin: 2rem auto;
  color: #e5eef9;
  border: 1px solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(14px) saturate(1.02);
  transition: box-shadow 0.18s ease, border-color 0.18s ease;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 34%);
    pointer-events: none;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 1px;
    border-radius: 22px;
    border: 1px solid rgba(255, 255, 255, 0.04);
    pointer-events: none;
  }

  &:hover {
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.24);
    border-color: rgba(148, 163, 184, 0.24);
  }
`;

const Header = styled.div`
  position: relative;
  z-index: 1;
`;

const AvatarRing = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 104px;
  height: 104px;
  padding: 4px;
  border-radius: 999px;
  background: linear-gradient(135deg, #334155 0%, #1f2937 100%);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.18);
  margin-bottom: 1rem;
`;

const ProfilePic = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid rgba(18, 12, 33, 0.92);
  object-fit: cover;
  background: #241533;
`;

const Eyebrow = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.7);
  margin-bottom: 0.45rem;
`;

const Name = styled.h2`
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.01em;
  color: #f8fafc;
`;

const Subtext = styled.p`
  margin: 0.35rem 0 0;
  color: rgba(226, 232, 240, 0.64);
  font-size: 0.96rem;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  margin: 1.35rem 0 1rem;
`;

const Section = styled.div`
  position: relative;
  z-index: 1;
  margin-bottom: 0.9rem;
  padding: 1rem 1.05rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(148, 163, 184, 0.12);
`;

const Label = styled.div`
  font-size: 0.76rem;
  font-weight: 700;
  color: rgba(191, 219, 254, 0.78);
  margin-bottom: 0.45rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const ValueRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ValueMain = styled.div`
  font-size: 1.02rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.94);
  min-width: 0;
  overflow-wrap: anywhere;
`;

const Badge = styled.span<{ tone?: "green" | "default" }>`
  border-radius: 999px;
  padding: 0.28rem 0.62rem;
  font-size: 0.77rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: ${({ tone }) =>
    tone === "green" ? "rgba(34, 197, 94, 0.12)" : "rgba(148, 163, 184, 0.12)"};
  color: ${({ tone }) => (tone === "green" ? "#bbf7d0" : "rgba(226, 232, 240, 0.82)")};
  border: 1px solid
    ${({ tone }) => (tone === "green" ? "rgba(134, 239, 172, 0.2)" : "rgba(148, 163, 184, 0.14)")};
`;

export default function ProfileCard({
  name = "User",
  email = "",
  image = "",
  googleConnected = false,
  appleConnected = false,
}: {
  name?: string;
  email?: string;
  image?: string;
  googleConnected?: boolean;
  appleConnected?: boolean;
}) {
  return (
    <Card>
      <Header>
        <AvatarRing>
          <ProfilePic src={image} alt="Profile" />
        </AvatarRing>
        <Eyebrow>Your account</Eyebrow>
        <Name>{name}</Name>
        <Subtext>Your profile and connected sign-ins in one place.</Subtext>
      </Header>

      <Divider />

      <Section>
        <Label>Email address</Label>
        <ValueRow>
          <ValueMain>
            <FaEnvelope />
            <span>{email}</span>
          </ValueMain>
          <Badge tone="green">Primary</Badge>
        </ValueRow>
      </Section>

      <Section>
        <Label>Connected accounts</Label>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <ValueRow>
            <ValueMain>
              <FaApple style={{ color: appleConnected ? "#ffffff" : "#9ca3af", fontSize: "1.15em" }} />
              <span>{appleConnected ? "Apple connected" : "Apple available"}</span>
            </ValueMain>
            <Badge>{appleConnected ? "Synced" : "Ready"}</Badge>
          </ValueRow>

          <ValueRow>
            <ValueMain>
              <FaGoogle style={{ color: googleConnected ? "#34a853" : "#9ca3af", fontSize: "1.15em" }} />
              <span>{googleConnected ? "Google connected" : "Google available"}</span>
            </ValueMain>
            <Badge>{googleConnected ? "Synced" : "Ready"}</Badge>
          </ValueRow>
        </div>
      </Section>
    </Card>
  );
}
