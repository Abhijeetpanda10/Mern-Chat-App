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
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTabs = props.handleTabsChange;

  const showToast = (title, description, status) =>
    toast({ title, description, status, duration: 4000, isClosable: true });

  // 🔑 LOGIN FUNCTION
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = forgotPassword ? { email, otp } : { email, password };

    try {
      const response = await fetch(`${hostName}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      let resData;
      try {
        resData = await response.json();
      } catch {
        showToast("Error", "Server returned invalid JSON", "error");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        showToast("Login Failed", resData?.error || "Something went wrong", "error");
        setLoading(false);
        return;
      }

      // ✅ Successful login
      localStorage.setItem("token", resData.authtoken);
      setUser(resData.user);
      socket.emit("setup", resData.user._id);
      setIsAuthenticated(true);
      fetchData();

      showToast("Success", "Login successful!", "success");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      showToast("Error", "Unable to reach server", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✉️ SEND OTP FUNCTION
  const handleSendOtp = async () => {
    if (!email) {
      showToast("Error", "Enter your email first", "warning");
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
      if (!response.ok) {
        showToast("Failed", resData?.error || "OTP sending failed", "error");
      } else {
        showToast("Success", "OTP sent to your email", "success");
      }
    } catch (error) {
      console.error(error);
      showToast("Error", "Unable to send OTP", "error");
    } finally {
      setSendingOtp(false);
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

                {/* Password or OTP */}
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
                  isLoading={loading}
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
