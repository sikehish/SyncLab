import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

const ConditionalNavbar = () => {
  const { pathname } = useLocation();

  if (pathname.startsWith("/meeting")) {
    return null;
  }

  return <Navbar />;
};

export default ConditionalNavbar;
