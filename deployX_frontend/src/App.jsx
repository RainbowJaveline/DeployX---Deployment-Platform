import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import NewDeployment from "./pages/NewDeployment";
import RepositoryAnalysis from "./pages/RepositoryAnalysis";
import ConfigureDeployment from "./pages/ConfigureDeployment";
import DeploymentProgress from './pages/DeploymentProgress'
import ProjectDashboard from "./pages/ProjectDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/new-deployment" element={<NewDeployment />} />
      <Route path="/repository-analysis" element={<RepositoryAnalysis />} />
      <Route path="/configure-deployment" element={<ConfigureDeployment />} />
      <Route path="/deployment-progress" element={<DeploymentProgress />} />
      <Route path="/project-dashboard" element={<ProjectDashboard />} />
    </Routes>
    
  )
}
