import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header
      style={{
        height: "63px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
      }}
    >
      {/* LOGO */}
      <Link to="/home" style={{ textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="36" height="36" viewBox="0 0 36 36">
            <rect width="36" height="36" rx="8" fill="#2563EB" />
            <path
              d="M8 18h14M16 10l8 8-8 8"
              stroke="white"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <span
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#111827",
            }}
          >
            Campus<span style={{ color: "#2563EB" }}>Flow</span>
          </span>
        </div>
      </Link>
    </header>
  );
};

export default Navbar;
