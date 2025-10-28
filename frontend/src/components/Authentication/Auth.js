import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";
import Login from "./Login";
import Signup from "./Signup";
import React from "react";

const Auth = (props) => {
  const [activeTab, setActiveTab] = React.useState(props.tabindex || 0);

  const handleTabsChange = (index) => {
    setActiveTab(index);
  };

  return (
    <Tabs
      isFitted
      variant="enclosed"
      index={activeTab}
      colorScheme="purple"
      onChange={handleTabsChange}
    >
      <TabList mb="2em">
        <Tab>Login</Tab>
        <Tab>Sign Up</Tab>
      </TabList>
      <TabPanels>
        <TabPanel p={0}>
          <Login handleTabsChange={handleTabsChange} />
        </TabPanel>
        <TabPanel>
          <Signup handleTabsChange={handleTabsChange} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default Auth;
