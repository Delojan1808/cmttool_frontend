import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import SignUp from "./components/pages/SignUp"
import FieldManagement from "./components/pages/FieldManagement"
import Login from "./components/pages/Login"
import SecretaryDashboard from "./components/pages/SecretaryDashboard"
import EditorDashboard from "./components/pages/EditorDashboard"
import SubEditorDashboard from "./components/pages/SubEditorDashboard"
import ReviewerDashboard from "./components/pages/ReviewerDashboard"
import ReviewForm from "./components/pages/ReviewForm"
import AuthorDashboard from "./components/pages/AuthorDashboard"
import UserManagement from "./components/pages/UserManagement"
import ProtectedRoute from "./components/templates/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        {/* Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Author']} />}>
          <Route path="/author" element={<AuthorDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['Secretary']} />}>
          <Route path="/secretary" element={<SecretaryDashboard />} />
          <Route path="/secretary/fields" element={<FieldManagement />} />
          <Route path="/secretary/users" element={<UserManagement />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['Editor']} />}>
          <Route path="/editor" element={<EditorDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['SubEditor']} />}>
          <Route path="/subeditor" element={<SubEditorDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['Reviewer']} />}>
          <Route path="/reviewer" element={<ReviewerDashboard />} />
          <Route path="/reviewer/form/:paperId" element={<ReviewForm />} />
        </Route>
      </Routes>
    </BrowserRouter>



  )
}

export default App
