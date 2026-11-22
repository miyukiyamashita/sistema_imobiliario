
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { ToastProvider } from "./components/ui/ToastProvider";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider><AppRoutes /></AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
