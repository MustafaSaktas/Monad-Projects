import { Link, NavLink } from "react-router-dom";
import { ConnectButton } from "./ConnectButton";

const navStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center"
};

const containerStyle: React.CSSProperties = {
  maxWidth: 920,
  margin: "0 auto",
  padding: 16
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={containerStyle}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          paddingBottom: 12,
          borderBottom: "1px solid #eee"
        }}
      >
        <div style={navStyle}>
          <Link to="/" style={{ fontWeight: 700, textDecoration: "none" }}>
            AI Governor
          </Link>
          <NavLink to="/create">Create Proposal</NavLink>
          <NavLink to="/bet">Bet</NavLink>
          <NavLink to="/execute">Execute</NavLink>
        </div>
        <ConnectButton />
      </header>

      <main style={{ paddingTop: 16 }}>{children}</main>
    </div>
  );
}