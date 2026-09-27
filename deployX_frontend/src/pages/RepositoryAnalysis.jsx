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
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisComplete, setAnalysisComplete] =
    useState(false);

  const repository =
    location.state?.repository ||
    "https://github.com/alex/demoshop";

  useEffect(() => {
    const stored = getStoredName();
    const first = firstNameOf(stored);

    if (first) {
      setFirstName(first);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((previous) => {
        if (previous >= analysisSteps.length - 1) {
          clearInterval(timer);
          setAnalysisComplete(true);
          return previous;
        }

        return previous + 1;
      });
    }, 1100);

    return () => clearInterval(timer);
  }, []);

  function handleConfigureDeployment() {
    navigate("/configure-deployment", {
      state: {
        repository,
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

                <span>{repository}</span>

                <span className="analysis__online-dot" />
              </div>
            </div>

            {/* Analysis box */}
            <section className="analysis-card">

              <div className="analysis-progress">
                <div
                  className={`analysis-progress__bar ${
                    analysisComplete
                      ? "analysis-progress__bar--complete"
                      : ""
                  }`}
                  style={{
                    width: analysisComplete
                      ? "100%"
                      : `${Math.max(
                          8,
                          ((currentStep + 1) /
                            analysisSteps.length) *
                            100
                        )}%`,
                  }}
                />
              </div>

              <div className="analysis-steps">

                {analysisSteps.map((step, index) => {
                  const completed =
                    analysisComplete ||
                    index < currentStep;

                  const active =
                    !analysisComplete &&
                    index === currentStep;

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

            {/* Detected components */}
            {analysisComplete && (
              <>
                <h2 className="components-title">
                  DETECTED COMPONENTS
                </h2>

                <section className="components-grid">

                  <div className="component-card component-card--react">
                    <div className="component-icon">
                      R
                    </div>

                    <h3>React</h3>
                    <p>Frontend</p>
                    <span>:5173</span>
                  </div>

                  <div className="component-card component-card--spring">
                    <div className="component-icon">
                      S
                    </div>

                    <h3>Spring Boot</h3>
                    <p>Backend</p>
                    <span>:8080</span>
                  </div>

                  <div className="component-card component-card--postgres">
                    <div className="component-icon">
                      P
                    </div>

                    <h3>PostgreSQL</h3>
                    <p>Database</p>
                    <span>:5432</span>
                  </div>

                </section>

                <div className="analysis-complete">
                  <div className="analysis-complete__dot">
                    <span />
                  </div>

                  <div>
                    <h3>Analysis complete</h3>

                    <p>
                      Your deployment configuration is ready.
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