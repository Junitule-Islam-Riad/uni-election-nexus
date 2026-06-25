import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, ThumbsUp, PartyPopper, Lightbulb, MessageCircle, Image as ImageIcon,
  Video, BarChart3, Send, Loader2, X, Plus, Trash2, ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

type Reaction = "like" | "love" | "celebrate" | "insightful";

const REACTIONS: { key: Reaction; icon: any; label: string; color: string }[] = [
  { key: "like", icon: ThumbsUp, label: "Like", color: "text-blue-400" },
  { key: "love", icon: Heart, label: "Love", color: "text-rose-400" },
  { key: "celebrate", icon: PartyPopper, label: "Celebrate", color: "text-yellow-400" },
  { key: "insightful", icon: Lightbulb, label: "Insightful", color: "text-primary" },
];

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
  poll_options: string[] | null;
  created_at: string;
  author?: { display_name: string | null; avatar_url: string | null };
  reactions?: { reaction: Reaction; user_id: string }[];
  comments?: { id: string; user_id: string; content: string; created_at: string; author?: any }[];
  poll_votes?: { user_id: string; option_index: number }[];
}

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
        <Link to="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  if (!approved) {
    return (
      <div className="glass-card hud-border rounded-xl p-6 text-center">
        <p className="text-muted-foreground">
          Your community access is <span className="text-primary font-semibold">pending admin approval</span>.
          You can still react and comment on posts.
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
          <div className="font-semibold text-sm">{post.author?.display_name ?? "PCIU Member"}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(post.created_at).toLocaleString()}
          </div>
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
                {voted && (
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/20"
                    style={{ width: `${pct}%` }}
                  />
                )}
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

      <div className="flex items-center gap-1 pt-3 border-t border-border/40">
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
              <div key={c.id} className="flex gap-2 text-sm">
                <div className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center text-xs flex-shrink-0">
                  {(c.author?.display_name ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="bg-muted/30 rounded-lg px-3 py-1.5 flex-1">
                  <div className="text-xs font-medium">{c.author?.display_name ?? "User"}</div>
                  <div>{c.content}</div>
                </div>
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

const CommunitySection = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [approved, setApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!postsData) { setPosts([]); setLoading(false); return; }

    const userIds = Array.from(new Set(postsData.map((p) => p.user_id)));
    const postIds = postsData.map((p) => p.id);

    const [{ data: profilesData }, { data: reactionsData }, { data: commentsData }, { data: pollsData }] =
      await Promise.all([
        supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
        supabase.from("post_reactions").select("post_id, user_id, reaction").in("post_id", postIds.length ? postIds : ["00000000-0000-0000-0000-000000000000"]),
        supabase.from("post_comments").select("id, post_id, user_id, content, created_at").in("post_id", postIds.length ? postIds : ["00000000-0000-0000-0000-000000000000"]).order("created_at"),
        supabase.from("poll_votes").select("post_id, user_id, option_index").in("post_id", postIds.length ? postIds : ["00000000-0000-0000-0000-000000000000"]),
      ]);

    const commenterIds = Array.from(new Set((commentsData ?? []).map((c) => c.user_id)));
    const allUserIds = Array.from(new Set([...userIds, ...commenterIds]));
    const { data: allProfiles } = await supabase.from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", allUserIds.length ? allUserIds : ["00000000-0000-0000-0000-000000000000"]);
    const profById = Object.fromEntries((allProfiles ?? []).map((p) => [p.user_id, p]));

    const merged: Post[] = postsData.map((p: any) => ({
      ...p,
      author: profById[p.user_id],
      reactions: (reactionsData ?? []).filter((r) => r.post_id === p.id) as any,
      comments: (commentsData ?? [])
        .filter((c) => c.post_id === p.id)
        .map((c) => ({ ...c, author: profById[c.user_id] })),
      poll_votes: (pollsData ?? []).filter((v) => v.post_id === p.id),
    }));
    setPosts(merged);
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
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!user) { setApproved(false); return; }
    supabase.from("profiles").select("community_status").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setApproved(data?.community_status === "approved"));
  }, [user]);

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
            Share thoughts, polls, photos & videos with the entire campus.
          </p>
        </div>

        <div className="mb-6">
          <Composer onPosted={load} approved={approved} />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-card rounded-xl p-10 text-center text-muted-foreground">
            No posts yet. Be the first to share!
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((p) => <PostCard key={p.id} post={p} onChange={load} />)}
          </div>
        )}
      </div>
    </section>
  );
};

export default CommunitySection;
