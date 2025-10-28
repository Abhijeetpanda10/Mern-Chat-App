import { useState, useContext } from "react";
import {
  Flex,
  Heading,
  Input,
  Button,
  InputGroup,
  Stack,
  InputLeftElement,
  chakra,
  Box,
  Link,
  Avatar,
  FormControl,
  FormHelperText,
  InputRightElement,
  Card,
  CardBody,
  useToast,
  Spinner,
  Tooltip,
} from "@chakra-ui/react";
import { FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import chatContext from "../../context/chatContext";
import { ArrowBackIcon } from "@chakra-ui/icons";

const CFaLock = chakra(FaLock);

const Login = (props) => {
  const { hostName, socket, setUser, setIsAuthenticated, fetchData } =
    useContext(chatContext);
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleTabs = props.handleTabsChange;
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otp, setOtp] = useState("");

  const showToast = (title, description, status) => {
    toast({
      title,
      description,
      status,
      duration: 4000,
      isClosable: true,
    });
  };

  // ---------- LOGIN FUNCTION ----------
  const handleLogin = async (e) => {
    e.preventDefault();

    const data = forgotPassword
      ? { email, otp }
      : { email, password };

    try {
      const response = await fetch(`${hostName}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (response.status !== 200) {
        showToast("Login Failed", resData.error, "error");
      } else {
        showToast("Login Successful", "You are now logged in!", "success");
        localStorage.setItem("token", resData.authtoken);
        setUser(resData.user);
        socket.emit("setup", resData.user._id);
        setIsAuthenticated(true);
        fetchData();
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
      showToast("Error", "Server not responding", "error");
    }
  };

  // ---------- SEND OTP FUNCTION ----------
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      showToast("Error", "Please enter your email first", "warning");
      return;
    }

    setSendingOtp(true);

    try {
      const response = await fetch(`${hostName}/auth/getotp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const resData = await response.json();
      setSendingOtp(false);

      if (response.status !== 200) {
        showToast("Failed", resData.error, "error");
      } else {
        showToast("OTP Sent", "Check your email inbox", "success");
      }
    } catch (error) {
      console.error(error);
      setSendingOtp(false);
      showToast("Error", "Server not responding", "error");
    }
  };

  return (
    <Flex
      flexDirection="column"
      width="100wh"
      height="70vh"
      justifyContent="center"
      alignItems="center"
      borderRadius={15}
    >
      <Stack flexDir="column" mb="2" alignItems="center">
        <Avatar bg="purple.300" />
        <Heading color="purple.400">Welcome Back</Heading>

        <Card minW={{ base: "90%", md: "468px" }} borderRadius={15}>
          <CardBody>
            <form>
              <Stack spacing={4}>
                {forgotPassword && (
                  <Tooltip label="Back to Login">
                    <Button
                      w="fit-content"
                      onClick={() => setForgotPassword(false)}
                    >
                      <ArrowBackIcon />
                    </Button>
                  </Tooltip>
                )}

                {/* Email */}
                <FormControl display="flex">
                  <InputGroup size="lg">
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      focusBorderColor="purple.500"
                    />
                  </InputGroup>
                  {forgotPassword && (
                    <Button m={1} fontSize="sm" onClick={handleSendOtp}>
                      {sendingOtp ? <Spinner size="sm" /> : "Send OTP"}
                    </Button>
                  )}
                </FormControl>

                {/* Password or OTP Field */}
                {!forgotPassword ? (
                  <FormControl>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none">
                        <CFaLock color="gray.300" />
                      </InputLeftElement>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        focusBorderColor="purple.500"
                      />
                      <InputRightElement mx={1}>
                        <Button
                          fontSize="x-small"
                          size="xs"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? "Hide" : "Show"}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    <FormHelperText textAlign="right">
                      <Link onClick={() => setForgotPassword(true)}>
                        Forgot password?
                      </Link>
                    </FormHelperText>
                  </FormControl>
                ) : (
                  <FormControl>
                    <InputGroup size="lg">
                      <Input
                        type="number"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        focusBorderColor="purple.500"
                      />
                    </InputGroup>
                  </FormControl>
                )}

                {/* Login Button */}
                <Button
                  borderRadius={10}
                  colorScheme="purple"
                  width="full"
                  onClick={handleLogin}
                >
                  {forgotPassword ? "Login with OTP" : "Login"}
                </Button>
              </Stack>
            </form>
          </CardBody>
        </Card>
      </Stack>

      <Box>
        New to us?{" "}
        <Link color="purple.500" onClick={() => handleTabs(1)}>
          Sign Up
        </Link>
      </Box>
    </Flex>
  );
};

export default Login;
