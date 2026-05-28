import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AnimeHome from "./pages/AnimeHome";
import Login from "./pages/Login";
import Favorites from "./pages/Favorites";
import Watchlist from "./pages/Watchlist";
import AnimeDetail from "./pages/AnimeDetail";
import Register from "./pages/Register";
import Tierlist from "./pages/Tierlist";
import { isLoggedIn } from "./services/auth";

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><AnimeHome /></PrivateRoute>} />
        <Route path="/anime/:id" element={<PrivateRoute><AnimeDetail /></PrivateRoute>} />
        <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
        <Route path="/watchlist" element={<PrivateRoute><Watchlist /></PrivateRoute>} />
        <Route path="/tierlist" element={<PrivateRoute><Tierlist /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
