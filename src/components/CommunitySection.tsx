import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, ThumbsUp, PartyPopper, Lightbulb, MessageCircle, Image as ImageIcon,
  Video, BarChart3, Send, Loader2, X, Plus, Trash2, Share2, Calendar,
  MapPin, Link2, Newspaper, CalendarPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";

type Reaction = "like" | "love" | "celebrate" | "insightful";

const REACTIONS: { key: Reaction; icon: any; label: string; color: string }[] = [
  { key: "like", icon: ThumbsUp, label: "Like", color: "text-blue-400" },
  { key: "love", icon: Heart, label: "Love", color: "text-rose-400" },
  { key: "celebrate", icon: PartyPopper, label: "Celebrate", color: "text-yellow-400" },
  { key: "insightful", icon: Lightbulb, label: "Insightful", color: "text-primary" },
];

interface EventRow {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  category: string;
  cover_image: string | null;
  campaign_id: string | null;
  author?: { display_name: string | null };
  campaign?: { id: string; title: string } | null;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
  poll_options: string[] | null;
  shared_post_id: string | null;
  shared_event_id: string | null;
  created_at: string;
  author?: { display_name: string | null; avatar_url: string | null };
  reactions?: { reaction: Reaction; user_id: string }[];
  comments?: { id: string; user_id: string; content: string; created_at: string; author?: any }[];
  poll_votes?: { user_id: string; option_index: number }[];
  shared_post?: Post | null;
  shared_event?: EventRow | null;
}

