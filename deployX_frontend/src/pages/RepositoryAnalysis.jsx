import { useEffect, useLayoutEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Github,
  Check,
  Circle,
  ArrowRight,
} from "lucide-react";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import { getStoredName, firstNameOf } from "../utils/user";
import { analyzeRepository } from "../utils/api";

import "./RepositoryAnalysis.css";

const analysisSteps = [
  "Repository connected",
  "Repository cloned",
  "Analyzing project structure",
  "Detecting technologies",
  "Preparing deployment configuration",
];

export default function RepositoryAnalysis() {
    useLayoutEffect(() => {
  const main = document.querySelector('.dashboard-main')

  if (main) {
    main.scrollTop = 0
  }

  window.scrollTo(0, 0)
}, [])
  const location = useLocation();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("there");
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const repositoryRequest = location.state?.repository;
  const repositoryLabel = repositoryRequest?.repositoryUrl ||
    (repositoryRequest ? `https://github.com/${repositoryRequest.owner}/${repositoryRequest.repository}` : '');

  useEffect(() => {
    const stored = getStoredName();
    const first = firstNameOf(stored);

    if (first) {
      setFirstName(first);
    }
  }, []);

  useEffect(() => {
    if (!repositoryRequest) {
      setAnalysisError('Choose a repository from the New Deployment page to begin analysis.')
      return
    }
    let cancelled = false
    setAnalyzing(true)
    analyzeRepository(repositoryRequest)
      .then((result) => { if (!cancelled) setAnalysis(result) })
      .catch((error) => { if (!cancelled) setAnalysisError(error.message) })
      .finally(() => { if (!cancelled) setAnalyzing(false) })
    return () => { cancelled = true }
  }, [repositoryRequest]);

  function handleConfigureDeployment() {
    navigate("/configure-deployment", {
      state: {
        repository: repositoryRequest,
        analysis,
      },
    });
  }

  function handleNewDeployment() {
    navigate("/new-deployment");
  }

  return (
    <div className="dashboard">
      <Sidebar userName={firstName} />

      <div className="dashboard__content">
        <Topbar
          title="Repository Analysis"
          onNewDeployment={handleNewDeployment}
        />

        <main className="analysis__main">
          <div className="analysis__container">

            <div className="analysis__breadcrumbs">
              <Link to="/dashboard">Projects</Link>
              <span>›</span>
              <Link to="/new-deployment">
                New Deployment
              </Link>
              <span>›</span>
              <span>Analysis</span>
            </div>

            <div className="analysis__heading">
              <h1>Analyzing your repository</h1>

              <div className="analysis__repository">
                <Github size={22} />

                <span>{repositoryLabel}</span>

                <span className="analysis__online-dot" />
              </div>
            </div>

            {/* Analysis box */}
            <section className="analysis-card">

              <div className="analysis-progress">
                <div
                  className={`analysis-progress__bar ${
                    analysis
                      ? "analysis-progress__bar--complete"
                      : ""
                  }`}
                  style={{
                    width: analysis
                      ? "100%"
                      : analyzing ? "40%" : "0%",
                  }}
                />
              </div>

              <div className="analysis-steps">

                {analysisSteps.map((step, index) => {
                  const completed = Boolean(analysis);
                  const active = analyzing && index === 1;

                  return (
                    <div
                      className={`analysis-step ${
                        active
                          ? "analysis-step--active"
                          : ""
                      } ${
                        completed
                          ? "analysis-step--completed"
                          : ""
                      }`}
                      key={step}
                    >
                      <div className="analysis-step__icon">
                        {completed ? (
                          <Check size={17} />
                        ) : active ? (
                          <span className="analysis-spinner" />
                        ) : (
                          <Circle size={16} />
                        )}
                      </div>

                      <span>{step}</span>

                      {completed && (
                        <Check
                          size={17}
                          className="analysis-step__check"
                        />
                      )}
                    </div>
                  );
                })}

              </div>
            </section>

            {analysisError && <div className="analysis-complete" role="alert"><div><h3>Analysis failed</h3><p>{analysisError}</p></div></div>}

            {/* Detected components */}
            {analysis && (
              <>
                <h2 className="components-title">
                  DETECTED COMPONENTS
                </h2>

                <section className="components-grid">

                  {(analysis.components || []).map((component) => (
                    <div className="component-card component-card--react" key={`${component.path}-${component.name}`}>
                      <div className="component-icon">{(component.name || '?').charAt(0).toUpperCase()}</div>
                      <h3>{component.name}</h3>
                      <p>{component.type || component.buildTool || 'Application'}</p>
                      <span>{component.path || '.'}</span>
                    </div>
                  ))}

                </section>

                <div className="analysis-complete">
                  <div className="analysis-complete__dot">
                    <span />
                  </div>

                  <div>
                    <h3>Analysis complete</h3>

                    <p>
                      {analysis.projectType || 'Project'} detected · {analysis.language || 'Language unknown'} · branch {analysis.branch}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="configure-button"
                  onClick={handleConfigureDeployment}
                >
                  Configure Deployment
                  <ArrowRight size={20} />
                </button>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
