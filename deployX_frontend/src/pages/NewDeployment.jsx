import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import { getStoredName, firstNameOf } from "../utils/user";
import { useEffect, useState } from "react";
import "./NewDeployment.css";

function NewDeployment() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("there");

  const [repositories, setRepositories] = useState([]);
  const [selectedRepository, setSelectedRepository] = useState(null);

  const [repositoryUrl, setRepositoryUrl] = useState("");

  const [loadingRepositories, setLoadingRepositories] = useState(false);
  const [repositoryError, setRepositoryError] = useState("");

  useEffect(() => {
    const stored = getStoredName();
    const first = firstNameOf(stored);

    if (first) {
      setFirstName(first);
    }

    fetchRepositories();
  }, []);

  async function fetchRepositories() {
    try {
      setLoadingRepositories(true);
      setRepositoryError("");

      const response = await fetch(
        "http://localhost:8082/api/v1.0/github/repos",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("GitHub account is not connected.");
        }

        if (response.status === 401) {
          throw new Error("Please log in to DeployX.");
        }

        throw new Error("Failed to load GitHub repositories.");
      }

      const data = await response.json();

      setRepositories(data);
    } catch (error) {
      console.error("Repository fetch error:", error);
      setRepositoryError(error.message);
    } finally {
      setLoadingRepositories(false);
    }
  }

  function handleRepositorySelect(repository) {
    setSelectedRepository(repository);

    // Automatically use the selected repository URL
    setRepositoryUrl(repository.htmlUrl);
  }

  function handleNewDeployment() {
    // Already on the New Deployment page.
  }

  function handleContinue() {
    if (!repositoryUrl.trim()) {
      alert("Please select a repository or enter a GitHub repository URL.");
      return;
    }

    if (!repositoryUrl.startsWith("https://github.com/")) {
      alert("Please enter a valid GitHub repository URL.");
      return;
    }

    if (selectedRepository) {
      console.log("Selected repository:", selectedRepository);

      alert(
        `Repository selected: ${selectedRepository.fullName}\n\n` +
        "Repository analysis and deployment will be connected with the backend."
      );

      return;
    }

    alert(
      "Repository analysis and deployment will be connected with the backend."
    );
  }

  return (
    <div className="dashboard">
      <Sidebar userName={firstName} />

      <div className="dashboard__content">

        <Topbar
          title="New Deployment"
          onNewDeployment={handleNewDeployment}
        />

        <main className="new-deployment__main">
          <div className="new-deployment__container">

            {/* Back to Dashboard */}
            <Link
              to="/dashboard"
              className="new-deployment__back-link"
            >
              ← Back to Dashboard
            </Link>

            {/* Heading */}
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

                  <p>
                    Allow DeployX to access your repositories.
                  </p>
                </div>

              </div>

              <button
                type="button"
                className="new-deployment__github-button"
                onClick={() => {
                  window.location.href =
                    "http://localhost:8082/api/v1.0/github/connection";
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.76-.24.76-.54v-2.1c0-.3.2-.65.77-.54A11.2 11.2 0 0 0 12 .8Z" />
                </svg>

                Connect GitHub
              </button>

            </div>

            {/* Repository List */}
            <div className="new-deployment__card">

              <div className="new-deployment__repositories-header">
                <div>
                  <h3>Your GitHub repositories</h3>

                  <p>
                    Select a repository to deploy with DeployX.
                  </p>
                </div>

                <button
                  type="button"
                  className="new-deployment__refresh-button"
                  onClick={fetchRepositories}
                  disabled={loadingRepositories}
                >
                  {loadingRepositories ? "Loading..." : "Refresh"}
                </button>
              </div>

              {/* Loading */}
              {loadingRepositories && (
                <div className="new-deployment__repository-state">
                  Loading your repositories...
                </div>
              )}

              {/* Error */}
              {!loadingRepositories && repositoryError && (
                <div className="new-deployment__repository-error">
                  <p>{repositoryError}</p>

                  <button
                    type="button"
                    onClick={fetchRepositories}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Empty */}
              {!loadingRepositories &&
                !repositoryError &&
                repositories.length === 0 && (
                  <div className="new-deployment__repository-state">
                    No GitHub repositories found.
                  </div>
                )}

              {/* Repository List */}
              {!loadingRepositories &&
                !repositoryError &&
                repositories.length > 0 && (
                  <div className="new-deployment__repository-list">

                    {repositories.map((repository) => (
                      <button
                        key={repository.id}
                        type="button"
                        className={`new-deployment__repository-item ${
                          selectedRepository?.id === repository.id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          handleRepositorySelect(repository)
                        }
                      >

                        <div className="new-deployment__repository-icon">
                          <svg
                            viewBox="0 0 24 24"
                            width="19"
                            height="19"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.76-.24.76-.54v-2.1c-3.1.68-3.76-1.32-3.76-1.32-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 .1.78 1.93 3.7 1.93.3 0 .6-.02.9-.06.1-.7.4-1.32.75-1.72-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.16-3-.12-.28-.5-1.42.11-2.96 0 0 .95-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.13-1.45 3.08-1.15 3.08-1.15.61 1.54.23 2.68.11 2.96.72.78 1.16 1.78 1.16 3 0 4.29-2.62 5.23-5.12 5.51.41.36.78 1.05.78 2.12v3.14c0 .3.2.65.77.54A11.2 11.2 0 0 0 12 .8Z" />
                          </svg>
                        </div>

                        <div className="new-deployment__repository-info">

                          <strong>
                            {repository.name}
                          </strong>

                          <span>
                            {repository.fullName}
                          </span>

                          <div className="new-deployment__repository-meta">

                            <span>
                              {repository.language || "Unknown language"}
                            </span>

                            <span>
                              {repository.defaultBranch}
                            </span>

                            <span>
                              {repository.private
                                ? "Private"
                                : "Public"}
                            </span>

                          </div>

                        </div>

                        <div className="new-deployment__repository-check">
                          {selectedRepository?.id === repository.id
                            ? "✓"
                            : "›"}
                        </div>

                      </button>
                    ))}

                  </div>
                )}

            </div>

            {/* Manual Repository URL */}
            <div className="new-deployment__card new-deployment__repository-card">

              <label htmlFor="repository-url">
                Or enter a repository URL
              </label>

              <p>
                Paste a public GitHub repository URL manually.
              </p>

              <input
                id="repository-url"
                type="url"
                value={repositoryUrl}
                onChange={(event) => {
                  setRepositoryUrl(event.target.value);
                  setSelectedRepository(null);
                }}
                placeholder="https://github.com/Username/project"
              />

            </div>

            {/* Continue */}
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