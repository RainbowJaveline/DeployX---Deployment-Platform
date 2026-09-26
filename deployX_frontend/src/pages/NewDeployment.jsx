import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Github, GitBranch, Check } from "lucide-react";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import { getStoredName, firstNameOf } from "../utils/user";

import "./NewDeployment.css";

const mockRepositories = [
  {
    id: 1,
    name: "demoshop",
    owner: "alex",
    visibility: "Public",
    language: "React",
  },
  {
    id: 2,
    name: "portfolio",
    owner: "alex",
    visibility: "Public",
    language: "React",
  },
  {
    id: 3,
    name: "ecommerce",
    owner: "alex",
    visibility: "Private",
    language: "React",
  },
  {
    id: 4,
    name: "api-gateway",
    owner: "alex",
    visibility: "Private",
    language: "Spring Boot",
  },
];

export default function NewDeployment() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("there");
  const [githubConnected, setGithubConnected] = useState(false);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepository, setSelectedRepository] = useState(null);
  const [repositoryUrl, setRepositoryUrl] = useState("");

  useEffect(() => {
    const stored = getStoredName();
    const first = firstNameOf(stored);

    if (first) {
      setFirstName(first);
    }
  }, []);

  function handleConnectGithub() {
    /*
      TEMPORARY FRONTEND DEMO

      Later this function will call your Spring Boot backend
      to perform the real GitHub OAuth flow.

      Example future flow:

      window.location.href =
        "http://localhost:8080/api/github/connect";
    */

    setGithubConnected(true);
    setRepositories(mockRepositories);
  }

  function handleRepositorySelect(repository) {
    setSelectedRepository(repository);
  }

  function handleContinue() {
    if (!selectedRepository && !repositoryUrl.trim()) {
      alert("Please select a repository or enter a repository URL.");
      return;
    }

    const repository = selectedRepository
      ? `https://github.com/${selectedRepository.owner}/${selectedRepository.name}`
      : repositoryUrl.trim();

    navigate("/repository-analysis", {
      state: {
        repository,
      },
    });
  }

  function handleNewDeployment() {
    // Already on this page.
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

            <Link
              to="/dashboard"
              className="new-deployment__back-link"
            >
              ← Back to Dashboard
            </Link>

            <div className="new-deployment__heading">
              <h1>Create a new deployment</h1>

              <p>
                Connect your GitHub repository and DeployX will automatically
                analyze and deploy your application.
              </p>
            </div>

            {/* GitHub Card */}
            <section
              className={`github-card ${
                githubConnected ? "github-card--connected" : ""
              }`}
            >
              <div className="github-card__header">

                <div
                  className={`github-card__icon ${
                    githubConnected
                      ? "github-card__icon--connected"
                      : ""
                  }`}
                >
                  {githubConnected ? (
                    <Check size={24} />
                  ) : (
                    <Github size={24} />
                  )}
                </div>

                <div>
                  <h2>
                    {githubConnected
                      ? "GitHub Connected"
                      : "Connect GitHub"}
                  </h2>

                  <p>
                    {githubConnected
                      ? "Select a repository to deploy."
                      : "Allow DeployX to access your repositories."}
                  </p>
                </div>
              </div>

              {!githubConnected ? (
                <button
                  type="button"
                  className="github-connect-btn"
                  onClick={handleConnectGithub}
                >
                  <Github size={19} />
                  Connect GitHub
                </button>
              ) : (
                <div className="repository-list">

                  {repositories.map((repo) => {
                    const isSelected =
                      selectedRepository?.id === repo.id;

                    return (
                      <button
                        type="button"
                        key={repo.id}
                        className={`repository-item ${
                          isSelected
                            ? "repository-item--selected"
                            : ""
                        }`}
                        onClick={() =>
                          handleRepositorySelect(repo)
                        }
                      >
                        <span
                          className={`repository-radio ${
                            isSelected
                              ? "repository-radio--selected"
                              : ""
                          }`}
                        >
                          {isSelected && <span />}
                        </span>

                        <GitBranch
                          size={18}
                          className="repository-item__branch"
                        />

                        <span className="repository-item__name">
                          {repo.owner}/{repo.name}
                        </span>

                        <span
                          className={`repository-visibility ${
                            repo.visibility === "Private"
                              ? "repository-visibility--private"
                              : ""
                          }`}
                        >
                          {repo.visibility}
                        </span>
                      </button>
                    );
                  })}

                {selectedRepository && (
                  <div className="selected-repository">
                    <Check size={16} />
                    <span>
                      Selected:{" "}
                      <strong>
                        {selectedRepository.owner}/
                        {selectedRepository.name}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            )}
            </section>

            {/* Repository URL */}
            <section className="repository-url-card">
              <h2>Or enter a repository URL</h2>

              <p>
                Paste a public GitHub repository URL.
              </p>

              <input
                type="text"
                value={repositoryUrl}
                onChange={(e) =>
                  setRepositoryUrl(e.target.value)
                }
                placeholder="https://github.com/username/project"
                disabled={!!selectedRepository}
              />

              {selectedRepository && (
                <small>
                  Repository selected above. URL input is disabled.
                </small>
              )}
            </section>

            {/* Continue */}
            <button
              type="button"
              className="new-deployment__continue"
              onClick={handleContinue}
            >
              Continue
              <span>→</span>
            </button>

          </div>
        </main>
      </div>
    </div>
  );
}