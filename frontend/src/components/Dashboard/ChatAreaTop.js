import React, { useContext, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Image,
  Tooltip,
  SkeletonCircle,
  Skeleton,
  Circle,
  Stack,
  useDisclosure,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import chatContext from "../../context/chatContext";
import { ProfileModal } from "../miscellaneous/ProfileModal";

const ChatAreaTop = () => {
  const context = useContext(chatContext);

  const {
    receiver,
    setReceiver,
    activeChatId,
    setActiveChatId,
    setMessageList,
    isChatLoading,
    hostName,
    socket,
  } = context;

  const { isOpen, onOpen, onClose } = useDisclosure();

  // ✅ Get Receiver Online Status
  const getReceiverOnlineStatus = async () => {
    if (!receiver?._id) return;

    try {
      const response = await fetch(
        `${hostName}/user/online-status/${receiver._id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem("token"),
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch online status");

      const data = await response.json();
      setReceiver((prev) => ({
        ...prev,
        isOnline: data.isOnline,
        lastSeen: data.lastSeen || prev.lastSeen,
      }));
    } catch (error) {
      console.warn("Error fetching receiver status:", error.message);
    }
  };

  // ✅ Go Back Handler
  const handleBack = () => {
    try {
      socket.emit("leave-chat", activeChatId);
      setActiveChatId("");
      setMessageList([]);
      setReceiver({});
    } catch (error) {
      console.error("Error leaving chat:", error.message);
    }
  };

  // ✅ Format Last Seen String
  const getLastSeenString = (lastSeen) => {
    if (!lastSeen) return "offline";

    let result = "last seen ";
    const lastSeenDate = new Date(lastSeen);
    const today = new Date();

    if (lastSeenDate.toDateString() === today.toDateString()) {
      result += "today ";
    } else if (
      lastSeenDate.toDateString() ===
      new Date(today.setDate(today.getDate() - 1)).toDateString()
    ) {
      result += "yesterday ";
    } else {
      result += `on ${lastSeenDate.toLocaleDateString()} `;
    }

    result += `at ${lastSeenDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    return result;
  };

  useEffect(() => {
    getReceiverOnlineStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiver?._id]);

  return (
    <>
      <Flex w="100%" alignItems="center" borderBottom="1px solid" borderColor="gray.200">
        {/* 🔙 Back Button */}
        <Button
          borderRadius={0}
          height="inherit"
          onClick={handleBack}
          aria-label="Back"
        >
          <ArrowBackIcon />
        </Button>

        {/* 👤 Profile Section */}
        <Tooltip label="View Profile" hasArrow>
          <Button
            w="100%"
            p={2}
            h="max-content"
            justifyContent="space-between"
            borderRadius="0px"
            onClick={onOpen}
            variant="ghost"
            _hover={{ bg: "gray.50" }}
          >
            {isChatLoading ? (
              <Flex align="center">
                <SkeletonCircle size="10" mx={2} />
                <Skeleton height="20px" width="250px" borderRadius="md" my={2} />
              </Flex>
            ) : (
              <Flex gap={2} alignItems="center">
                <Image
                  borderRadius="full"
                  boxSize="40px"
                  src={receiver?.profilePic || "/default-avatar.png"}
                  alt={receiver?.name || "User"}
                />

                <Stack
                  justifyContent="center"
                  spacing={0}
                  textAlign="left"
                  lineHeight={1}
                >
                  <Text
                    fontSize="lg"
                    fontWeight="semibold"
                    mx={1}
                    my={receiver?.isOnline ? 0 : 1}
                  >
                    {receiver?.name || "Unknown User"}
                  </Text>

                  {receiver?.isOnline ? (
                    <Text mx={1} fontSize="sm" color="green.500">
                      <Circle
                        size="2"
                        bg="green.500"
                        display="inline-block"
                        borderRadius="full"
                        mx={1}
                      />
                      active now
                    </Text>
                  ) : (
                    <Text my={0} mx={1} fontSize="xs" color="gray.500">
                      {getLastSeenString(receiver?.lastSeen)}
                    </Text>
                  )}
                </Stack>
              </Flex>
            )}
          </Button>
        </Tooltip>
      </Flex>

      {/* 🧩 Profile Modal */}
      <ProfileModal isOpen={isOpen} onClose={onClose} user={receiver} />
    </>
  );
};

export default ChatAreaTop;
