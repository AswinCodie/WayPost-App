import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bookmark, Compass, PlusCircle, User } from "lucide-react";
const links = [
  { to: "/", label: "Explore", Icon: Compass },
  { to: "/add", label: "Leave Note", Icon: PlusCircle },
  { to: "/saved", label: "Saved", Icon: Bookmark },
  { to: "/profile", label: "Profile", Icon: User },
];
export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const classes = (active: boolean) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${active ? "bg-forest text-[#FAF8F3] shadow-sm" : "text-primaryText hover:text-forest hover:bg-white/50"}`;
  return (
    <>
      <header className="hidden md:flex items-center justify-between px-6 py-3.5 bg-[#FAF8F3]/95 backdrop-blur-md border-b border-[#DED8C7] z-30 sticky top-0 shadow-sm">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 text-left"
        >
          <span className="w-9 h-9 rounded-xl bg-forest flex items-center justify-center">
            <Compass className="w-5 h-5 text-[#C8D3C5]" />
          </span>
          <span>
            <b className="text-xl text-forest font-display">Waypost</b>
            <small className="block text-xs text-secondaryText italic">
              Little notes. Long journeys.
            </small>
          </span>
        </button>
        <nav className="flex items-center gap-1.5 bg-[#EAE4D5]/70 p-1 rounded-2xl border border-[#DED8C7]">
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => classes(isActive)}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </header>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F3]/95 backdrop-blur-lg border-t border-[#DED8C7] px-3 py-1.5 safe-bottom shadow-sheet">
        <div className="flex items-center justify-around">
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-3 ${isActive ? "text-forest font-semibold" : "text-secondaryText"}`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] mt-0.5">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};
