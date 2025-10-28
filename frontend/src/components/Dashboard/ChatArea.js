import React, { useState, useEffect, useContext } from "react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import Lottie from "react-lottie";
import animationdata from "../../typingAnimation.json";
import {
  Box,
  InputGroup,
  Input,
  Text,
  InputRightElement,
  Button,
  FormControl,
  InputLeftElement,
  useToast,
  useDisclosure,
} from "@chakra-ui/react";
import { FaFileUpload } from "react-icons/fa";
import { marked } from "marked";

import chatContext from "../../context/chatContext";
import ChatAreaTop from "./ChatAreaTop";
import FileUploadModal from "../miscellaneous/FileUploadModal";
import ChatLoadingSpinner from "../miscellaneous/ChatLoadingSpinner";
import axios from "axios";
import SingleMessage from "./SingleMessage";

const scrollbarconfig = {
  "&::-webkit-scrollbar": { width: "5px", height: "5px" },
  "&::-webkit-scrollbar-thumb": { backgroundColor: "gray.300", borderRadius: "5px" },
  "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "gray.400" },
  "&::-webkit-scrollbar-track": { display: "none" },
};

const markdownToHtml = (markdownText) => ({ __html: marked(markdownText) });

export const ChatArea = () => {
  const context = useContext(chatContext);
  const {
    hostName,
    user,
    receiver,
    socket,
    activeChatId,
    messageList,
    setMessageList,
    isOtherUserTyping,
    setIsOtherUserTyping,
    setActiveChatId,
    setReceiver,
    setMyChatList,
    myChatList,
    isChatLoading,
  } = context;

  const [typing, setTyping] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationdata,
    rendererSettings: { preserveAspectRatio: "xMidYMid slice" },
  };

  // ✅ Properly handle popstate listener (cleanup added)
  useEffect(() => {
    const handlePopState = () => {
      if (socket) {
        socket.emit("leave-chat", activeChatId);
      }
      setActiveChatId("");
      setMessageList([]);
      setReceiver({});
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [socket, activeChatId, setActiveChatId, setMessageList, setReceiver]);

  // ✅ Socket event listeners
  useEffect(() => {
    if (!socket || !user?._id) return;

    const handleUserJoined = (userId) => {
      setMessageList((prevList) =>
        prevList.map((msg) => {
          if (msg.senderId === user._id && userId !== user._id) {
            const alreadySeen = msg.seenBy.some((s) => s.user === userId);
            if (!alreadySeen) {
              return {
                ...msg,
                seenBy: [...msg.seenBy, { user: userId, seenAt: new Date() }],
              };
            }
          }
          return msg;
        })
      );
    };

    const handleTyping = (data) => {
      if (data.typer !== user._id) setIsOtherUserTyping(true);
    };

    const handleStopTyping = (data) => {
      if (data.typer !== user._id) setIsOtherUserTyping(false);
    };

    const handleReceiveMessage = (data) => {
      setMessageList((prev) => [...prev, data]);
      setTimeout(() => {
        document.getElementById("chat-box")?.scrollTo({
          top: document.getElementById("chat-box").scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    };

    const handleDeleteMessage = ({ messageId }) => {
      setMessageList((prev) => prev.filter((msg) => msg._id !== messageId));
    };

    socket.on("user-joined-room", handleUserJoined);
    socket.on("typing", handleTyping);
    socket.on("stop-typing", handleStopTyping);
    socket.on("receive-message", handleReceiveMessage);
    socket.on("message-deleted", handleDeleteMessage);

    return () => {
      socket.off("user-joined-room", handleUserJoined);
      socket.off("typing", handleTyping);
      socket.off("stop-typing", handleStopTyping);
      socket.off("receive-message", handleReceiveMessage);
      socket.off("message-deleted", handleDeleteMessage);
    };
  }, [socket, user, setMessageList, setIsOtherUserTyping]);

  // ✅ Handle typing event
  const handleTypingEvent = () => {
    const input = document.getElementById("new-message");
    if (!input || !socket || !user) return;

    if (input.value === "" && typing) {
      setTyping(false);
      socket.emit("stop-typing", { typer: user._id, conversationId: activeChatId });
    } else if (input.value !== "" && !typing) {
      setTyping(true);
      socket.emit("typing", { typer: user._id, conversationId: activeChatId });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSendMessage(e);
  };

  // ✅ AWS S3 Presigned URL fetch
  const getPreSignedUrl = async (fileName, fileType) => {
    if (!fileName || !fileType) return;
    try {
      const response = await fetch(
        `${hostName}/user/presigned-url?filename=${fileName}&filetype=${fileType}`,
        {
          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem("token"),
          },
        }
      );

      if (!response.ok) throw new Error("Failed to get pre-signed URL");
      return await response.json();
    } catch (error) {
      toast({
        title: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // ✅ Send message (text or file)
  const handleSendMessage = async (e, messageText, file) => {
    e.preventDefault();
    if (!socket || !user) return;

    const awsHost = "https://conversa-chat.s3.ap-south-1.amazonaws.com/";
    messageText = messageText || document.getElementById("new-message")?.value || "";

    socket.emit("stop-typing", { typer: user._id, conversationId: activeChatId });

    if (!messageText && !file) {
      toast({
        title: "Message cannot be empty",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    let key;
    if (file) {
      try {
        const { url, fields } = await getPreSignedUrl(file.name, file.type);
        const formData = new FormData();
        Object.entries({ ...fields, file }).forEach(([k, v]) => formData.append(k, v));
        const res = await axios.post(url, formData, { headers: { "Content-Type": "multipart/form-data" } });
        if (res.status !== 201) throw new Error("File upload failed");
        key = fields.key;
      } catch (error) {
        toast({ title: error.message, status: "error", duration: 3000, isClosable: true });
        return;
      }
    }

    const msgData = {
      text: messageText,
      conversationId: activeChatId,
      senderId: user._id,
      imageUrl: file ? `${awsHost}${key}` : null,
    };

    socket.emit("send-message", msgData);

    const inputElem = document.getElementById("new-message");
    if (inputElem) inputElem.value = "";

    setTimeout(() => {
      document.getElementById("chat-box")?.scrollTo({
        top: document.getElementById("chat-box").scrollHeight,
        behavior: "smooth",
      });
    }, 100);

    // ✅ Sort updated chat list safely
    setMyChatList(
      [...myChatList]
        .map((chat) =>
          chat._id === activeChatId
            ? { ...chat, latestmessage: messageText, updatedAt: new Date().toUTCString() }
            : chat
        )
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );
  };

  const removeMessageFromList = (messageId) => {
    setMessageList((prev) => prev.filter((msg) => msg._id !== messageId));
  };

  return (
    <>
      {activeChatId ? (
        <>
          <Box justifyContent="space-between" h="100%" w={{ base: "100vw", md: "100%" }}>
            <ChatAreaTop />
            {isChatLoading && <ChatLoadingSpinner />}

            <Box id="chat-box" h="85%" overflowY="auto" sx={scrollbarconfig} mt={1} mx={1}>
              {messageList?.map(
                (msg) =>
                  !msg.deletedby?.includes(user._id) && (
                    <SingleMessage
                      key={msg._id}
                      message={msg}
                      user={user}
                      receiver={receiver}
                      markdownToHtml={markdownToHtml}
                      scrollbarconfig={scrollbarconfig}
                      socket={socket}
                      activeChatId={activeChatId}
                      removeMessageFromList={removeMessageFromList}
                      toast={toast}
                    />
                  )
              )}
            </Box>

            <Box
              py={2}
              position="fixed"
              w={{ base: "100%", md: "70%" }}
              bottom={{ base: 1, md: 3 }}
              backgroundColor={
                localStorage.getItem("chakra-ui-color-mode") === "dark" ? "#1a202c" : "white"
              }
            >
              <Box mx={{ base: 6, md: 3 }} w="fit-content">
                {isOtherUserTyping && (
                  <Lottie options={defaultOptions} height={20} width={20} isStopped={false} isPaused={false} />
                )}
              </Box>
              <FormControl>
                <InputGroup
                  w={{ base: "95%", md: "98%" }}
                  m="auto"
                  onKeyDown={handleKeyPress}
                >
                  {!receiver?.email?.includes("bot") && (
                    <InputLeftElement>
                      <Button mx={2} size="sm" onClick={onOpen} borderRadius="lg">
                        <FaFileUpload />
                      </Button>
                    </InputLeftElement>
                  )}

                  <Input
                    placeholder="Type a message"
                    id="new-message"
                    onChange={handleTypingEvent}
                    borderRadius="10px"
                  />

                  <InputRightElement>
                    <Button
                      onClick={(e) =>
                        handleSendMessage(e, document.getElementById("new-message")?.value)
                      }
                      size="sm"
                      mx={2}
                      borderRadius="10px"
                    >
                      <ArrowForwardIcon />
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </Box>
          </Box>
          <FileUploadModal isOpen={isOpen} onClose={onClose} handleSendMessage={handleSendMessage} />
        </>
      ) : (
        !isChatLoading && (
          <Box display={{ base: "none", md: "block" }} mx="auto" w="fit-content" mt="30vh" textAlign="center">
            <Text fontSize="6vw" fontWeight="bold" fontFamily="Work sans">
              ChatWala (चैटवाला)
            </Text>
            <Text fontSize="2vw">Online chatting app</Text>
            <Text fontSize="md">Select a chat to start messaging</Text>
          </Box>
        )
      )}
    </>
  );
};
