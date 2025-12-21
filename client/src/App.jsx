import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import AppRoute from "./routes/AppRoute";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoute/>
      </AuthProvider>
    </BrowserRouter>
  );
}
