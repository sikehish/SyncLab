import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

 const ConditionalNavbar: React.FC = () => {
    const location = useLocation();
      if (location.pathname.startsWith("/meeting")) {
      return null;
    }
  
    return <Navbar />;
  };

  export default ConditionalNavbar