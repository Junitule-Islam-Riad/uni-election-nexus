import { Vote } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border/50 py-12 px-6">
    <div className="container max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
          <Vote className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <span className="font-bold">UniVote</span>
      </Link>
      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} UniVote. Secure university elections.
      </p>
    </div>
  </footer>
);

export default Footer;
