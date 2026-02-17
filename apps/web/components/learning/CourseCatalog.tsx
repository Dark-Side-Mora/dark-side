import React from "react";
import { Button } from "../ui/Button";

interface CourseModule {
  id: number;
  title: string;
  description: string;
  length: string;
  icon: string;
  status: "Not Started" | "In Progress" | "Completed";
  progress?: number;
}

interface CourseCatalogProps {
  modules: CourseModule[];
  onSelectModule: (moduleId: number) => void;
}

export const CourseCatalog: React.FC<CourseCatalogProps> = ({
  modules,
  onSelectModule,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "24px",
      }}
    >
      {modules.map((module) => (
        <div
          key={module.id}
          className="glass-card-hover"
          style={{
            padding: "24px",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
          onClick={() => onSelectModule(module.id)}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}
            >
              {module.icon || "📚"}
            </div>
            {module.status === "Completed" && (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "20px",
                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                  color: "var(--success)",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                Completed
              </span>
            )}
          </div>

          <div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                marginBottom: "8px",
                color: "var(--text-primary)",
              }}
            >
              {module.title}
            </h3>
            <div
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                display: "flex",
                gap: "12px",
              }}
            >
              <span>⏱ {module.length}</span>
              <span>•</span>
              <span>DevSecOps</span>
            </div>
          </div>

          <div style={{ marginTop: "auto", paddingTop: "16px" }}>
            <Button
              style={{ width: "100%" }}
              variant={module.status === "Completed" ? "secondary" : "primary"}
            >
              {module.status === "Completed"
                ? "Review Course"
                : module.status === "In Progress"
                  ? "Continue"
                  : "Start Course"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
