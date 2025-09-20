// pages/api/comments.js
import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // fetch all comments
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ comments: data });
  }

  if (req.method === "POST") {
    const { text, author } = req.body;

    if (!author || !text) {
      return res.status(400).json({ error: "Missing author or text" });
    }

    const { data, error } = await supabase
      .from("comments")
      .insert([{ text, author }])
      .select();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ comment: data[0] });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
