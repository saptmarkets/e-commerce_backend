import { getSession } from "next-auth/react";

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (session) {
    return res.status(200).json({
      authenticated: true,
      session: session
    });
  }
  
  return res.status(200).json({
    authenticated: false,
    message: "No active session found"
  });
} 