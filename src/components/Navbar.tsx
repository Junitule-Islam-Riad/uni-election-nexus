import { useState } from "react";
import { motion } from "framer-motion";
import { Vote, Menu, X, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const navItems = [
    { label: "Campaigns", href: "/campaigns" },
    ...(isAdmin ? [{ label: "Admin", href: "/admin" }] : []),
    { label: "Candidate Portal", href: "/candidate" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Vote className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">UniVote</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.href
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:shadow-neon-sm transition-all"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass-card border-t border-border/50 px-6 py-4 space-y-2"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={() => { handleSignOut(); setOpen(false); }}
              className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign Out
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="block text-center px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground"
            >
              Sign In
            </Link>
          )}
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
