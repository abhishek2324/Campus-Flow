import "./App.css";
import Navbar from "./pages/Navbar";

import Login from "./pages/login";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/home";

import CreateDepartment from "./pages/CreateDepartment";
import DepartmentList from "./pages/DepartmentsList";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDepartments from "./pages/AdminDepartments";
import EditDepartment from "./pages/EditDepartment";
import CreateUser from "./pages/CreateUser";
import UsersList from "./pages/UsersList";
import EditUser from "./pages/EditUser";

import StudentDashboard from "./pages/StudentDashboard";
import UploadAssignment from "./pages/UploadAssignment";
import BulkUpload from "./pages/BulkUpload";
import MyAssignments from "./pages/MyAssignments";
import AssignmentDetails from "./pages/AssignmentDetails";
import ResubmitAssignment from "./pages/ResubmitAssignment";

import ProfessorDashboard from "./pages/ProfessorDashboard";
import ReviewAssignment from "./pages/ReviewAssignment";

import HODDashboard from "./pages/HODDashboard";
import HODReviewAssignment from "./pages/HODReviewAssignment";

import PrivateRoute from "./components/PrivateRoute";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      {/* ✅ Navbar appears on ALL pages */}
      <Navbar />

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/home" element={<Home />} />

        {/* ADMIN */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/departments" element={<DepartmentList />} />
        <Route path="/admin/departments/new" element={<CreateDepartment />} />
        <Route path="/admin/manage-departments" element={<AdminDepartments />} />
        <Route path="/admin/departments/:id/edit" element={<EditDepartment />} />
        <Route path="/admin/users/new" element={<CreateUser />} />
        <Route path="/admin/users" element={<UsersList />} />
        <Route path="/admin/users/:id/edit" element={<EditUser />} />

        {/* STUDENT */}
        <Route
          path="/student/dashboard"
          element={
            <PrivateRoute requiredRole="student">
              <StudentDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/student/upload"
          element={
            <PrivateRoute requiredRole="student">
              <UploadAssignment />
            </PrivateRoute>
          }
        />
        <Route
          path="/student/bulk-upload"
          element={
            <PrivateRoute requiredRole="student">
              <BulkUpload />
            </PrivateRoute>
          }
        />
        <Route
          path="/student/assignments"
          element={
            <PrivateRoute requiredRole="student">
              <MyAssignments />
            </PrivateRoute>
          }
        />
        <Route
          path="/student/assignments/:id"
          element={
            <PrivateRoute requiredRole="student">
              <AssignmentDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/student/assignments/:id/resubmit"
          element={
            <PrivateRoute requiredRole="student">
              <ResubmitAssignment />
            </PrivateRoute>
          }
        />

        {/* PROFESSOR */}
        <Route
          path="/professor/dashboard"
          element={
            <PrivateRoute requiredRole="professor">
              <ProfessorDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/professor/review/:id"
          element={
            <PrivateRoute requiredRole="professor">
              <ReviewAssignment />
            </PrivateRoute>
          }
        />

        {/* HOD */}
        <Route
          path="/hod/dashboard"
          element={
            <PrivateRoute requiredRole="hod">
              <HODDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/hod/review/:id"
          element={
            <PrivateRoute requiredRole="hod">
              <HODReviewAssignment />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
