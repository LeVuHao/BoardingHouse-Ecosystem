import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterLandlord from './pages/RegisterLandlord';
import Roommates from './pages/Roommates';
import MyBills from './pages/MyBills';
import Notifications from './pages/Notifications';
import LandlordProperties from './pages/LandlordProperties';
import AdminDashboard from './pages/AdminDashboard';
// [HUY] Các trang mới
import SearchRooms from './pages/SearchRooms';
import RoomDetail from './pages/RoomDetail';
import MyContracts from './pages/MyContracts';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchRooms />} />
              <Route path="/rooms/:id" element={<RoomDetail />} />
              <Route path="/roommates" element={<Roommates />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register-landlord" element={<RegisterLandlord />} />

              {/* Authenticated Routes */}
              <Route element={<ProtectedRoute allowedRoles={['USER', 'LANDLORD', 'ADMIN']} />}>
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/my-contracts" element={<MyContracts />} />
              </Route>

              {/* User Only */}
              <Route element={<ProtectedRoute allowedRoles={['USER']} />}>
                <Route path="/my-bills" element={<MyBills />} />
              </Route>

              {/* Landlord Only */}
              <Route element={<ProtectedRoute allowedRoles={['LANDLORD']} />}>
                <Route path="/landlord/properties" element={<LandlordProperties />} />
              </Route>

              {/* Admin Only */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
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
