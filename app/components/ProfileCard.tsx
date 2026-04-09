import React from "react";
import styled from "@emotion/styled";
import { FaEnvelope, FaGoogle, FaUserCircle } from "react-icons/fa";

const Card = styled.div`
  background: linear-gradient(135deg, #2d1a4a 0%, #1a1022 100%);
  border-radius: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  padding: 2.5rem 2rem;
  max-width: 420px;
  margin: 2rem auto;
  color: #fff;
`;

const ProfilePic = styled.img`
  width: 84px;
  height: 84px;
  border-radius: 50%;
  border: 3px solid #a78bfa;
  box-shadow: 0 2px 12px #a78bfa44;
  object-fit: cover;
  margin-bottom: 1rem;
`;

const Name = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.div`
  font-size: 0.95rem;
  font-weight: 600;
  color: #c4b5fd;
  margin-bottom: 0.25rem;
`;

const Value = styled.div`
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #3b2a5a;
  margin: 1.5rem 0;
`;

export default function ProfileCard({
  name = "Malachi BR",
  email = "malachibr0226@gmail.com",
  image = "https://www.gravatar.com/avatar?d=mp",
  googleConnected = true,
}) {
  return (
    <Card>
      <ProfilePic src={image} alt="Profile" />
      <Name>{name}</Name>
      <Divider />
      <Section>
        <Label>Email address</Label>
        <Value><FaEnvelope /> {email} <span style={{fontSize: '0.85em', color: '#a3e635', marginLeft: 8}}>Primary</span></Value>
      </Section>
      <Section>
        <Label>Connected accounts</Label>
        <Value>
          <FaGoogle style={{color: googleConnected ? '#34a853' : '#888'}} />
          {googleConnected ? "Google connected" : "Not connected"}
        </Value>
      </Section>
    </Card>
  );
}
