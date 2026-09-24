import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import SearchRooms from "./pages/SearchRooms";
import RoomDetail from "./pages/RoomDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterLandlord from "./pages/RegisterLandlord";
import Roommates from "./pages/Roommates";
import MyBills from "./pages/MyBills";
import Notifications from "./pages/Notifications";
import LandlordProperties from "./pages/LandlordProperties";
import LandlordRequests from "./pages/LandlordRequests";
import LandlordCreateBill from "./pages/LandlordCreateBill";
import MyContracts from "./pages/MyContracts";
import AdminDashboard from "./pages/AdminDashboard";
import ForumFeed from "./pages/ForumFeed";
import CreateForumPost from "./pages/CreateForumPost";
import ForumPostDetail from "./pages/ForumPostDetail";
import ForumMessages from "./pages/ForumMessages";
import Profile from "./pages/Profile";

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/search" element={<Rooms />} />
              <Route path="/rooms/:id" element={<ForumPostDetail />} />
              <Route path="/roommates" element={<Roommates />} />
              <Route path="/forum" element={<Rooms />} />
              <Route path="/forum/:id" element={<ForumPostDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register-landlord" element={<RegisterLandlord />} />
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["USER", "LANDLORD", "ADMIN"]}
                  />
                }
              >
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/my-contracts" element={<MyContracts />} />
                <Route path="/forum/messages" element={<ForumMessages />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["USER"]} />}>
                <Route path="/my-bills" element={<MyBills />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["LANDLORD"]} />}>
                <Route path="/forum/create" element={<CreateForumPost />} />
                <Route
                  path="/landlord/properties"
                  element={<LandlordProperties />}
                />
                <Route
                  path="/landlord/requests"
                  element={<LandlordRequests />}
                />
                <Route
                  path="/landlord/create-bill"
                  element={<LandlordCreateBill />}
                />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
