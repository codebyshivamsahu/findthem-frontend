import React, { useState } from 'react';
import { Linkedin, Users, GraduationCap, ExternalLink, BadgeCheck } from 'lucide-react';

interface TeamMember {
  id: number;
  name: string;
  regNo: string;
  linkedinUrl: string;
  initials: string;
  color: string;
}

const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'Shivam Kumar',
    regNo: '22105113012',
    linkedinUrl: 'https://www.linkedin.com/in/shivam-kumar-a7ab26253/',
    initials: 'SK',
    color: '#FF6B00',
  },
  {
    id: 2,
    name: 'Sumit Kumar',
    regNo: '22105113017',
    linkedinUrl: 'https://www.linkedin.com/in/sumit-kumar-586588284/',
    initials: 'SK',
    color: '#0A1628',
  },
  {
    id: 3,
    name: 'Anupam Kumar',
    regNo: '22105113011',
    linkedinUrl: 'https://www.linkedin.com/in/anupam-kumar-8a6758365/',
    initials: 'AK',
    color: '#059669',
  },
  {
    id: 4,
    name: 'Awadhesh Shubham',
    regNo: '22105113054',
    linkedinUrl: 'https://www.linkedin.com/in/awadhesh-shubham-5976b4260/',
    initials: 'AS',
    color: '#7C3AED',
  },
];

export default function Team() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div className="min-h-full bg-gray-50 p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FF6B00, #ff9a4a)' }}
          >
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
              Our Team
            </h1>
            <p className="text-sm text-gray-500">Find Them India — Development Team</p>
          </div>
        </div>


      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {teamMembers.map((member) => {
          const isHovered = hoveredId === member.id;
          return (
            <div
              key={member.id}
              onMouseEnter={() => setHoveredId(member.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-300"
              style={{
                boxShadow: isHovered
                  ? `0 16px 48px -8px ${member.color}45, 0 4px 16px -4px ${member.color}25`
                  : '0 1px 8px rgba(0,0,0,0.06)',
                transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
              }}
            >
              {/* Color bar top */}
              <div
                className="h-1.5 w-full"
                style={{ background: `linear-gradient(90deg, ${member.color}, ${member.color}66)` }}
              />

              <div className="p-6 flex flex-col items-center text-center gap-4">
                {/* Avatar */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transition-transform duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${member.color}, ${member.color}bb)`,
                    transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                    boxShadow: isHovered ? `0 8px 24px ${member.color}50` : 'none',
                  }}
                >
                  {member.initials}
                </div>

                {/* Name + Reg No */}
                <div>
                  <h3 className="font-bold text-gray-900 text-base leading-tight">
                    {member.name}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-mono text-gray-400 tracking-wide">
                      {member.regNo}
                    </span>
                  </div>
                </div>

                {/* Animated Divider */}
                <div
                  className="h-0.5 rounded-full transition-all duration-300"
                  style={{
                    background: isHovered ? member.color : '#e5e7eb',
                    width: isHovered ? '3rem' : '2rem',
                  }}
                />

                {/* LinkedIn Button */}
                <a
                  href={member.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background: isHovered ? member.color : '#f1f5f9',
                    color: isHovered ? '#fff' : '#475569',
                    border: `1.5px solid ${isHovered ? member.color : '#e2e8f0'}`,
                  }}
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="mt-8 flex items-center gap-2 text-sm text-gray-400">
        <BadgeCheck className="w-4 h-4 text-orange-400" />
        <span>All members are enrolled in B.Tech CSE — Batch 2022–26</span>
      </div>
    </div>
  );
}