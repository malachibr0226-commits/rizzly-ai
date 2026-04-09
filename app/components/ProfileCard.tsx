import React from "react";
import styled from "@emotion/styled";
import { FaEnvelope, FaGoogle, FaUserCircle } from "react-icons/fa";

const Card = styled.div`
  background: rgba(34, 18, 58, 0.75);
  border-radius: 2.5rem;
  box-shadow: 0 8px 32px 0 rgba(80, 0, 120, 0.18), 0 1.5px 8px 0 rgba(0,0,0,0.12);
  padding: 3rem 2.5rem 2.5rem 2.5rem;
  max-width: 440px;
  margin: 2.5rem auto;
  color: #fff;
  border: 2.5px solid;
  border-image: linear-gradient(120deg, #a78bfa 10%, #f472b6 90%) 1;
  backdrop-filter: blur(18px) saturate(1.2);
  transition: box-shadow 0.3s, transform 0.3s;
  &:hover {
    box-shadow: 0 12px 40px 0 #a78bfa55, 0 2px 12px 0 #f472b655;
    transform: translateY(-4px) scale(1.025);
  }
`;

const ProfilePic = styled.img`
  width: 108px;
  height: 108px;
  border-radius: 50%;
  border: 4px solid #f472b6;
  box-shadow: 0 4px 24px #a78bfa55, 0 1.5px 8px #f472b655;
  object-fit: cover;
  margin-bottom: 1.5rem;
  background: linear-gradient(120deg, #a78bfa 10%, #f472b6 90%);
`;

const Name = styled.h2`
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  letter-spacing: 0.01em;
  background: linear-gradient(90deg, #a78bfa 30%, #f472b6 70%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Section = styled.div`
  margin-bottom: 1.7rem;
`;

const Label = styled.div`
  font-size: 1.02rem;
  font-weight: 700;
  color: #f472b6;
  margin-bottom: 0.3rem;
  letter-spacing: 0.01em;
`;

const Value = styled.div`
  font-size: 1.13rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-weight: 500;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1.5px solid #a78bfa55;
  margin: 2rem 0 1.7rem 0;
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
        <Value><FaEnvelope /> {email} <span style={{fontSize: '0.95em', color: '#a3e635', marginLeft: 8, fontWeight: 600}}>Primary</span></Value>
      </Section>
      <Section>
        <Label>Connected accounts</Label>
        <Value>
          <FaGoogle style={{color: googleConnected ? '#34a853' : '#888', fontSize: '1.2em'}} />
          {googleConnected ? <span style={{color: '#34a853', fontWeight: 600}}>Google connected</span> : <span style={{color: '#888'}}>Not connected</span>}
        </Value>
      </Section>
    </Card>
  );
}
