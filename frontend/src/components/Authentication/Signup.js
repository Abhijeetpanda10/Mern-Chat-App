import chatContext from "../../context/chatContext";
import { useState, useContext } from "react";
import {
  Flex,
  Heading,
  Input,
  Button,
  InputGroup,
  Stack,
  InputLeftElement,
  Box,
  Link,
  Avatar,
  FormControl,
  InputRightElement,
  Card,
  CardBody,
  useToast,
} from "@chakra-ui/react";
import { LockIcon } from "@chakra-ui/icons";

const Signup = (props) => {
  const { hostName } = useContext(chatContext);
  const toast = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleTabs = props.handleTabsChange;

  const showToast = (title, description, status) => {
    toast({
      title,
      description,
      status,
      duration: 4000,
      isClosable: true,
    });
  };

  const handleShowClick = () => setShowPassword(!showPassword);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      showToast("Missing fields", "All fields are required", "warning");
      return;
    }
    if (name.length < 3 || name.length > 20) {
      showToast(
        "Invalid Name",
        "Name should be between 3 and 20 characters",
        "error"
      );
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      showToast("Invalid Email", "Please enter a valid email", "error");
      return;
    }
    if (password.length < 8 || password.length > 20) {
      showToast(
        "Invalid Password",
        "Password must be between 8 and 20 characters",
        "error"
      );
      return;
    }
    if (password !== confirmPassword) {
      showToast("Mismatch", "Passwords do not match", "error");
      return;
    }

    try {
      const response = await fetch(`${hostName}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const resData = await response.json();

      if (response.status !== 200) {
        showToast("Signup Failed", resData.error || "Please try again", "error");
        return;
      }

      localStorage.setItem("token", resData.authtoken);
      showToast("Success", "Account created successfully!", "success");

      // Redirect user to login tab
      handleTabs(0);
    } catch (error) {
      console.error(error);
      showToast("Error", "Server not responding", "error");
    }
  };

  return (
    <Flex
      flexDirection="column"
      width="100%"
      height="70vh"
      justifyContent="center"
      alignItems="center"
      borderRadius={15}
    >
      <Stack flexDir="column" mb="2" alignItems="center">
        <Avatar bg="purple.300" />
        <Heading color="purple.400">Welcome</Heading>

        <Card minW={{ base: "90%", md: "468px" }} borderRadius={15}>
          <CardBody>
            <form>
              <Stack spacing={4}>
                <FormControl>
                  <InputGroup size="lg">
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      focusBorderColor="purple.500"
                      onChange={(e) => setName(e.target.value)}
                    />
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <InputGroup size="lg">
                    <Input
                      type="email"
                      placeholder="Email address"
                      focusBorderColor="purple.500"
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none">
                      <LockIcon color="gray.300" />
                    </InputLeftElement>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      focusBorderColor="purple.500"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <InputRightElement mx={1}>
                      <Button
                        fontSize="x-small"
                        size="xs"
                        onClick={handleShowClick}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none">
                      <LockIcon color="gray.300" />
                    </InputLeftElement>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      focusBorderColor="purple.500"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <InputRightElement mx={1}>
                      <Button
                        fontSize="x-small"
                        size="xs"
                        onClick={handleShowClick}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button
                  borderRadius={10}
                  colorScheme="purple"
                  width="full"
                  onClick={handleSignup}
                >
                  Sign Up
                </Button>
              </Stack>
            </form>
          </CardBody>
        </Card>
      </Stack>

      <Box>
        Already have an account?{" "}
        <Link color="purple.500" onClick={() => handleTabs(0)}>
          Login
        </Link>
      </Box>
    </Flex>
  );
};

export default Signup;
