import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { StoreConfigProvider } from "./context/StoreConfigContext";
import AppRoute from "./routes/AppRoute";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StoreConfigProvider>
          <AppRoute/>
        </StoreConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
