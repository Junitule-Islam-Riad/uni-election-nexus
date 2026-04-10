import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Upload, User, MessageSquare, Send, Image, FileText, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Campaign = Tables<"campaigns">;

const CandidatePortal = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [motto, setMotto] = useState("");
  const [manifesto, setManifesto] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<Tables<"candidates"> | null>(null);

  useEffect(() => {
    const load = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("campaigns")
        .select("*")
        .gte("end_time", now)
        .order("start_time");
      setCampaigns(data ?? []);
    };
    load();
  }, []);

  // Check existing submission when campaign changes
  useEffect(() => {
    if (!selectedCampaign || !user) { setExistingSubmission(null); return; }
    const check = async () => {
      const { data } = await supabase
        .from("candidates")
        .select("*")
        .eq("campaign_id", selectedCampaign)
        .eq("user_id", user.id)
        .maybeSingle();
      setExistingSubmission(data);
      if (data) {
        setName(data.name);
        setMotto(data.motto || "");
        setManifesto(data.manifesto || "");
        setPhotoPreview(data.photo_url);
      } else {
        setName(""); setMotto(""); setManifesto(""); setPhotoPreview(null);
      }
    };
    check();
  }, [selectedCampaign, user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!name || !selectedCampaign || !user) return;
    setSubmitting(true);

    let photoUrl = existingSubmission?.photo_url || null;

    // Upload photo if new
    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("candidate-photos")
        .upload(path, photoFile, { upsert: true });
      if (uploadErr) {
        toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("candidate-photos").getPublicUrl(path);
      photoUrl = urlData.publicUrl;
    }

    if (existingSubmission) {
      const { error } = await supabase.from("candidates").update({
        name, motto: motto || null, manifesto: manifesto || null, photo_url: photoUrl, status: "pending",
      }).eq("id", existingSubmission.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Submission updated!", description: "Your updated candidacy is pending review." });
    } else {
      const { error } = await supabase.from("candidates").insert({
        campaign_id: selectedCampaign, user_id: user.id,
        name, motto: motto || null, manifesto: manifesto || null, photo_url: photoUrl,
      });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Candidacy submitted!", description: "Your submission is pending admin review." });
    }
    setSubmitting(false);
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] px-6 py-12">
        <div className="container max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Candidate Portal</h1>
            <p className="text-muted-foreground">Submit your candidacy for an active campaign</p>
          </motion.div>

          {existingSubmission && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 mb-6 border-primary/20">
              <p className="text-sm">
                Status: <span className={`font-semibold ${existingSubmission.status === "approved" ? "text-primary" : existingSubmission.status === "rejected" ? "text-destructive" : "text-muted-foreground"}`}>
                  {existingSubmission.status.charAt(0).toUpperCase() + existingSubmission.status.slice(1)}
                </span>
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-xl p-6 space-y-6"
          >
            {/* Campaign select */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Campaign</label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
              >
                <option value="">Select a campaign...</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Photo upload */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Profile Photo</label>
              <label className="w-32 h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-colors flex flex-col items-center justify-center cursor-pointer bg-secondary/30 group overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Image className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-1" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>

            {/* Name */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name"
                  className="w-full bg-secondary/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
            </div>

            {/* Motto */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Election Motto</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={motto} onChange={(e) => setMotto(e.target.value)} placeholder="Your election motto"
                  className="w-full bg-secondary/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
            </div>

            {/* Manifesto */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Manifesto</label>
              <textarea value={manifesto} onChange={(e) => setManifesto(e.target.value)}
                placeholder="Tell voters about your vision and qualifications..."
                rows={4}
                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none" />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !name || !selectedCampaign}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm neon-glow hover:shadow-neon-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {existingSubmission ? "Update Submission" : "Submit Candidacy"}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Your submission will be reviewed by an admin before appearing publicly
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default CandidatePortal;
