import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  Wand2
} from "lucide-react";
import api, { setAuthToken } from "./services/api";

const blankEmployee = {
  name: "",
  email: "",
  department: "Development",
  skills: "",
  performanceScore: 75,
  experience: 1
};

const blankFilters = {
  q: "",
  department: "",
  skill: "",
  minScore: ""
};

const departments = ["Development", "Design", "Marketing", "Sales", "Human Resources", "Finance", "Operations"];

function getApiError(error) {
  const data = error.response?.data;
  if (data?.errors?.length) {
    return data.errors.map((item) => `${item.field}: ${item.message}`).join(", ");
  }
  return data?.message || error.message || "Something went wrong";
}

function formatSkills(value) {
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function scoreTone(score) {
  if (score >= 85) return "excellent";
  if (score >= 70) return "strong";
  if (score >= 60) return "steady";
  return "risk";
}

export default function App() {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem("employee_ai_auth");
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [employees, setEmployees] = useState([]);
  const [employeeForm, setEmployeeForm] = useState(blankEmployee);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState(blankFilters);
  const [aiReport, setAiReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [employeeBusy, setEmployeeBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setAuthToken(auth?.token);
  }, [auth?.token]);

  useEffect(() => {
    if (!auth?.token) return undefined;
    const timer = window.setTimeout(() => fetchEmployees(), 250);
    return () => window.clearTimeout(timer);
  }, [auth?.token, filters.q, filters.department, filters.skill, filters.minScore]);

  const analytics = useMemo(() => {
    const total = employees.length;
    const average =
      total === 0
        ? 0
        : Math.round(employees.reduce((sum, employee) => sum + Number(employee.performanceScore || 0), 0) / total);
    const highPerformers = employees.filter((employee) => employee.performanceScore >= 85).length;
    const needsTraining = employees.filter((employee) => employee.performanceScore < 60).length;
    const sorted = [...employees].sort(
      (a, b) =>
        Number(b.performanceScore) + Number(b.experience) * 2 - (Number(a.performanceScore) + Number(a.experience) * 2)
    );
    const departmentCounts = employees.reduce((acc, employee) => {
      acc[employee.department] = (acc[employee.department] || 0) + 1;
      return acc;
    }, {});
    const topDepartment =
      Object.entries(departmentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "No data";

    return { average, highPerformers, needsTraining, sorted, topDepartment, total };
  }, [employees]);

  async function fetchEmployees() {
    try {
      setEmployeeBusy(true);
      setError("");
      const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ""));
      const endpoint = Object.keys(activeFilters).length ? "/employees/search" : "/employees";
      const response = await api.get(endpoint, { params: activeFilters });
      setEmployees(response.data.employees || []);
    } catch (fetchError) {
      setError(getApiError(fetchError));
    } finally {
      setEmployeeBusy(false);
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    try {
      setBusy(true);
      setError("");
      setMessage("");
      const payload =
        authMode === "signup"
          ? authForm
          : {
              email: authForm.email,
              password: authForm.password
            };
      const response = await api.post(`/auth/${authMode}`, payload);
      localStorage.setItem("employee_ai_auth", JSON.stringify(response.data));
      setAuth(response.data);
      setMessage(authMode === "signup" ? "Account created successfully." : "Welcome back.");
    } catch (authError) {
      setError(getApiError(authError));
    } finally {
      setBusy(false);
    }
  }

  async function handleEmployeeSubmit(event) {
    event.preventDefault();
    try {
      setBusy(true);
      setError("");
      setMessage("");
      const payload = {
        ...employeeForm,
        skills: formatSkills(employeeForm.skills),
        performanceScore: Number(employeeForm.performanceScore),
        experience: Number(employeeForm.experience)
      };

      if (editingId) {
        await api.put(`/employees/${editingId}`, payload);
        setMessage("Employee updated successfully.");
      } else {
        await api.post("/employees", payload);
        setMessage("Employee stored successfully.");
      }

      setEmployeeForm(blankEmployee);
      setEditingId(null);
      await fetchEmployees();
    } catch (employeeError) {
      setError(getApiError(employeeError));
    } finally {
      setBusy(false);
    }
  }

  function startEditing(employee) {
    setEditingId(employee._id);
    setEmployeeForm({
      name: employee.name,
      email: employee.email,
      department: employee.department,
      skills: employee.skills.join(", "),
      performanceScore: employee.performanceScore,
      experience: employee.experience
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeEmployee(employee) {
    const confirmed = window.confirm(`Delete ${employee.name}?`);
    if (!confirmed) return;

    try {
      setBusy(true);
      setError("");
      await api.delete(`/employees/${employee._id}`);
      setMessage("Employee removed successfully.");
      await fetchEmployees();
      setAiReport(null);
    } catch (deleteError) {
      setError(getApiError(deleteError));
    } finally {
      setBusy(false);
    }
  }

  async function generateRecommendations(employeeId) {
    try {
      setAiBusy(true);
      setError("");
      setMessage("");
      const response = await api.post("/ai/recommend", employeeId ? { employeeId } : {});
      setAiReport(response.data);
      setMessage("AI recommendations generated.");
    } catch (aiError) {
      setError(getApiError(aiError));
    } finally {
      setAiBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem("employee_ai_auth");
    setAuth(null);
    setEmployees([]);
    setAiReport(null);
    setMessage("");
    setError("");
  }

  if (!auth?.token) {
    return (
      <AuthScreen
        authForm={authForm}
        authMode={authMode}
        busy={busy}
        error={error}
        message={message}
        onChange={setAuthForm}
        onModeChange={setAuthMode}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={22} />
          </div>
          <div>
            <strong>TalentIQ</strong>
            <span>AI Performance</span>
          </div>
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          <a href="#overview" className="active">
            <LayoutDashboard size={18} />
            Overview
          </a>
          <a href="#employees">
            <Users size={18} />
            Employees
          </a>
          <a href="#ai">
            <Wand2 size={18} />
            AI Insights
          </a>
        </nav>

        <div className="profile-block">
          <div className="avatar">{auth.user.name.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{auth.user.name}</strong>
            <span>{auth.user.role.toUpperCase()}</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar" id="overview">
          <div>
            <p className="eyebrow">HR analytics workspace</p>
            <h1>Employee Performance Command Center</h1>
          </div>
          <button className="icon-text ghost" onClick={logout}>
            <LogOut size={18} />
            Logout
          </button>
        </header>

        {(message || error) && (
          <div className={`notice ${error ? "error" : "success"}`}>
            {error ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span>{error || message}</span>
          </div>
        )}

        <section className="stats-grid" aria-label="Performance summary">
          <StatBlock icon={Users} label="Employees" value={analytics.total} accent="teal" />
          <StatBlock icon={BarChart3} label="Average Score" value={`${analytics.average}%`} accent="amber" />
          <StatBlock icon={Trophy} label="High Performers" value={analytics.highPerformers} accent="rose" />
          <StatBlock icon={Building2} label="Top Department" value={analytics.topDepartment} accent="indigo" />
        </section>

        <section className="work-grid">
          <EmployeeForm
            busy={busy}
            editingId={editingId}
            employeeForm={employeeForm}
            onCancel={() => {
              setEditingId(null);
              setEmployeeForm(blankEmployee);
            }}
            onChange={setEmployeeForm}
            onSubmit={handleEmployeeSubmit}
          />

          <RecommendationPanel
            aiBusy={aiBusy}
            aiReport={aiReport}
            employees={employees}
            onGenerate={generateRecommendations}
          />
        </section>

        <section className="data-grid" id="employees">
          <div className="panel employees-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Directory</p>
                <h2>Employee List</h2>
              </div>
              <button className="icon-text soft" onClick={fetchEmployees} disabled={employeeBusy}>
                <RefreshCw size={17} />
                Refresh
              </button>
            </div>
            <FilterBar filters={filters} onChange={setFilters} onReset={() => setFilters(blankFilters)} />
            <EmployeeTable
              busy={employeeBusy}
              employees={employees}
              onDelete={removeEmployee}
              onEdit={startEditing}
              onRecommend={generateRecommendations}
            />
          </div>

          <AnalyticsPanel analytics={analytics} employees={employees} />
        </section>
      </main>
    </div>
  );
}

function AuthScreen({ authForm, authMode, busy, error, message, onChange, onModeChange, onSubmit }) {
  return (
    <main className="auth-screen">
      <section className="auth-visual">
        <div className="brand auth-brand">
          <div className="brand-mark">
            <Sparkles size={24} />
          </div>
          <div>
            <strong>TalentIQ</strong>
            <span>Employee Performance AI</span>
          </div>
        </div>
        <div className="auth-metrics">
          <div>
            <span>Promotion</span>
            <strong>Ready</strong>
          </div>
          <div>
            <span>Training</span>
            <strong>Mapped</strong>
          </div>
          <div>
            <span>Security</span>
            <strong>JWT</strong>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-header">
          <ShieldCheck size={24} />
          <div>
            <p className="eyebrow">Secure access</p>
            <h1>{authMode === "login" ? "Welcome Back" : "Create HR Account"}</h1>
          </div>
        </div>

        {(message || error) && (
          <div className={`notice ${error ? "error" : "success"}`}>
            {error ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span>{error || message}</span>
          </div>
        )}

        <form className="form-stack" onSubmit={onSubmit}>
          {authMode === "signup" && (
            <label>
              Name
              <input
                value={authForm.name}
                onChange={(event) => onChange({ ...authForm, name: event.target.value })}
                placeholder="HR Admin"
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={authForm.email}
              onChange={(event) => onChange({ ...authForm, email: event.target.value })}
              placeholder="hr@company.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={authForm.password}
              onChange={(event) => onChange({ ...authForm, password: event.target.value })}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </label>
          <button className="primary-action" disabled={busy}>
            <ShieldCheck size={18} />
            {busy ? "Please wait" : authMode === "login" ? "Login" : "Sign Up"}
          </button>
        </form>

        <button
          className="switch-auth"
          onClick={() => {
            onModeChange(authMode === "login" ? "signup" : "login");
          }}
        >
          {authMode === "login" ? "Create an account" : "Use existing account"}
        </button>
      </section>
    </main>
  );
}

function StatBlock({ accent, icon: Icon, label, value }) {
  return (
    <article className={`stat-block ${accent}`}>
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function EmployeeForm({ busy, editingId, employeeForm, onCancel, onChange, onSubmit }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Registration</p>
          <h2>{editingId ? "Update Employee" : "Add Employee"}</h2>
        </div>
        <Plus size={22} className="muted-icon" />
      </div>

      <form className="employee-form" onSubmit={onSubmit}>
        <label>
          Employee Name
          <input
            value={employeeForm.name}
            onChange={(event) => onChange({ ...employeeForm, name: event.target.value })}
            placeholder="Aman Verma"
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={employeeForm.email}
            onChange={(event) => onChange({ ...employeeForm, email: event.target.value })}
            placeholder="aman@gmail.com"
            required
          />
        </label>
        <label>
          Department
          <select
            value={employeeForm.department}
            onChange={(event) => onChange({ ...employeeForm, department: event.target.value })}
          >
            {departments.map((department) => (
              <option key={department}>{department}</option>
            ))}
          </select>
        </label>
        <label>
          Years of Experience
          <input
            type="number"
            min="0"
            step="0.5"
            value={employeeForm.experience}
            onChange={(event) => onChange({ ...employeeForm, experience: event.target.value })}
            required
          />
        </label>
        <label className="wide">
          Skills
          <input
            value={employeeForm.skills}
            onChange={(event) => onChange({ ...employeeForm, skills: event.target.value })}
            placeholder="React, Node.js, MongoDB"
            required
          />
        </label>
        <label className="wide score-control">
          Performance Score
          <div>
            <input
              type="range"
              min="0"
              max="100"
              value={employeeForm.performanceScore}
              onChange={(event) => onChange({ ...employeeForm, performanceScore: event.target.value })}
            />
            <input
              type="number"
              min="0"
              max="100"
              value={employeeForm.performanceScore}
              onChange={(event) => onChange({ ...employeeForm, performanceScore: event.target.value })}
              required
            />
          </div>
        </label>

        <div className="form-actions wide">
          <button className="primary-action" disabled={busy}>
            <Plus size={18} />
            {busy ? "Saving" : editingId ? "Update Employee" : "Add Employee"}
          </button>
          {editingId && (
            <button type="button" className="ghost" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function FilterBar({ filters, onChange, onReset }) {
  return (
    <div className="filter-bar">
      <label className="search-box">
        <Search size={18} />
        <input
          value={filters.q}
          onChange={(event) => onChange({ ...filters, q: event.target.value })}
          placeholder="Search name, email, skill"
        />
      </label>
      <select value={filters.department} onChange={(event) => onChange({ ...filters, department: event.target.value })}>
        <option value="">All departments</option>
        {departments.map((department) => (
          <option key={department} value={department}>
            {department}
          </option>
        ))}
      </select>
      <input
        value={filters.skill}
        onChange={(event) => onChange({ ...filters, skill: event.target.value })}
        placeholder="Skill"
      />
      <input
        type="number"
        min="0"
        max="100"
        value={filters.minScore}
        onChange={(event) => onChange({ ...filters, minScore: event.target.value })}
        placeholder="Min score"
      />
      <button className="ghost compact" onClick={onReset}>
        Reset
      </button>
    </div>
  );
}

function EmployeeTable({ busy, employees, onDelete, onEdit, onRecommend }) {
  if (busy) {
    return <div className="empty-state">Loading employees...</div>;
  }

  if (employees.length === 0) {
    return <div className="empty-state">No employees found.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Department</th>
            <th>Skills</th>
            <th>Score</th>
            <th>Experience</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee._id}>
              <td>
                <div className="employee-cell">
                  <div className="mini-avatar">{employee.name.slice(0, 1).toUpperCase()}</div>
                  <div>
                    <strong>{employee.name}</strong>
                    <span>
                      <Mail size={14} />
                      {employee.email}
                    </span>
                  </div>
                </div>
              </td>
              <td>{employee.department}</td>
              <td>
                <div className="skill-list">
                  {employee.skills.slice(0, 4).map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </td>
              <td>
                <span className={`score-pill ${scoreTone(employee.performanceScore)}`}>
                  {employee.performanceScore}%
                </span>
              </td>
              <td>{employee.experience} yrs</td>
              <td>
                <div className="row-actions">
                  <button title="Edit employee" onClick={() => onEdit(employee)}>
                    <Pencil size={16} />
                  </button>
                  <button title="Generate AI recommendation" onClick={() => onRecommend(employee._id)}>
                    <Sparkles size={16} />
                  </button>
                  <button title="Delete employee" onClick={() => onDelete(employee)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecommendationPanel({ aiBusy, aiReport, employees, onGenerate }) {
  return (
    <section className="panel" id="ai">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">AI recommendation</p>
          <h2>Promotion & Training</h2>
        </div>
        <button className="icon-text soft" onClick={() => onGenerate()} disabled={aiBusy || employees.length === 0}>
          <Wand2 size={17} />
          {aiBusy ? "Generating" : "Generate"}
        </button>
      </div>

      {!aiReport ? (
        <div className="ai-empty">
          <Sparkles size={32} />
          <strong>Recommendations will appear here</strong>
          <span>{employees.length} employee record(s) ready for analysis.</span>
        </div>
      ) : (
        <div className="ai-report">
          <div className="summary-line">
            <span>{aiReport.generatedBy === "external-ai" ? "External AI" : "Local AI Rules"}</span>
            <p>{aiReport.summary}</p>
          </div>

          <div className="recommendation-list">
            {(aiReport.recommendations || []).slice(0, 4).map((item) => (
              <article key={`${item.employeeId}-${item.rank}`} className="recommendation-row">
                <div className={`rank-badge ${item.priority?.toLowerCase() || "medium"}`}>#{item.rank}</div>
                <div>
                  <div className="recommendation-title">
                    <strong>{item.name}</strong>
                    <span>{item.type}</span>
                  </div>
                  <p>{item.message}</p>
                  <div className="action-chips">
                    {(item.actions || []).slice(0, 2).map((action) => (
                      <span key={action}>{action}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function AnalyticsPanel({ analytics, employees }) {
  return (
    <aside className="panel analytics-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Rankings</p>
          <h2>Performance Analytics</h2>
        </div>
        <GraduationCap size={22} className="muted-icon" />
      </div>

      <div className="analytics-stack">
        <div className="metric-row">
          <span>Average Score</span>
          <strong>{analytics.average}%</strong>
        </div>
        <div className="meter">
          <span style={{ width: `${analytics.average}%` }} />
        </div>
        <div className="metric-row">
          <span>Training Required</span>
          <strong>{analytics.needsTraining}</strong>
        </div>
      </div>

      <div className="ranking-list">
        {analytics.sorted.slice(0, 5).map((employee, index) => (
          <div className="ranking-row" key={employee._id}>
            <span>{index + 1}</span>
            <div>
              <strong>{employee.name}</strong>
              <small>{employee.department}</small>
            </div>
            <b>{employee.performanceScore}%</b>
          </div>
        ))}
      </div>

      {employees.length === 0 && <div className="empty-state compact-empty">No analytics yet.</div>}
    </aside>
  );
}
