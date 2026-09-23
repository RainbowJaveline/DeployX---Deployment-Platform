import React from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import { useNavigate } from "react-router-dom";
import { getStoredName, firstNameOf } from "../utils/user";
import { useEffect, useState } from "react";
import "./NewDeployment.css";

function NewDeployment() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("there");
  const [repositoryUrl, setRepositoryUrl] = useState("");

  useEffect(() => {
    const stored = getStoredName();
    const first = firstNameOf(stored);

    if (first) {
      setFirstName(first);
    }
  }, []);

  function handleNewDeployment() {
    // Already on the New Deployment page.
  }

  function handleContinue() {
    if (!repositoryUrl.trim()) {
      alert("Please enter your GitHub repository URL.");
      return;
    }

    if (!repositoryUrl.startsWith("https://github.com/")) {
      alert("Please enter a valid GitHub repository URL.");
      return;
    }

    alert(
      "Repository analysis and deployment will be connected with the backend."
    );
  }

  return (
    <div className="dashboard">
      {/* Reuse the existing dashboard sidebar */}
      <Sidebar userName={firstName} />

      <div className="dashboard__content">
        {/* Reuse the existing dashboard topbar */}
        <Topbar
          title="New Deployment"
          onNewDeployment={handleNewDeployment}
        />

        {/* New Deployment Page Content */}
        <main className="new-deployment__main">
          <div className="new-deployment__container">
             
              {/* Back to Dashboard Link */}
           <Link to="/dashboard" className="new-deployment__back-link">
          ← Back to Dashboard
           </Link>

            <div className="new-deployment__heading">
              <h1>Create a new deployment</h1>

              <p>
                Connect your GitHub repository and DeployX will automatically
                analyze and deploy your application.
              </p>
            </div>

            {/* GitHub Connection Card */}
            <div className="new-deployment__card">
              <div className="new-deployment__card-header">

                <div className="new-deployment__github-icon">
                  <svg
                    viewBox="0 0 24 24"
                    width="23"
                    height="23"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.76-.24.76-.54v-2.1c-3.1.68-3.76-1.32-3.76-1.32-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 .1.78 1.93 3.7 1.93.3 0 .6-.02.9-.06.1-.7.4-1.32.75-1.72-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.16-3-.12-.28-.5-1.42.11-2.96 0 0 .95-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.13-1.45 3.08-1.15 3.08-1.15.61 1.54.23 2.68.11 2.96.72.78 1.16 1.78 1.16 3 0 4.29-2.62 5.23-5.12 5.51.41.36.78 1.05.78 2.12v3.14c0 .3.2.65.77.54A11.2 11.2 0 0 0 12 .8Z" />
                  </svg>
                </div>

                <div className="new-deployment__card-title">
                  <h3>Connect GitHub</h3>
                  <p>Allow DeployX to access your repositories.</p>
                </div>

              </div>

              <button
                type="button"
                className="new-deployment__github-button"
                onClick={() => {
                  alert(
                    "GitHub OAuth integration will be connected with the backend."
                  );
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.76-.24.76-.54v-2.1c-3.1.68-3.76-1.32-3.76-1.32-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 .1.78 1.93 3.7 1.93.3 0 .6-.02.9-.06.1-.7.4-1.32.75-1.72-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.16-3-.12-.28-.5-1.42.11-2.96 0 0 .95-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.13-1.45 3.08-1.15 3.08-1.15.61 1.54.23 2.68.11 2.96.72.78 1.16 1.78 1.16 3 0 4.29-2.62 5.23-5.12 5.51.41.36.78 1.05.78 2.12v3.14c0 .3.2.65.77.54A11.2 11.2 0 0 0 12 .8Z" />
                </svg>

                Connect GitHub
              </button>
            </div>

            {/* Repository URL Card */}
            <div className="new-deployment__card new-deployment__repository-card">
              <label htmlFor="repository-url">
                Or enter a repository URL
              </label>

              <p>Paste a public GitHub repository URL.</p>

              <input
                id="repository-url"
                type="url"
                value={repositoryUrl}
                onChange={(event) => setRepositoryUrl(event.target.value)}
                placeholder="https://github.com/Username/project"
              />
            </div>

            {/* Continue Button */}
            <button
              type="button"
              className="new-deployment__continue-button"
              onClick={handleContinue}
            >
              Continue <span>→</span>
            </button>

          </div>
        </main>
      </div>
    </div>
  );
}

export default NewDeployment;