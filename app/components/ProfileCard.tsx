import React from "react";
import styled from "@emotion/styled";
import { FaApple, FaEnvelope, FaGoogle } from "react-icons/fa";

const Card = styled.div`
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, rgba(34, 18, 58, 0.96) 0%, rgba(18, 12, 33, 0.98) 100%);
  border-radius: 30px;
  box-shadow: 0 24px 56px rgba(15, 23, 42, 0.28);
  padding: 2rem;
  max-width: 440px;
  margin: 2.25rem auto;
  color: #fff;
  border: 1px solid rgba(244, 114, 182, 0.24);
  backdrop-filter: blur(18px) saturate(1.15);
  transition: box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease;

  &::before {
    content: "";
    position: absolute;
    inset: -20% auto auto -10%;
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(244, 114, 182, 0.22), transparent 68%);
    pointer-events: none;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 1px;
    border-radius: 28px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    pointer-events: none;
  }

  &:hover {
    box-shadow: 0 28px 60px rgba(15, 23, 42, 0.32);
    transform: translateY(-2px);
    border-color: rgba(244, 114, 182, 0.34);
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
  background: linear-gradient(135deg, #fb7185 0%, #c084fc 100%);
  box-shadow: 0 12px 28px rgba(244, 63, 94, 0.24);
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
  color: rgba(244, 114, 182, 0.88);
  margin-bottom: 0.45rem;
`;

const Name = styled.h2`
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.01em;
  background: linear-gradient(90deg, #ddd6fe 10%, #f9a8d4 85%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtext = styled.p`
  margin: 0.35rem 0 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.96rem;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(192, 132, 252, 0.26);
  margin: 1.35rem 0 1rem;
`;

const Section = styled.div`
  position: relative;
  z-index: 1;
  margin-bottom: 0.9rem;
  padding: 1rem 1.05rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

const Label = styled.div`
  font-size: 0.76rem;
  font-weight: 700;
  color: rgba(249, 168, 212, 0.92);
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
    tone === "green" ? "rgba(163, 230, 53, 0.12)" : "rgba(255, 255, 255, 0.08)"};
  color: ${({ tone }) => (tone === "green" ? "#bef264" : "rgba(255, 255, 255, 0.78)")};
  border: 1px solid
    ${({ tone }) => (tone === "green" ? "rgba(190, 242, 100, 0.18)" : "rgba(255, 255, 255, 0.08)")};
`;

export default function ProfileCard({
  name = "Malachi BR",
  email = "malachibr0226@gmail.com",
  image = "https://www.gravatar.com/avatar?d=mp",
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
        <Subtext>Everything connected and ready to go.</Subtext>
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
