// pages/index.js
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import styles from "../pages/Home.module.css";

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
      try {
        const res = await fetch("/api/comments");
        const data = await res.json();
        setComments(data.comments ?? []);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    fetchComments();
  }, [user]);

  // Google login
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Login error:", error.message);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setComments([]);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Add new comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);

    try {
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
        throw new Error(data.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press in input
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleAddComment();
    }
  };

  // Get user initials for avatar
  const getUserInitials = (email) => {
    if (!email) return "?";
    const name = email.split("@")[0];
    return name.slice(0, 2).toUpperCase();
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Render login page
  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.loginCard}>
          <div className={styles.loginIcon}>💬</div>
          <h1 className={styles.title}>Welcome to Comments</h1>
          <p className={styles.subtitle}>
            Sign in to join the conversation and share your thoughts.
          </p>
          <button className={styles.loginButton} onClick={handleGoogleLogin}>
            <svg className={styles.googleIcon} viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  // Render comments page
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>{getUserInitials(user.email)}</div>
          <div className={styles.userDetails}>
            <span className={styles.userEmail}>{user.email}</span>
            <span className={styles.userStatus}>Online</span>
          </div>
        </div>
        <button className={styles.signOutButton} onClick={handleSignOut}>
          Sign Out
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.titleSection}>
          <h1 className={styles.commentsTitle}>
            Discussion
            <span className={styles.commentCount}>
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </span>
          </h1>
        </div>

        <div className={styles.commentForm}>
          <div className={styles.inputContainer}>
            <div className={styles.commentAvatar}>
              {getUserInitials(user.email)}
            </div>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts..."
              className={styles.commentInput}
              disabled={loading}
            />
          </div>
          <button
            onClick={handleAddComment}
            disabled={loading || !newComment.trim()}
            className={`${styles.postButton} ${loading ? styles.loading : ""}`}
          >
            {loading ? (
              <>
                <div className={styles.spinner}></div>
                Posting...
              </>
            ) : (
              <>Post Comment</>
            )}
          </button>
        </div>

        <div className={styles.commentsList}>
          {comments.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💭</div>
              <h3>No comments yet</h3>
              <p>Be the first to share your thoughts.</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className={styles.commentCard}>
                <div className={styles.commentHeader}>
                  <div className={styles.commentAvatar}>
                    {getUserInitials(comment.author)}
                  </div>
                  <div className={styles.commentMeta}>
                    <div className={styles.commentAuthor}>
                      {comment.author}
                      {comment.author === user.email && (
                        <span className={styles.youBadge}>You</span>
                      )}
                    </div>
                    <div className={styles.commentDate}>
                      {formatRelativeTime(comment.created_at)}
                    </div>
                  </div>
                </div>

                <div className={styles.commentContent}>
                  <p className={styles.commentText}>{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
