import chatContext from "./chatContext";
import { useState, useEffect } from "react";
import io from "socket.io-client";

// ------------------------------
// ✅ BACKEND HOST CONFIGURATION
// ------------------------------
const hostName = "https://mern-chat-app-y5vo.onrender.com";

// ✅ Initialize socket connection with fallbacks and CORS support
const socket = io(hostName, {
  transports: ["websocket", "polling"], // allow fallback
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

const ChatState = (props) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [user, setUser] = useState(
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : {}
  );
  const [receiver, setReceiver] = useState({});
  const [messageList, setMessageList] = useState([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [myChatList, setMyChatList] = useState([]);
  const [originalChatList, setOriginalChatList] = useState([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ------------------------------
  // 📡 Fetch all conversations
  // ------------------------------
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${hostName}/conversation/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error("Failed to fetch data: " + err);
      }

      const data = await response.json();
      setMyChatList(data);
      setOriginalChatList(data);
    } catch (error) {
      console.error("❌ Conversation fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------
  // 👤 Fetch logged-in user
  // ------------------------------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${hostName}/auth/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "auth-token": token,
          },
        });

        if (!res.ok) throw new Error("User fetch failed");

        const data = await res.json();
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
        setIsAuthenticated(true);

        // 🟢 Connect socket with user ID
        socket.emit("setup", data._id);
        console.log("✅ Socket setup for user:", data._id);
      } catch (error) {
        console.error("❌ User fetch error:", error);
        setIsAuthenticated(false);
        setUser({});
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    };

    fetchUser();
    fetchData();
  }, []);

  // ------------------------------
  // 🟢 Socket event handlers
  // ------------------------------
  useEffect(() => {
    socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("⚠️ Socket disconnected"));
    socket.on("connect_error", (err) =>
      console.error("❌ Socket error:", err.message)
    );

    socket.on("receiver-online", () => {
      setReceiver((prev) => ({ ...prev, isOnline: true }));
    });

    socket.on("receiver-offline", () => {
      setReceiver((prev) => ({
        ...prev,
        isOnline: false,
        lastSeen: new Date().toISOString(),
      }));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("receiver-online");
      socket.off("receiver-offline");
    };
  }, []);

  // ------------------------------
  // ✅ Return Context Provider
  // ------------------------------
  return (
    <chatContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        receiver,
        setReceiver,
        messageList,
        setMessageList,
        activeChatId,
        setActiveChatId,
        myChatList,
        setMyChatList,
        originalChatList,
        fetchData,
        hostName,
        socket,
        isOtherUserTyping,
        setIsOtherUserTyping,
        isChatLoading,
        setIsChatLoading,
        isLoading,
        setIsLoading,
      }}
    >
      {props.children}
    </chatContext.Provider>
  );
};

export default ChatState;