/* -------------------------------------------------- */
/* Composer                                           */
/* -------------------------------------------------- */
const Composer = ({ onPosted, approved }: { onPosted: () => void; approved: boolean }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pollOpts, setPollOpts] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <div className="glass-card hud-border rounded-xl p-6 text-center">
        <p className="text-muted-foreground mb-3">Sign in to share with the PCIU community.</p>
        <Link to="/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  if (!approved) {
    return (
      <div className="glass-card hud-border rounded-xl p-6 text-center">
        <p className="text-muted-foreground">
          Your community access is <span className="text-primary font-semibold">pending admin approval</span>.
          You can still react, comment, and reshare.
        </p>
      </div>
    );
  }

  const submit = async () => {
    if (!content.trim() && !file && !pollOpts) return;
    setBusy(true);
    try {
      let media_url: string | null = null;
      let media_type: "image" | "video" | null = null;
      if (file) {
        media_type = file.type.startsWith("video") ? "video" : "image";
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("community-media").upload(path, file);
        if (upErr) throw upErr;
        media_url = supabase.storage.from("community-media").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: content.trim(),
        media_url, media_type,
        poll_options: pollOpts && pollOpts.filter(Boolean).length >= 2 ? pollOpts.filter(Boolean) : null,
      });
      if (error) throw error;
      setContent(""); setFile(null); setPollOpts(null);
      toast.success("Post shared!");
      onPosted();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-card hud-border rounded-xl p-5">
      <Textarea
        placeholder="Share something with PCIU..."
        value={content}
        maxLength={2000}
        onChange={(e) => setContent(e.target.value)}
        className="bg-transparent border-border/50 mb-3 min-h-[80px]"
      />
      {file && (
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 px-2 py-1 rounded bg-muted/30">
          <span className="truncate">{file.name}</span>
          <button onClick={() => setFile(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {pollOpts && (
        <div className="space-y-2 mb-3">
          {pollOpts.map((opt, i) => (
            <Input
              key={i}
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={(e) => {
                const next = [...pollOpts]; next[i] = e.target.value; setPollOpts(next);
              }}
              maxLength={80}
            />
          ))}
          <div className="flex gap-2">
            {pollOpts.length < 5 && (
              <Button type="button" size="sm" variant="outline" onClick={() => setPollOpts([...pollOpts, ""])}>
                <Plus className="w-3 h-3" /> Option
              </Button>
            )}
            <Button type="button" size="sm" variant="ghost" onClick={() => setPollOpts(null)}>Remove poll</Button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <label className="cursor-pointer p-2 rounded hover:bg-muted/40">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
            <input type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <label className="cursor-pointer p-2 rounded hover:bg-muted/40">
            <Video className="w-4 h-4 text-muted-foreground" />
            <input type="file" accept="video/*" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <button
            type="button"
            className="p-2 rounded hover:bg-muted/40"
            onClick={() => setPollOpts(pollOpts ? null : ["", ""])}
          >
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <Button onClick={submit} disabled={busy} className="neon-glow">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Post
        </Button>
      </div>
    </div>
  );
};

/* -------------------------------------------------- */
/* Reshare dialog                                     */
/* -------------------------------------------------- */
const ReshareDialog = ({
  postId, eventId, onDone,
}: { postId?: string; eventId?: string; onDone: () => void }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [thought, setThought] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return toast.error("Sign in to reshare");
    setBusy(true);
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      content: thought.trim(),
      shared_post_id: postId ?? null,
      shared_event_id: eventId ?? null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Reshared to your feed");
    setThought(""); setOpen(false); onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted/40 transition">
          <Share2 className="w-4 h-4" /> Share
        </button>
      </DialogTrigger>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>Reshare to your feed</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Add a thought (optional)..."
          value={thought}
          maxLength={500}
          onChange={(e) => setThought(e.target.value)}
          className="min-h-[80px]"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy} className="neon-glow">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------------------------------- */
/* Event composer + card                              */
/* -------------------------------------------------- */
const EventComposer = ({
  campaigns, approved, onCreated,
}: { campaigns: { id: string; title: string }[]; approved: boolean; onCreated: () => void }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("program");
  const [campaignId, setCampaignId] = useState<string>("none");
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const submit = async () => {
    if (!title.trim() || !date) return toast.error("Title and date are required");
    if (!approved) return toast.error("Your community access is pending approval");
    setBusy(true);
    const { error } = await supabase.from("events").insert({
      created_by: user.id,
      title: title.trim(),
      description: description.trim() || null,
      event_date: new Date(date).toISOString(),
      end_date: endDate ? new Date(endDate).toISOString() : null,
      location: location.trim() || null,
      category,
      campaign_id: campaignId !== "none" ? campaignId : null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Event created!");
    setTitle(""); setDescription(""); setDate(""); setEndDate("");
    setLocation(""); setCategory("program"); setCampaignId("none");
    setOpen(false); onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="neon-glow w-full">
          <CalendarPlus className="w-4 h-4" /> Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card max-w-lg">
        <DialogHeader><DialogTitle>Create a community event</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          <Textarea placeholder="What's it about?" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Starts</label>
              <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Ends (optional)</label>
              <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <Input placeholder="Location (e.g. PCIU Auditorium)" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="election">Election</SelectItem>
                <SelectItem value="program">Uni Program</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="career">Career</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger><SelectValue placeholder="Link election (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No election link</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy} className="neon-glow">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const categoryStyles: Record<string, string> = {
  election: "bg-primary/15 text-primary border-primary/30",
  program: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  cultural: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  career: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  workshop: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  general: "bg-muted/30 text-muted-foreground border-border/40",
};

const EventCard = ({
  event, compact = false, onChange,
}: { event: EventRow; compact?: boolean; onChange?: () => void }) => {
  const { user, isAdmin, isModerator } = useAuth();
  const canDelete = !!user && (event.created_by === user.id || isAdmin || isModerator);
  const date = new Date(event.event_date);
  const day = date.toLocaleDateString(undefined, { day: "2-digit" });
  const month = date.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  const remove = async () => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    if (error) return toast.error(error.message);
    toast.success("Event removed");
    onChange?.();
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card hud-border rounded-xl p-4 ${compact ? "" : "p-5"}`}
    >
      <div className="flex gap-4">
        <div className="flex flex-col items-center justify-center w-16 shrink-0 rounded-lg border border-primary/30 bg-primary/10 px-2 py-3 text-center">
          <div className="text-[10px] tracking-widest text-primary font-mono">{month}</div>
          <div className="text-2xl font-black leading-none">{day}</div>
          <div className="text-[10px] text-muted-foreground mt-1">{time}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${categoryStyles[event.category] ?? categoryStyles.general}`}>
              {event.category}
            </span>
            {event.campaign && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-primary/40 text-primary bg-primary/5">
                Election linked
              </span>
            )}
          </div>
          <h3 className="font-bold text-base leading-snug">{event.title}</h3>
          {event.description && !compact && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{event.description}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
            {event.location && (
              <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
            )}
            {event.author?.display_name && (
              <span className="inline-flex items-center gap-1">by {event.author.display_name}</span>
            )}
          </div>
          {!compact && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
              {event.campaign && (
                <Link
                  to={`/campaign/${event.campaign.id}`}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Link2 className="w-3 h-3" /> Go to election
                </Link>
              )}
              {onChange && <ReshareDialog eventId={event.id} onDone={onChange} />}
              {canDelete && (
                <button
                  onClick={remove}
                  className="ml-auto p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Delete event"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
};

/* -------------------------------------------------- */
/* Post card                                          */
/* -------------------------------------------------- */
const PostCard = ({ post, onChange }: { post: Post; onChange: () => void }) => {
  const { user, isAdmin, isModerator } = useAuth();
  const canModerate = isAdmin || isModerator;
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  const myReaction = post.reactions?.find((r) => r.user_id === user?.id)?.reaction;
  const myPollVote = post.poll_votes?.find((v) => v.user_id === user?.id)?.option_index;
  const totalPollVotes = post.poll_votes?.length ?? 0;

  const react = async (key: Reaction) => {
    if (!user) return toast.error("Sign in to react");
    if (myReaction === key) {
      await supabase.from("post_reactions").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else if (myReaction) {
      await supabase.from("post_reactions").update({ reaction: key }).eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await supabase.from("post_reactions").insert({ post_id: post.id, user_id: user.id, reaction: key });
    }
    onChange();
  };

  const addComment = async () => {
    if (!user || !comment.trim()) return;
    const { error } = await supabase.from("post_comments").insert({
      post_id: post.id, user_id: user.id, content: comment.trim(),
    });
    if (error) return toast.error(error.message);
    setComment(""); onChange();
  };

  const votePoll = async (idx: number) => {
    if (!user) return toast.error("Sign in to vote");
    if (myPollVote !== undefined) return;
    const { error } = await supabase.from("poll_votes").insert({
      post_id: post.id, user_id: user.id, option_index: idx,
    });
    if (error) return toast.error(error.message);
    onChange();
  };

  const initials = (post.author?.display_name ?? "P").slice(0, 2).toUpperCase();

  const deletePost = async () => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) return toast.error(error.message);
    toast.success("Post removed");
    onChange();
  };

  const deleteComment = async (id: string) => {
    const { error } = await supabase.from("post_comments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChange();
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card hud-border rounded-xl p-5"
    >
      <header className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm flex items-center gap-1.5">
            {post.author?.display_name ?? "PCIU Member"}
            {(post.shared_post_id || post.shared_event_id) && (
              <span className="inline-flex items-center gap-1 text-[10px] font-normal text-muted-foreground">
                <Share2 className="w-3 h-3" /> reshared
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleString()}</div>
        </div>
        {canModerate && (
          <button
            onClick={deletePost}
            title="Remove post (moderator)"
            className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </header>

      {post.content && <p className="text-foreground whitespace-pre-wrap mb-3">{post.content}</p>}

      {post.media_url && post.media_type === "image" && (
        <img src={post.media_url} alt="post" className="rounded-lg w-full max-h-[500px] object-cover mb-3" />
      )}
      {post.media_url && post.media_type === "video" && (
        <video src={post.media_url} controls className="rounded-lg w-full max-h-[500px] mb-3" />
      )}

      {/* Shared event */}
      {post.shared_event && (
        <div className="mb-3">
          <EventCard event={post.shared_event} compact />
        </div>
      )}

      {/* Shared post */}
      {post.shared_post && (
        <div className="mb-3 rounded-xl border border-border/50 bg-muted/10 p-4">
          <div className="text-xs text-muted-foreground mb-1">
            {post.shared_post.author?.display_name ?? "PCIU Member"} ·{" "}
            {new Date(post.shared_post.created_at).toLocaleDateString()}
          </div>
          {post.shared_post.content && (
            <p className="text-sm whitespace-pre-wrap line-clamp-4">{post.shared_post.content}</p>
          )}
          {post.shared_post.media_url && post.shared_post.media_type === "image" && (
            <img src={post.shared_post.media_url} alt="" className="rounded-md w-full max-h-[260px] object-cover mt-2" />
          )}
        </div>
      )}
      {post.shared_post_id && !post.shared_post && (
        <div className="mb-3 rounded-xl border border-dashed border-border/50 p-3 text-xs text-muted-foreground">
          Original post is no longer available.
        </div>
      )}

      {post.poll_options && (
        <div className="space-y-2 mb-3">
          {post.poll_options.map((opt, i) => {
            const count = post.poll_votes?.filter((v) => v.option_index === i).length ?? 0;
            const pct = totalPollVotes ? Math.round((count / totalPollVotes) * 100) : 0;
            const voted = myPollVote !== undefined;
            return (
              <button
                key={i}
                onClick={() => votePoll(i)}
                disabled={voted}
                className={`relative w-full text-left rounded-lg border px-4 py-2.5 overflow-hidden transition ${
                  myPollVote === i ? "border-primary" : "border-border/50 hover:border-primary/40"
                }`}
              >
                {voted && <div className="absolute inset-y-0 left-0 bg-primary/20" style={{ width: `${pct}%` }} />}
                <div className="relative flex justify-between items-center text-sm">
                  <span>{opt}</span>
                  {voted && <span className="text-xs text-muted-foreground">{pct}% · {count}</span>}
                </div>
              </button>
            );
          })}
          <p className="text-xs text-muted-foreground">{totalPollVotes} vote{totalPollVotes !== 1 && "s"}</p>
        </div>
      )}

      <div className="flex items-center gap-1 pt-3 border-t border-border/40 flex-wrap">
        {REACTIONS.map(({ key, icon: Icon, color }) => {
          const count = post.reactions?.filter((r) => r.reaction === key).length ?? 0;
          const active = myReaction === key;
          return (
            <button
              key={key}
              onClick={() => react(key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs hover:bg-muted/40 transition ${
                active ? color : "text-muted-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}
        <ReshareDialog postId={post.id} onDone={onChange} />
        <button
          onClick={() => setShowComments((s) => !s)}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted/40"
        >
          <MessageCircle className="w-4 h-4" />
          {post.comments?.length ?? 0}
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-3 space-y-2"
          >
            {post.comments?.map((c) => (
              <div key={c.id} className="flex gap-2 text-sm group/comment">
                <div className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center text-xs flex-shrink-0">
                  {(c.author?.display_name ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="bg-muted/30 rounded-lg px-3 py-1.5 flex-1">
                  <div className="text-xs font-medium">{c.author?.display_name ?? "User"}</div>
                  <div>{c.content}</div>
                </div>
                {canModerate && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    title="Remove comment"
                    className="opacity-0 group-hover/comment:opacity-100 p-1 text-muted-foreground hover:text-destructive transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {user && (
              <div className="flex gap-2 pt-2">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComment()}
                  placeholder="Write a comment..."
                  maxLength={500}
                />
                <Button size="sm" onClick={addComment}><Send className="w-4 h-4" /></Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

/* -------------------------------------------------- */
/* Section                                            */
/* -------------------------------------------------- */
const CommunitySection = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"feed" | "events">("feed");
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string; title: string }[]>([]);
  const [approved, setApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: postsData }, { data: eventsData }, { data: campaignsData }] = await Promise.all([
      supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("events").select("*").order("event_date", { ascending: true }).limit(30),
      supabase.from("campaigns").select("id, title").order("end_time", { ascending: false }).limit(30),
    ]);
    setCampaigns(campaignsData ?? []);

    const list = postsData ?? [];
    const sharedPostIds = list.map((p) => p.shared_post_id).filter(Boolean) as string[];
    const sharedEventIds = list.map((p) => p.shared_event_id).filter(Boolean) as string[];

    const { data: sharedPosts } = sharedPostIds.length
      ? await supabase.from("posts").select("*").in("id", sharedPostIds)
      : { data: [] as any[] };
    const { data: sharedEvents } = sharedEventIds.length
      ? await supabase.from("events").select("*").in("id", sharedEventIds)
      : { data: [] as any[] };

    const allEventIds = Array.from(new Set([...(eventsData ?? []).map((e) => e.id), ...((sharedEvents ?? []).map((e: any) => e.id))]));
    const allCampaignIds = Array.from(new Set([
      ...((eventsData ?? []).map((e) => e.campaign_id).filter(Boolean) as string[]),
      ...((sharedEvents ?? []).map((e: any) => e.campaign_id).filter(Boolean) as string[]),
    ]));
    const { data: linkedCampaigns } = allCampaignIds.length
      ? await supabase.from("campaigns").select("id, title").in("id", allCampaignIds)
      : { data: [] as any[] };
    const campaignById = Object.fromEntries((linkedCampaigns ?? []).map((c: any) => [c.id, c]));

    const userIds = Array.from(new Set([
      ...list.map((p) => p.user_id),
      ...(sharedPosts ?? []).map((p: any) => p.user_id),
      ...(eventsData ?? []).map((e) => e.created_by),
      ...(sharedEvents ?? []).map((e: any) => e.created_by),
    ]));
    const postIds = list.map((p) => p.id);
    const fakeId = "00000000-0000-0000-0000-000000000000";

    const [{ data: reactionsData }, { data: commentsData }, { data: pollsData }] = await Promise.all([
      supabase.from("post_reactions").select("post_id, user_id, reaction").in("post_id", postIds.length ? postIds : [fakeId]),
      supabase.from("post_comments").select("id, post_id, user_id, content, created_at").in("post_id", postIds.length ? postIds : [fakeId]).order("created_at"),
      supabase.from("poll_votes").select("post_id, user_id, option_index").in("post_id", postIds.length ? postIds : [fakeId]),
    ]);

    const commenterIds = (commentsData ?? []).map((c) => c.user_id);
    const allUserIds = Array.from(new Set([...userIds, ...commenterIds]));
    const { data: allProfiles } = await supabase.from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", allUserIds.length ? allUserIds : [fakeId]);
    const profById = Object.fromEntries((allProfiles ?? []).map((p) => [p.user_id, p]));

    const sharedPostById = Object.fromEntries((sharedPosts ?? []).map((p: any) => [
      p.id, { ...p, author: profById[p.user_id] },
    ]));
    const sharedEventById = Object.fromEntries((sharedEvents ?? []).map((e: any) => [
      e.id, { ...e, author: profById[e.created_by], campaign: e.campaign_id ? campaignById[e.campaign_id] : null },
    ]));

    const mergedPosts: Post[] = list.map((p: any) => ({
      ...p,
      author: profById[p.user_id],
      reactions: (reactionsData ?? []).filter((r) => r.post_id === p.id) as any,
      comments: (commentsData ?? [])
        .filter((c) => c.post_id === p.id)
        .map((c) => ({ ...c, author: profById[c.user_id] })),
      poll_votes: (pollsData ?? []).filter((v) => v.post_id === p.id),
      shared_post: p.shared_post_id ? sharedPostById[p.shared_post_id] ?? null : null,
      shared_event: p.shared_event_id ? sharedEventById[p.shared_event_id] ?? null : null,
    }));

    const mergedEvents: EventRow[] = (eventsData ?? []).map((e: any) => ({
      ...e,
      author: profById[e.created_by],
      campaign: e.campaign_id ? campaignById[e.campaign_id] : null,
    }));

    setPosts(mergedPosts);
    setEvents(mergedEvents);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("community-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_reactions" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_comments" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!user) { setApproved(false); return; }
    supabase.from("profiles").select("community_status").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setApproved(data?.community_status === "approved"));
  }, [user]);

  const upcomingEvents = useMemo(
    () => events.filter((e) => new Date(e.event_date) >= new Date(Date.now() - 1000 * 60 * 60 * 12)),
    [events]
  );

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="container max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <span className="text-xs font-mono uppercase tracking-widest text-primary">// Community</span>
          <h2 className="text-3xl sm:text-5xl font-black mt-2 mb-3">
            PCIU <span className="text-primary neon-text">Social Hub</span>
          </h2>
          <p className="text-muted-foreground">
            Share thoughts, host events, and rally classmates around upcoming elections.
          </p>
        </div>

        <div className="flex items-center gap-2 mb-6 p-1 rounded-xl border border-border/40 bg-muted/10 w-fit mx-auto">
          <button
            onClick={() => setTab("feed")}
            className={`inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider px-4 py-2 rounded-lg transition ${
              tab === "feed" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" /> Feed
          </button>
          <button
            onClick={() => setTab("events")}
            className={`inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider px-4 py-2 rounded-lg transition ${
              tab === "events" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Events ({upcomingEvents.length})
          </button>
        </div>

        {tab === "feed" ? (
          <>
            <div className="mb-6">
              <Composer onPosted={load} approved={approved} />
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : posts.length === 0 ? (
              <div className="glass-card rounded-xl p-10 text-center text-muted-foreground">
                No posts yet. Be the first to share!
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((p) => <PostCard key={p.id} post={p} onChange={load} />)}
              </div>
            )}
          </>
        ) : (
          <>
            {user && (
              <div className="mb-6">
                <EventComposer campaigns={campaigns} approved={approved} onCreated={load} />
              </div>
            )}
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : upcomingEvents.length === 0 ? (
              <div className="glass-card rounded-xl p-10 text-center text-muted-foreground">
                No upcoming events. Be the first to create one!
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((e) => <EventCard key={e.id} event={e} onChange={load} />)}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default CommunitySection;
