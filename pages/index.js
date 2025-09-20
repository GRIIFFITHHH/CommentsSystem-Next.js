// pages/index.js
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Check session & listen for auth changes
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) setUser(session.user);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  // Fetch comments
  useEffect(() => {
    if (!user) return;

    const fetchComments = async () => {
      const res = await fetch("/api/comments");
      const data = await res.json();
      setComments(data.comments ?? []);
    };

    fetchComments();
  }, [user]);

  // Google login
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) console.error(error.message);
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setComments([]);
  };

  // Add new comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newComment, author: user.email }),
    });

    const data = await res.json();

    if (res.ok) {
      setComments((prev) => [...prev, data.comment]);
      setNewComment("");
    } else {
      console.error(data.error);
    }

    setLoading(false);
  };

  // Render login page
  if (!user) {
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto", textAlign: "center" }}>
        <h1>Please log in to view comments</h1>
        <button onClick={handleGoogleLogin}>Sign in with Google</button>
      </div>
    );
  }

  // Render comments page
  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <p>Logged in as: {user.email}</p>
      <button onClick={handleSignOut}>Sign Out</button>

      <h2>Comments</h2>
      <ul>
        {comments.map((c) => (
          <li key={c.id}>
            <strong>{c.author}</strong>: {c.text}
            <br />
            <small>{new Date(c.created_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "1rem" }}>
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          style={{ width: "80%", padding: "0.5rem" }}
        />
        <button
          onClick={handleAddComment}
          disabled={loading}
          style={{ padding: "0.5rem 1rem" }}
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}
