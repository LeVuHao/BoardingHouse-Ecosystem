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
import ActivateAccount from "./pages/ActivateAccount";
import ActivateAccountCallback from "./pages/ActivateAccountCallback";
import Roommates from "./pages/Roommates";
import MyBills from "./pages/MyBills";
import Notifications from "./pages/Notifications";
import LandlordProperties from "./pages/LandlordProperties";
import LandlordRequests from "./pages/LandlordRequests";
import LandlordCreateBill from "./pages/LandlordCreateBill";
import MyContracts from "./pages/MyContracts";
import AdminDashboard from "./pages/AdminDashboard";

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
              <Route path="/search" element={<SearchRooms />} />
              <Route path="/rooms/:id" element={<RoomDetail />} />
              <Route path="/roommates" element={<Roommates />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register-landlord" element={<RegisterLandlord />} />
              <Route path="/activate-account" element={<ActivateAccount />} />
              <Route path="/activate-account/callback" element={<ActivateAccountCallback />} />

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["USER", "LANDLORD", "ADMIN"]}
                  />
                }
              >
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/my-contracts" element={<MyContracts />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["USER"]} />}>
                <Route path="/my-bills" element={<MyBills />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["LANDLORD"]} />}>
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