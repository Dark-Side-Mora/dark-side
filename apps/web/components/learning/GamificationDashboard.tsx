import React from "react";
import { Card } from "../ui/Input";

interface GamificationDashboardProps {
  userProgress: {
    totalMarks: number;
    rank: string;
    nextRank: string;
    pointsToNextRank: number;
    totalQuestions: number;
  } | null;
}

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  userProgress,
}) => {
  if (!userProgress) return null;

  const { totalMarks, rank, nextRank, pointsToNextRank, totalQuestions } =
    userProgress;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((1000 - pointsToNextRank) / 1000) * 100),
  ); // Simplified progress logic for demo

  return (
    <div style={{ marginBottom: "32px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gap: "24px",
        }}
      >
        {/* Rank Card */}
        <Card glass>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(6, 182, 212, 0.4)",
                fontSize: "32px",
              }}
            >
              🚀
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "4px",
                }}
              >
                Current Rank
              </div>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                }}
              >
                {rank}
              </h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                <span>
                  Next:{" "}
                  <strong style={{ color: "var(--accent-purple)" }}>
                    {nextRank}
                  </strong>
                </span>
                <span
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "var(--border)",
                  }}
                />
                <span>{pointsToNextRank} XP to go</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: "20px" }}>
            <div
              style={{
                height: "6px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${100 - (pointsToNextRank / 250) * 100}%`, // Rough visual estimation
                  background:
                    "linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))",
                  borderRadius: "3px",
                }}
              />
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <Card glass>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                fontWeight: 800,
                color: "var(--accent-cyan)",
              }}
            >
              {totalMarks}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginTop: "4px",
              }}
            >
              Total XP Earned
            </div>
          </div>
        </Card>

        <Card glass>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                fontWeight: 800,
                color: "var(--success)",
              }}
            >
              {totalQuestions}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginTop: "4px",
              }}
            >
              Challenges Solved
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
